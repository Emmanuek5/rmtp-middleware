# Multi-stage build for Next.js app using Bun
FROM oven/bun:1-alpine AS builder
WORKDIR /app
# Build-time public envs for Next.js
ARG NEXT_PUBLIC_RTMP_HOST
ARG NEXT_PUBLIC_RTMP_PORT
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RTMP_HOST=${NEXT_PUBLIC_RTMP_HOST}
ENV NEXT_PUBLIC_RTMP_PORT=${NEXT_PUBLIC_RTMP_PORT}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install
# Build app (uses NEXT_PUBLIC_* env)
COPY . .
RUN bun run build

# Production image with nginx-rtmp and Bun (Alpine packages to match module versions)
FROM alpine:3.20 AS runner

# Install nginx with RTMP module, supervisor, ffmpeg; add Bun
RUN apk add --no-cache nginx nginx-mod-rtmp supervisor ffmpeg \
  && mkdir -p /run/nginx

# Copy Bun binary from builder stage
COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun

# Copy nginx-rtmp module
RUN apk add --no-cache nginx-mod-rtmp

# Create app directory
WORKDIR /app

# Copy built Next.js app into a dedicated directory to avoid dependency conflicts
RUN mkdir -p /app/next
COPY --from=builder /app/.next/standalone /app/next
COPY --from=builder /app/.next/static /app/next/.next/static
# Copy public assets only if present
RUN mkdir -p /app/next/public
COPY --from=builder /app/public /app/next/public

# Copy API server files
COPY api-server.js ./
COPY package-api.json ./package.json

# Install API server dependencies with Bun
RUN bun install --production

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create directories for RTMP and supervisor logs
RUN mkdir -p /var/log/nginx /var/lib/nginx /run/nginx /tmp/hls /tmp/dash /var/log/supervisor

# Expose ports
EXPOSE 1935 80 3000 8080

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
