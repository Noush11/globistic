# ── Globistic preview image ───────────────────────────────────
# Single-stage image tuned for an easy `docker compose up` preview.
FROM node:20-bookworm-slim

WORKDIR /app

# OpenSSL is required by Prisma's query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (including dev deps — needed for prisma CLI, tsx & build).
COPY package*.json ./
RUN npm ci --include=dev

# Copy source and generate the Prisma client.
COPY . .
RUN npx prisma generate

# Build the Next.js app. Placeholder secrets satisfy the production env guard;
# real values are injected at runtime via docker-compose.
ENV NODE_ENV=production
ENV JWT_SECRET=build-time-placeholder
ENV APP_SECRET=build-time-placeholder
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build

EXPOSE 3000

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
