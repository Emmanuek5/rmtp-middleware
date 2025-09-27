@echo off
echo 🚀 Starting RTMP Middleware Development Environment

REM Check if bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun is required but not installed. Please install bun first.
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    bun install
)

REM Create necessary directories
if not exist "streams" mkdir streams
if not exist "logs" mkdir logs
if not exist "config" mkdir config

echo 🔧 Starting API server...
start /b node api-server.js

echo 🎨 Starting Next.js development server...
start /b bun dev

echo ✅ Services started:
echo    • Web Interface: http://localhost:3000
echo    • API Server: http://localhost:8080
echo    • RTMP Endpoint: rtmp://localhost:1935/live/YOUR_STREAM_KEY
echo.
echo 💡 Note: For full functionality, run with Docker:
echo    docker-compose up -d
echo.
echo Press any key to stop all services
pause >nul

REM Stop services
taskkill /f /im node.exe >nul 2>nul
echo Services stopped.
