# =============================================================
# Build context: backend directory (Railway Root Directory: /backend)
# =============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl poppler-utils

WORKDIR /app

# Copy package manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (includes devDependencies required for build & tsc)
RUN npm install

# Copy source and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Fallback DATABASE_URL so prisma generate succeeds during build without live DB
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma Client & compile TypeScript to ./dist
RUN npx prisma generate
RUN npm run build
RUN cp ./src/swagger.json ./dist/swagger.json

# ── Stage 2: Production runner ────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl dumb-init poppler-utils && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema so runtime commands (like prisma db push / migrate) work
COPY --from=builder /app/prisma ./prisma

# Copy compiled artifacts and runtime dependencies
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json

# Writable volume for uploaded files
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
