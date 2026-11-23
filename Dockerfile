# ==============================================================================
# Multi-Stage Production Dockerfile for Campus Study Vault (Notes Space)
# Fully self-contained: builds frontend & backend without host dependencies
# ==============================================================================

# ----------------- Stage 1: Build Frontend & Install Dependencies -----------------
FROM oven/bun:1-slim AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./
RUN bun install

# Copy source code and build frontend bundle (Vite)
COPY . .
RUN bun run build

# ----------------- Stage 2: Minimal Production Runtime -----------------
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HTTP_PORT=80
ENV HTTPS_PORT=443
ENV ENABLE_PORT_3000=true

# Copy package manifests & dependencies
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy production frontend build bundle & static assets
COPY --from=builder /app/dist ./dist
COPY public ./public
COPY src ./src
COPY server.ts ./server.ts
COPY fox-idle.png ./fox-idle.png
COPY database ./database

# Ensure runtime directories exist
RUN mkdir -p /app/EncryptedUploads /app/certs /app/database

VOLUME ["/app/EncryptedUploads", "/app/database"]
EXPOSE 3000 80 443

CMD ["bun", "server.ts"]
