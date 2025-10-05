# RTMP Middleware - Codebase Summary

## Overview

RTMP Middleware is a comprehensive streaming management solution that provides:
- **RTMP Server**: Nginx-based RTMP server for receiving streams
- **Stream Forwarding**: Forward streams to multiple destinations (Twitch, YouTube, etc.)
- **Web Interface**: Modern React/Next.js dashboard for management
- **Real-time Monitoring**: Live stream statistics and viewer counts
- **HLS Output**: Automatic HLS transcoding for web playback
- **Docker Ready**: Fully containerized solution

## Architecture

### Technology Stack
- **Frontend**: Next.js 15 with React 18, TypeScript
- **Backend**: Express.js API server
- **Streaming**: Nginx with RTMP module
- **Styling**: Tailwind CSS with shadcn/ui components
- **Package Manager**: Bun (with Node.js compatibility)
- **Containerization**: Docker with Docker Compose
- **Database**: In-memory storage (Redis available for production)

### Key Components

#### 1. Frontend (Next.js App)
- **Location**: `src/app/` and `src/components/`
- **Main Pages**: Dashboard with live streams, destinations management, statistics
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **State Management**: React hooks with real-time polling
- **Form Handling**: React Hook Form with Zod validation

#### 2. Backend API (Express.js)
- **Location**: `api-server.js`
- **Features**:
  - Destination management (CRUD operations)
  - Stream monitoring and statistics
  - RTMP event handling (on_publish, on_publish_done, etc.)
  - Dynamic Nginx configuration updates
  - Health checks and monitoring

#### 3. Streaming Infrastructure
- **Location**: `nginx.conf`
- **Features**:
  - RTMP input on port 1935
  - HLS/DASH output generation
  - Dynamic destination forwarding
  - Stream recording capabilities
  - Real-time statistics via RTMP callbacks

## File Structure

```
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Main dashboard
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── destination-manager.tsx  # Destination management
│   │   ├── stream-stats.tsx        # Statistics display
│   │   ├── stream-viewer.tsx       # Stream monitoring
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utility functions
├── api-server.js          # Express API server
├── nginx.conf             # Nginx RTMP configuration
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Docker services
├── package.json           # Frontend dependencies
├── package-api.json       # Backend dependencies
├── tailwind.config.ts     # Tailwind CSS configuration
├── next.config.js         # Next.js configuration
└── tsconfig.json          # TypeScript configuration
├── Changelog.md           # Release history
├── test-setup.md          # Comprehensive testing guide
├── env.example            # Environment variables template
└── components.json        # UI component configuration
```

## Key Features

### 1. Stream Management
- **Input**: RTMP ingestion on port 1935
- **Output**: HLS/DASH for web playback, RTMP forwarding
- **Monitoring**: Real-time stream status and viewer counts
- **Recording**: Optional stream recording with FFmpeg

### 2. Destination Management
- **Multiple Destinations**: Forward to multiple platforms simultaneously
- **Dynamic Configuration**: Live updates without server restart
- **Authentication**: Support for stream keys and secure URLs
- **Toggle Control**: Enable/disable destinations on the fly

### 3. Web Dashboard
- **Real-time Updates**: 5-second polling for live data
- **Statistics**: Bandwidth usage, viewer counts, stream health
- **Connection Info**: RTMP URL and stream key configuration
- **Responsive Design**: Mobile-friendly interface

### 4. API Endpoints
- `GET /api/destinations` - List destinations
- `POST /api/destinations` - Add destination
- `PUT /api/destinations/:id` - Update destination
- `DELETE /api/destinations/:id` - Delete destination
- `GET /api/streams` - List active streams
- `GET /api/stats` - Get stream statistics
- `GET /api/health` - Health check
- RTMP callbacks: `/api/rtmp/on_publish`, `/api/rtmp/on_publish_done`, etc.

## Configuration

### Environment Variables
- `RTMP_PORT`: RTMP server port (default: 1935)
- `NGINX_PORT`: HTTP access port (default: 8081)
- `NEXT_PUBLIC_RTMP_HOST`: Client-visible RTMP host
- `RECORD_STREAMS`: Enable stream recording
- `SAVE_STREAMS`: Persist stream data

### Nginx Configuration
- **RTMP Module**: Custom-built with RTMP support
- **Dynamic Updates**: Configuration updated via API calls
- **HLS/DASH**: Built-in transcoding for web playback
- **Security**: Configurable access controls

## Development Setup

### Quick Start with Docker
```bash
# Clone and setup
cp env.example .env
docker-compose up -d

# Access web interface
http://localhost:8081
```

### Development Mode
```bash
# Install dependencies
bun install

# Start frontend
bun dev

# Start API server
node api-server.js
```

### Production Build
```bash
# Build Next.js app
bun run build

# Build Docker image
docker build -t rtmp-middleware .

# Run with compose
docker-compose up -d
```

## Testing & Validation

### Comprehensive Testing Setup

The project includes detailed testing documentation in `test-setup.md` covering:

#### 1. Development Testing
- Scripts for Windows (`start-dev.bat`) and Linux/Mac (`start-dev.sh`)
- Access points: Web interface (port 3000), API health checks

#### 2. Docker Testing
- Complete containerized testing environment
- Multi-service orchestration with Docker Compose
- Log monitoring and service status checks

#### 3. Stream Testing
- **FFmpeg test commands**: Color patterns, video files, webcam streaming
- **OBS Studio integration**: Custom server configuration
- **Multiple platform support**: Windows, Linux, Mac streaming

#### 4. Destination Testing
- Platform-specific examples (YouTube, Twitch)
- Local testing configurations
- API endpoint validation

#### 5. API Testing
- Comprehensive curl examples for all endpoints
- Health check monitoring
- Destination management workflows

#### 6. Performance Testing
- Multi-stream load testing
- Bandwidth monitoring
- CPU and memory usage analysis

#### 7. Troubleshooting Guide
- Port conflict resolution
- Docker service recovery
- Stream connectivity issues
- Web interface debugging

### Test Commands Examples

```bash
# Test stream with FFmpeg
ffmpeg -f lavfi -i testsrc=size=1280x720:rate=30 -f lavfi -i sine=frequency=1000:sample_rate=44100 -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/test

# API health check
curl http://localhost:8080/api/health

# Load testing with multiple streams
for i in {1..5}; do
  ffmpeg -f lavfi -i testsrc=size=640x480:rate=15 -f lavfi -i sine=frequency=$((1000 + i*100)):sample_rate=44100 -c:v libx264 -preset ultrafast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/stream$i &
done
```

## Usage Examples

### Streaming with OBS
```
Server: rtmp://localhost:1935/live
Stream Key: your_custom_key
```

### Web Playback
```
HLS: http://localhost:8081/hls/your_custom_key.m3u8
DASH: http://localhost:8081/dash/your_custom_key.mpd
```

### Adding Destinations
```javascript
// Example: Add Twitch destination
{
  "name": "Twitch",
  "url": "rtmp://live.twitch.tv/live/",
  "key": "your_twitch_stream_key",
  "enabled": true
}
```

## Performance & Scaling

- **Memory**: In-memory storage (can be replaced with Redis)
- **Concurrency**: Nginx worker processes configurable
- **Bandwidth**: Efficient chunk-based streaming
- **Monitoring**: Real-time statistics and health checks
- **Load Testing**: Support for multiple concurrent streams

## Security Considerations

- **RTMP Security**: Configurable access controls
- **API Security**: CORS configuration and input validation
- **Stream Keys**: Secure storage and masking in UI
- **Network Isolation**: Docker network segmentation available
- **Production Checklist**: Firewall rules, SSL/TLS, monitoring setup

## Extensibility

### Adding New Features
1. **API Changes**: Modify `api-server.js`
2. **UI Changes**: Update components in `src/components/`
3. **RTMP Config**: Edit `nginx.conf` templates
4. **New Destinations**: Add support via API endpoints

### Custom Integrations
- **Webhooks**: Add webhook support for stream events
- **Analytics**: Integrate with monitoring services
- **Authentication**: Add user authentication system
- **Storage**: Replace in-memory storage with database
- **Monitoring**: Integration with Prometheus/Grafana

## Monitoring & Logging

- **Nginx Logs**: Access and error logs in `/var/log/nginx/`
- **API Logs**: Console output from API server
- **Stream Statistics**: Real-time metrics in web dashboard
- **Health Checks**: Built-in health endpoint
- **Performance Metrics**: Bandwidth, viewer counts, stream health

## Troubleshooting

### Common Issues
1. **Stream Not Appearing**: Check RTMP URL and firewall settings
2. **Web Interface Issues**: Verify port availability
3. **Destination Errors**: Validate RTMP URLs and stream keys
4. **Configuration Problems**: Check Nginx logs for errors
5. **Port Conflicts**: Use `netstat`/`lsof` to identify occupied ports

### Debug Mode
```bash
# Run with verbose logging
docker-compose logs rtmp-middleware

# Check Nginx configuration
nginx -t -c /etc/nginx/nginx.conf

# Test API connectivity
curl http://localhost:8343/api/health

# Check service status
docker-compose ps
```

## Release History

### Version 1.0.0 (2025-09-27)
- Initial release with complete RTMP streaming solution
- Web dashboard with real-time monitoring
- Multi-destination forwarding support
- Docker containerization
- Comprehensive testing documentation

## License & Contributions

- **License**: MIT License
- **Contributions**: Welcome via GitHub issues and PRs
- **Documentation**: Comprehensive README, testing guides, and code comments
- **Support**: Detailed troubleshooting and setup guides

---

This codebase provides a robust foundation for RTMP streaming management with modern web interfaces, comprehensive testing capabilities, and scalable architecture. The extensive testing documentation ensures reliable deployment and operation in both development and production environments.