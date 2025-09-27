# RTMP Middleware

A powerful RTMP middleware solution with a modern web interface for managing streaming destinations and monitoring live streams.

## Features

- **RTMP Server**: Nginx-based RTMP server for receiving streams
- **Stream Forwarding**: Forward streams to multiple destinations (Twitch, YouTube, etc.)
- **Web Interface**: Modern React/Next.js dashboard for management
- **Real-time Monitoring**: Live stream statistics and viewer counts
- **HLS Output**: Automatic HLS transcoding for web playback
- **Docker Ready**: Fully containerized solution

## Quick Start

### Using Docker Compose (Recommended)

1. Clone this repository:

```bash
git clone <repository-url>
cd rtmp-middleware
```

2. Copy the environment file:

```bash
cp env.example .env
```

3. Start the services:

```bash
docker-compose up -d
```

4. Access the web interface at `http://localhost:3000`
5. Access HLS/DASH and proxy via Nginx at `http://localhost:8081` (configurable via `NGINX_PORT`)

### Development Setup

1. Install dependencies:

```bash
bun install
```

2. Start the development server:

```bash
bun dev
```

3. In another terminal, start the API server:

```bash
node api-server.js
```

## Usage

### Connecting Streaming Software

Configure your streaming software (OBS, FFmpeg, etc.) with:

- **RTMP URL**: `rtmp://localhost:1935/live`
- **Stream Key**: Any unique identifier (e.g., `mystream`)

### Managing Destinations

1. Open the web interface at `http://localhost:3000`
2. Navigate to the "Destinations" tab
3. Add streaming destinations (Twitch, YouTube, etc.)
4. Toggle destinations on/off as needed

### Monitoring Streams

- **Live Streams**: View active streams and viewer counts
- **Statistics**: Monitor bandwidth usage and performance
- **Real-time Updates**: Dashboard updates every 5 seconds

## Streaming URLs

### For Streamers (Input)

```
rtmp://localhost:1935/live/YOUR_STREAM_KEY
```

### For Viewers (Output)

```
# HLS Playback (via Nginx on host)
http://localhost:8081/hls/YOUR_STREAM_KEY.m3u8

# DASH Playback (via Nginx on host)
http://localhost:8081/dash/YOUR_STREAM_KEY.mpd

# Direct RTMP (for restreaming)
rtmp://localhost:1935/live/YOUR_STREAM_KEY
```

## API Endpoints

- `GET /api/destinations` - List all destinations
- `POST /api/destinations` - Add new destination
- `PUT /api/destinations/:id` - Update destination
- `DELETE /api/destinations/:id` - Delete destination
- `GET /api/streams` - List active streams
- `GET /api/stats` - Get stream statistics
- `GET /api/health` - Server health check

## Docker Services

- **rtmp-middleware**: Main container with nginx-rtmp, Next.js app, and API server
- **redis**: Session storage and caching

## Ports

- `1935`: RTMP input port
- `3000`: Web interface
- `8080`: API server
- `80`: HTTP (HLS/DASH output and web proxy)
- `6379`: Redis

## Configuration

Edit `nginx.conf` to customize RTMP server settings:

- Chunk size
- Connection limits
- Recording settings
- Security restrictions

## Troubleshooting

### Stream Not Appearing

1. Check if the RTMP URL and stream key are correct
2. Verify firewall settings for port 1935
3. Check container logs: `docker-compose logs rtmp-middleware`

### Web Interface Not Loading

1. Ensure port 3000 is not in use
2. Check if all services are running: `docker-compose ps`
3. Verify API connectivity: `curl http://localhost:8080/api/health`

### Destinations Not Working

1. Verify destination RTMP URLs are correct
2. Check if stream keys are properly configured
3. Monitor nginx logs for push errors

## Development

### Adding Features

1. API changes: Edit `api-server.js`
2. UI changes: Edit files in `src/`
3. RTMP config: Edit `nginx.conf`

### Building for Production

```bash
# Build Next.js app
bun run build

# Build Docker image
docker build -t rtmp-middleware .

# Run with docker-compose
docker-compose up -d
```

## License

MIT License - see LICENSE file for details.
