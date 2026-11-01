# Multi-stage Dockerfile for Campus Study Vault
FROM oven/bun:1-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install

# Copy source code and build production assets
COPY . .
RUN bun run build

# Production runtime container
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime files
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/fox-idle.png ./fox-idle.png

# Ensure upload directory exists
RUN mkdir -p /app/EncryptedUploads

VOLUME ["/app/EncryptedUploads"]
EXPOSE 3000

CMD ["bun", "server.ts"]
