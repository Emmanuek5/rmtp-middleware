#!/bin/bash

echo "🏗️  Building RTMP Middleware"

# Build Next.js application
echo "📦 Building Next.js application..."
bun run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t rtmp-middleware:latest .

echo "✅ Build complete!"
echo ""
echo "To run the application:"
echo "  docker-compose up -d"
echo ""
echo "To access:"
echo "  • Web Interface: http://localhost:3000"
echo "  • RTMP Input: rtmp://localhost:1935/live/YOUR_STREAM_KEY"
