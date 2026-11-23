FROM oven/bun:1-slim
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HTTP_PORT=80
ENV HTTPS_PORT=443
ENV ENABLE_PORT_3000=true

# Copy application runtime dependencies, bundle, and code
COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist
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
