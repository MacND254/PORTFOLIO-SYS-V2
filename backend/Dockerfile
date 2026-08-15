# =============================================================
# Build context: REPO ROOT  (docker build -f backend/Dockerfile .)
# =============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy Prisma schema first (it lives at repo root)
COPY prisma ./prisma

# Install backend deps
COPY backend/package*.json ./
RUN npm ci

# Generate Prisma client (schema path relative to workdir)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy backend source and compile
COPY backend/src ./src
COPY backend/tsconfig.json ./tsconfig.json
RUN npm run build

# ── Stage 2: Production runner ────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl dumb-init && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Only pull compiled artefacts + runtime deps from builder
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/prisma        ./prisma

# Writable volume for uploaded files
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
