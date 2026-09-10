# =============================================================
# Build context: frontend directory
# =============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build
# Output → /app/dist

# ── Stage 2: Production Nginx server ─────────────────────────
FROM nginx:stable-alpine AS runner

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Defaults used by the Nginx template. Railway overrides PORT at runtime and the
# frontend service supplies BACKEND_HOST over Railway private networking.
ENV BACKEND_HOST=portfolio-backend.railway.internal:3000
ENV PORT=80

# Copy our custom Nginx config as template for automatic envsubst by nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
