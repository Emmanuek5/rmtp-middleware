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

// Configuration file paths
const DESTINATIONS_FILE = "/app/config/destinations.json";
const NGINX_CONF_TEMPLATE = "/etc/nginx/nginx.conf.template";
const NGINX_CONF = "/etc/nginx/nginx.conf";

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

// Update nginx configuration with current destinations
function updateNginxConfig() {
  try {
    let nginxConfig = fs.readFileSync("/etc/nginx/nginx.conf", "utf8");

    // Find the live application block and update push directives
    const pushDirectives = destinations
      .filter((dest) => dest.enabled)
      .map((dest) => `            push ${dest.url};`)
      .join("\n");

    // Replace existing push directives
    nginxConfig = nginxConfig.replace(
      /(\s+)push rtmp:\/\/localhost:1935\/hls;[\s\S]*?(?=\n\s+# Enable statistics)/,
      `$1push rtmp://localhost:1935/hls;\n${pushDirectives}\n`
    );

    fs.writeFileSync("/etc/nginx/nginx.conf", nginxConfig);

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
  res.json(activeStreams);
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

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_publish_done", (req, res) => {
  const { name } = req.body;
  console.log(`Stream ended: ${name}`);

  activeStreams = activeStreams.filter((stream) => stream.name !== name);
  delete streamStats[name];

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_play", (req, res) => {
  const { name } = req.body;
  console.log(`Viewer connected to: ${name}`);

  if (streamStats[name]) {
    streamStats[name].viewers++;
  }

  res.status(200).send("OK");
});

app.post("/api/rtmp/on_play_done", (req, res) => {
  const { name } = req.body;
  console.log(`Viewer disconnected from: ${name}`);

  if (streamStats[name]) {
    streamStats[name].viewers = Math.max(0, streamStats[name].viewers - 1);
  }

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
