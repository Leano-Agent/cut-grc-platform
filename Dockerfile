# Production Dockerfile for Ngome Backend
# African Sovereignty: Optimized for African deployment environments

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package*.json ./

# Copy backend package files
COPY src/backend/package*.json src/backend/

# Ensure shared workspace has a package.json (may be empty dir in repo)
RUN mkdir -p src/shared && if [ ! -f src/shared/package.json ]; then echo '{"name":"@ngome/shared","version":"1.0.0","private":true}' > src/shared/package.json; fi

# Install all workspace dependencies
RUN npm install --workspaces --include-workspace-root

# Copy full source
COPY . .

# Build backend
WORKDIR /app/src/backend
RUN npm run build

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

WORKDIR /app

# Copy workspace config and built backend
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src/backend/package*.json src/backend/
COPY --from=builder --chown=nodejs:nodejs /app/src/backend/dist src/backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/src/shared src/shared
# npm workspaces hoist all node_modules to root — copy once, Node.js resolves upward
COPY --from=builder --chown=nodejs:nodejs /app/node_modules node_modules

# Switch to non-root user
USER nodejs

# Health check for African network conditions
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

EXPOSE 3000

WORKDIR /app/src/backend
CMD ["node", "dist/server.js"]
