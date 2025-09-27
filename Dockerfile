# Multi-stage build for Next.js app
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN corepack enable bun && bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable bun && bun run build

# Production image with nginx-rtmp and Node.js
FROM nginx:alpine AS runner

# Install Node.js and dependencies for runtime
RUN apk add --no-cache nodejs npm supervisor ffmpeg

# Copy nginx-rtmp module
RUN apk add --no-cache nginx-mod-rtmp

# Create app directory
WORKDIR /app

# Copy built Next.js app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy API server files
COPY api-server.js ./
COPY package-api.json ./package.json

# Install API server dependencies
RUN npm install

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create directories for RTMP
RUN mkdir -p /var/log/nginx /var/lib/nginx /tmp/hls /tmp/dash

# Expose ports
EXPOSE 1935 80 3000 8080

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
