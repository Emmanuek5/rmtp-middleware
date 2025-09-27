#!/bin/bash

# Development startup script for RTMP Middleware

echo "🚀 Starting RTMP Middleware Development Environment"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is required but not installed. Please install bun first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    bun install
fi

# Create necessary directories
mkdir -p streams logs config

echo "🔧 Starting API server..."
node api-server.js &
API_PID=$!

echo "🎨 Starting Next.js development server..."
bun dev &
WEB_PID=$!

echo "✅ Services started:"
echo "   • Web Interface: http://localhost:3000"
echo "   • API Server: http://localhost:8080"
echo "   • RTMP Endpoint: rtmp://localhost:1935/live/YOUR_STREAM_KEY"
echo ""
echo "💡 Note: For full functionality, run with Docker:"
echo "   docker-compose up -d"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap to kill processes on exit
trap "echo 'Stopping services...'; kill $API_PID $WEB_PID; exit" INT

# Wait for user to stop
wait
