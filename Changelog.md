# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-09-27

### Added

- Initial release of RTMP Middleware
- RTMP server using nginx-rtmp-module
- Web interface built with Next.js 15 and shadcn/ui
- Stream destination management system
- Real-time stream monitoring and statistics
- Docker containerization with multi-service setup
- HLS and DASH output support
- API server for managing destinations and monitoring
- Responsive web dashboard with dark mode support
- Stream viewer with live preview capabilities
- Comprehensive statistics and analytics
- Health monitoring and error handling

### Features

- **RTMP Input**: Accept streams on port 1935
- **Multi-destination Streaming**: Forward to multiple RTMP servers
- **Web Dashboard**: Modern UI for configuration and monitoring
- **Real-time Updates**: Live stream status and viewer counts
- **Stream Management**: Add/edit/delete streaming destinations
- **HLS Output**: Browser-compatible video streaming
- **Statistics**: Bandwidth usage and performance metrics
- **Docker Support**: Complete containerized solution
- **API Integration**: RESTful API for external integration

### Technical Stack

- **Backend**: nginx-rtmp-module, Node.js, Express
- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Radix UI
- **Containerization**: Docker, Docker Compose
- **Storage**: Redis for caching, JSON files for configuration

### Deployment

- Single command deployment with `docker-compose up`
- Multi-service container with supervisor
- Persistent configuration storage
- Automatic service recovery

### Changed

- HTTP port mapping is now configurable via `NGINX_PORT` in `.env` and `docker-compose.yml` uses `${NGINX_PORT:-8081}:80` by default to avoid conflicts when port 80 is in use.
- Docker image now ensures `/var/log/supervisor` exists to prevent supervisord startup errors.
