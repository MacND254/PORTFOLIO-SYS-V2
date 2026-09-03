# =============================================================
# Build context: REPO ROOT  (docker build -f backend/Dockerfile .)
# =============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl poppler-utils

WORKDIR /app

# Copy Prisma schema (it lives at repo root)
COPY prisma ./prisma

# Copy backend package manifests
COPY backend/package*.json ./backend/

# Install backend deps inside ./backend
WORKDIR /app/backend
RUN npm install

# Copy backend source and tsconfig
COPY backend/src ./src
COPY backend/tsconfig.json ./tsconfig.json

# Fallback DATABASE_URL so prisma generate succeeds during build without live DB
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Build backend (prebuild runs prisma generate --schema=../prisma/schema.prisma, then tsc compiles to ./dist)
RUN npm run build
RUN cp ./src/swagger.json ./dist/swagger.json

# ── Stage 2: Production runner ────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl dumb-init poppler-utils && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema so runtime commands (like prisma db push / migrate) work
COPY --from=builder /app/prisma ./prisma

# Copy compiled artefacts and runtime deps to /app
COPY --from=builder /app/backend/dist          ./dist
COPY --from=builder /app/backend/node_modules  ./node_modules
COPY --from=builder /app/backend/package.json  ./package.json

# Symlink /app/backend/node_modules -> /app/node_modules for prisma schema output resolution
RUN mkdir -p /app/backend && ln -s /app/node_modules /app/backend/node_modules

# Writable volume for uploaded files
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

