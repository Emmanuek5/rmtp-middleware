# Multi-stage build for Next.js app using Bun
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install Node.js + npm in builder too (needed for Next.js build)
RUN apk add --no-cache nodejs npm

# Build-time public envs for Next.js
ARG NEXT_PUBLIC_RTMP_HOST
ARG NEXT_PUBLIC_RTMP_PORT
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_RTMP_HOST=${NEXT_PUBLIC_RTMP_HOST}
ENV NEXT_PUBLIC_RTMP_PORT=${NEXT_PUBLIC_RTMP_PORT}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Install dependencies with Bun
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Build app (Next.js needs npm available here)
COPY . .
RUN bun run build

# Production image with nginx-rtmp, Bun, Node.js + npm
FROM alpine:3.20 AS runner

# Install nginx with RTMP module, supervisor, ffmpeg, curl
RUN apk add --no-cache nginx nginx-mod-rtmp supervisor ffmpeg curl \
  && mkdir -p /run/nginx

# Install Node.js + npm (for runtime if needed)
RUN apk add --no-cache nodejs npm

# Copy Bun binary from builder
COPY --from=builder /usr/local/bin/bun /usr/local/bin/bun

# Create app directory
WORKDIR /app

# Copy built Next.js app
RUN mkdir -p /app/next
COPY --from=builder /app/.next/standalone /app/next
COPY --from=builder /app/.next/static /app/next/.next/static

# Copy public assets if present
RUN mkdir -p /app/next/public
COPY --from=builder /app/public /app/next/public

# Copy API server files
COPY api-server.js ./ 
COPY package-api.json ./package.json

# Install API server dependencies with Bun (or npm if you prefer)
RUN bun install --production

# Copy configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create log + stream directories
RUN mkdir -p /var/log/nginx /var/lib/nginx /run/nginx /tmp/hls /tmp/dash /var/log/supervisor

# Expose ports
EXPOSE 1935 80 3000 8080

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
