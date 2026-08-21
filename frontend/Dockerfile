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

# Default backend host for Nginx template (works on Railway and local Docker)
ENV BACKEND_HOST=portfolio-backend.railway.internal:3000

# Copy our custom Nginx config as template for automatic envsubst by nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Also provide static fallback config in case templates are not evaluated
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
