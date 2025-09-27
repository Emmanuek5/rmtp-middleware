# RTMP Middleware Test Setup

## Testing the Complete System

### 1. Development Testing

**Start Development Environment:**

```bash
# On Windows
start-dev.bat

# On Linux/Mac
chmod +x start-dev.sh
./start-dev.sh
```

**Access Points:**

- Web Interface: http://localhost:3000
- API Health Check: http://localhost:8080/api/health

### 2. Docker Testing

**Build and Run:**

```bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f rtmp-middleware
```

**Access Points:**

- Web Interface: http://localhost:3000
- RTMP Input: rtmp://localhost:1935/live/YOUR_STREAM_KEY
- HLS Output: http://localhost/hls/YOUR_STREAM_KEY.m3u8

### 3. Stream Testing

#### Using FFmpeg (Test Stream)

```bash
# Test with a color pattern
ffmpeg -f lavfi -i testsrc=size=1280x720:rate=30 -f lavfi -i sine=frequency=1000:sample_rate=44100 -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/test

# Test with a video file
ffmpeg -re -i input_video.mp4 -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/testvideo

# Stream webcam (Windows)
ffmpeg -f dshow -i video="Your Webcam":audio="Your Microphone" -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/webcam

# Stream webcam (Linux)
ffmpeg -f v4l2 -i /dev/video0 -f alsa -i default -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/webcam

# Stream webcam (Mac)
ffmpeg -f avfoundation -i "0:0" -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/webcam
```

#### Using OBS Studio

1. Open OBS Studio
2. Go to Settings > Stream
3. Set Service to "Custom..."
4. Set Server to: `rtmp://localhost:1935/live`
5. Set Stream Key to: `obs-test`
6. Click Apply and OK
7. Start Streaming

### 4. Testing Destinations

#### Add Test Destinations via Web Interface:

**YouTube Live (Example):**

- Name: YouTube
- URL: rtmp://a.rtmp.youtube.com/live2
- Key: [Your YouTube Stream Key]

**Twitch (Example):**

- Name: Twitch
- URL: rtmp://live.twitch.tv/live
- Key: [Your Twitch Stream Key]

**Local RTMP Server (Testing):**

- Name: Local Test
- URL: rtmp://127.0.0.1:1936/live
- Key: test-output

### 5. API Testing

**Using curl:**

```bash
# Health check
curl http://localhost:8080/api/health

# List destinations
curl http://localhost:8080/api/destinations

# Add a destination
curl -X POST http://localhost:8080/api/destinations \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Destination","url":"rtmp://test.example.com/live","key":"testkey","enabled":true}'

# List active streams
curl http://localhost:8080/api/streams

# Get statistics
curl http://localhost:8080/api/stats
```

### 6. Troubleshooting

#### Common Issues:

**Port Already in Use:**

```bash
# Check what's using the ports
netstat -ano | findstr :1935
netstat -ano | findstr :3000
netstat -ano | findstr :8080

# On Linux/Mac
lsof -i :1935
lsof -i :3000
lsof -i :8080
```

**Docker Issues:**

```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check container logs
docker-compose logs rtmp-middleware
docker-compose logs redis
```

**Stream Not Appearing:**

1. Check if RTMP server is running
2. Verify firewall allows port 1935
3. Check nginx error logs
4. Ensure stream key matches

**Web Interface Not Loading:**

1. Check if Next.js server is running on port 3000
2. Verify API server is running on port 8080
3. Check browser console for errors
4. Ensure all dependencies are installed

### 7. Performance Testing

**Load Testing with Multiple Streams:**

```bash
# Start multiple test streams
for i in {1..5}; do
  ffmpeg -f lavfi -i testsrc=size=640x480:rate=15 -f lavfi -i sine=frequency=$((1000 + i*100)):sample_rate=44100 -c:v libx264 -preset ultrafast -tune zerolatency -c:a aac -f flv rtmp://localhost:1935/live/stream$i &
done

# Monitor CPU and memory usage
top
htop  # If available
```

**Bandwidth Monitoring:**

- Monitor network usage during streaming
- Check HLS segment generation
- Verify multiple destination forwarding

### 8. Production Checklist

Before deploying to production:

- [ ] Configure proper firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain names
- [ ] Set up monitoring and alerts
- [ ] Configure backup and recovery
- [ ] Test failover scenarios
- [ ] Set up log rotation
- [ ] Configure security settings
- [ ] Test with real streaming software
- [ ] Verify performance under load
