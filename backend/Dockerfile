# ── Backend Dockerfile ────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (separate layer for caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

# Healthcheck — Docker marks the container unhealthy if the API stops responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api || exit 1

CMD ["node", "server.js"]
