# Production Dockerfile for GRC Backend
# African Sovereignty: Optimized for African deployment environments

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application (if needed)
# RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Install necessary tools for African deployment environments
RUN apk add --no-cache \
    curl \
    tzdata \
    && cp /usr/share/zoneinfo/Africa/Johannesburg /etc/localtime \
    && echo "Africa/Johannesburg" > /etc/timezone

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app ./

# Switch to non-root user
USER nodejs

# Health check for African network conditions
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/api/v1/health || exit 1

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]