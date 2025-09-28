const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for destinations and streams (use Redis in production)
let destinations = [];
let activeStreams = [];
let streamStats = {};

// Persistence settings
const shouldPersistStreams = process.env.SAVE_STREAMS !== 'false';
const shouldRecordStreams = process.env.RECORD_STREAMS !== 'false';

// Configuration file paths
const DESTINATIONS_FILE = "/app/config/destinations.json";
const STREAMS_FILE = "/app/config/streams.json";
const NGINX_CONF_TEMPLATE = "/etc/nginx/nginx.conf.template";
const NGINX_CONF = "/etc/nginx/nginx.conf";
const NGINX_ACCESS_LOG = "/var/log/nginx/access.log";

// Ensure config directory exists
const configDir = path.dirname(DESTINATIONS_FILE);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Load destinations from file
function loadDestinations() {
  try {
    if (fs.existsSync(DESTINATIONS_FILE)) {
      const data = fs.readFileSync(DESTINATIONS_FILE, "utf8");
      destinations = JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading destinations:", error);
    destinations = [];
  }
}

// Save destinations to file
function saveDestinations() {
  try {
    fs.writeFileSync(DESTINATIONS_FILE, JSON.stringify(destinations, null, 2));
  } catch (error) {
    console.error("Error saving destinations:", error);
  }
}

// Load streams from file
function loadStreams() {
  if (!shouldPersistStreams) return;
  try {
    if (fs.existsSync(STREAMS_FILE)) {
      const data = fs.readFileSync(STREAMS_FILE, "utf8");
      const parsed = JSON.parse(data);
      activeStreams = parsed.activeStreams || [];
      streamStats = parsed.streamStats || {};
    }
  } catch (error) {
    console.error("Error loading streams:", error);
    activeStreams = [];
    streamStats = {};
  }
}

// Save streams to file
function saveStreams() {
  if (!shouldPersistStreams) return;
  try {
    const toSave = { activeStreams, streamStats };
    fs.writeFileSync(STREAMS_FILE, JSON.stringify(toSave, null, 2));
  } catch (error) {
    console.error("Error saving streams:", error);
  }
}

// Parse nginx access log time like: 27/Sep/2025:21:37:30 +0000
function parseNginxTime(dateStr) {
  try {
    const match = dateStr.match(
      /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})/
    );
    if (!match) return null;
    const [, dd, mon, yyyy, hh, mm, ss, tz] = match;
    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const offsetSign = tz[0] === "-" ? -1 : 1;
    const offsetHours = parseInt(tz.slice(1, 3), 10);
    const offsetMins = parseInt(tz.slice(3, 5), 10);
    const utc = Date.UTC(
      parseInt(yyyy, 10),
      months[mon],
      parseInt(dd, 10),
      parseInt(hh, 10),
      parseInt(mm, 10),
      parseInt(ss, 10)
    );
    const offsetMs = offsetSign * (offsetHours * 60 + offsetMins) * 60 * 1000;
    return new Date(utc - offsetMs);
  } catch {
    return null;
  }
}

// Estimate HLS viewers by counting distinct client IPs requesting a stream's HLS
function getHlsViewerCounts(windowSeconds = 20) {
  const results = {};
  try {
    if (!fs.existsSync(NGINX_ACCESS_LOG)) return results;
    const content = fs.readFileSync(NGINX_ACCESS_LOG, "utf8");
    const lines = content.split(/\r?\n/).slice(-5000); // tail recent lines
    const now = Date.now();
    for (const line of lines) {
      // combined log contains: ip - - [date] "GET /hls/<name>..." status bytes ...
      const m = line.match(
        /^(\S+)\s+\S+\s+\S+\s+\[([^\]]+)\]\s+"\S+\s+(\S+)\s+HTTP\/[0-9.]"\s+(\d{3})/
      );
      if (!m) continue;
      const ip = m[1];
      const timeStr = m[2];
      const path = m[3];
      const status = parseInt(m[4], 10);
      if (status >= 400) continue;
      const dt = parseNginxTime(timeStr);
      if (!dt) continue;
      if (now - dt.getTime() > windowSeconds * 1000) continue;
      const hls = path.match(/^/hls/(.+?)\.(m3u8|ts)$/);
      if (!hls) continue;
      const streamName = hls[1];
      if (!results[streamName]) results[streamName] = new Set();
      results[streamName].add(ip);
    }
  } catch (err) {
    console.error("Error parsing HLS viewers:", err);
  }
  // convert sets to counts
  const counts = {};
  for (const [k, set] of Object.entries(results)) counts[k] = set.size;
  return counts;
}

// Update nginx configuration with current destinations
function updateNginxConfig() {
  try {
    let nginxConfig = fs.readFileSync(NGINX_CONF_TEMPLATE, "utf8");

    const pushDirectives = destinations
      .filter((dest) => dest.enabled)
      .map((dest) => {
        const base = (dest.url || "").replace(/\\/+$/, "");
        const keyPart = dest.key ? `/${dest.key}` : "";
        return `            push ${base}${keyPart};`;
      })
      .join("\n");

    // Inject between DESTINATIONS_START and DESTINATIONS_END markers
    nginxConfig = nginxConfig.replace(
      /(\s*# DESTINATIONS_START[\s\S]*# DESTINATIONS_END)/,
      `            # DESTINATIONS_START\n${pushDirectives}\n            # DESTINATIONS_END`
    );

    let recordExec = '';
    if (shouldRecordStreams) {
      recordExec = `            exec /usr/bin/ffmpeg -re -i rtmp://localhost/live/$name -c copy -f segment -segment_time 300 -segment_format mp4 -strftime 1 /streams/$name/$name-%Y%m%d_%H%M%S.mp4;`;
    }

    // Inject between RECORD_START and RECORD_END markers
    nginxConfig = nginxConfig.replace(
      /(\s*# RECORD_START[\s\S]*# RECORD_END)/,
      `            # RECORD_START\n${recordExec}\n            # RECORD_END`
    );

    fs.writeFileSync(NGINX_CONF, nginxConfig);

    // Reload nginx configuration
    exec("nginx -s reload", (error) => {
      if (error) {
        console.error("Error reloading nginx:", error);
      } else {
        console.log("Nginx configuration reloaded");
      }
    });
  } catch (error) {
    console.error("Error updating nginx config:", error);
  }
}

// Initialize
loadDestinations();
loadStreams();

if (shouldRecordStreams) {
  activeStreams.forEach(({ name }) => {
    const streamDir = path.join('/streams', name);
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }
  });
}

updateNginxConfig();

// API Routes

// Get all destinations
app.get("/api/destinations", (req, res) => {
  res.json(destinations);
});

// Add new destination
app.post("/api/destinations", (req, res) => {
  const { name, url, key, enabled = true } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: "Name and URL are required" });
  }

  const destination = {
    id: Date.now().toString(),
    name,
    url,
    key: key || "",
    enabled,
    createdAt: new Date().toISOString(),
  };

  destinations.push(destination);
  saveDestinations();
  updateNginxConfig();

  res.status(201).json(destination);
});

// Update destination
app.put("/api/destinations/:id", (req, res) => {
  const { id } = req.params;
  const { name, url, key, enabled } = req.body;

  const index = destinations.findIndex((dest) => dest.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }

  destinations[index] = {
    ...destinations[index],
    name: name || destinations[index].name,
    url: url || destinations[index].url,
    key: key !== undefined ? key : destinations[index].key,
    enabled: enabled !== undefined ? enabled : destinations[index].enabled,
    updatedAt: new Date().toISOString(),
  };

  saveDestinations();
  updateNginxConfig();

  res.json(destinations[index]);
});

// Delete destination
app.delete("/api/destinations/:id", (req, res) => {
  const { id } = req.params;

  const index = destinations.findIndex((dest) => dest.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }

  destinations.splice(index, 1);
  saveDestinations();
  updateNginxConfig();

  res.status(204).send();
});

// Get active streams
app.get("/api/streams", (req, res) => {
  const viewerCounts = getHlsViewerCounts(30);
  const enriched = activeStreams.map((s) => ({
    ...s,
    viewers: viewerCounts[s.name] ?? s.viewers ?? 0,
  }));
  res.json(enriched);
});

// Get stream statistics
app.get("/api/stats", (req, res) => {
  res.json(streamStats);
});

// RTMP event handlers
app.post("/api/rtmp/on_publish", (req, res) => {
  const { name, addr, app } = req.body;
  console.log(`Stream started: ${name} from ${addr} on ${app}`);

  const stream = {
    name,
    addr,
    app,
    startTime: new Date().toISOString(),
    viewers: 0,
  };

  activeStreams.push(stream);
  streamStats[name] = {
    startTime: stream.startTime,
    bytesIn: 0,
    bytesOut: 0,
    viewers: 0,
  };

  if (shouldRecordStreams) {
    const streamDir = path.join('/streams', name);
    if (!fs.existsSync(streamDir)) {
      fs.mkdirSync(streamDir, { recursive: true });
    }
  }

  saveStreams();

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_publish_done", (req, res) => {
  const { name } = req.body;
  console.log(`Stream ended: ${name}`);

  activeStreams = activeStreams.filter((stream) => stream.name !== name);
  delete streamStats[name];

  saveStreams();

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_play", (req, res) => {
  const { name } = req.body;
  console.log(`Viewer connected to: ${name}`);

  if (streamStats[name]) {
    streamStats[name].viewers++;
  }

  saveStreams();

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_play_done", (req, res) => {
  const { name } = req.body;
  console.log(`Viewer disconnected from: ${name}`);

  if (streamStats[name]) {
    streamStats[name].viewers = Math.max(0, streamStats[name].viewers - 1);
  }

  saveStreams();

  res.status(200).send("OK");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    destinations: destinations.length,
    activeStreams: activeStreams.length,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;
