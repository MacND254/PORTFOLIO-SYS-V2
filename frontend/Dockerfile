# =============================================================
# Build context: frontend directory
# =============================================================

# ── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Vite substitutes VITE_* values at build time. Railway exposes service
# variables to the build, but Docker requires an ARG before they can be used.
ARG VITE_PLATFORM_DOMAIN
ENV VITE_PLATFORM_DOMAIN=${VITE_PLATFORM_DOMAIN}

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
# DNS_RESOLVER defaults to supporting both local Docker (127.0.0.11) and Railway ([fd12::10]).
ENV BACKEND_HOST=portfolio-backend.railway.internal:3000
ENV PORT=80
ENV DNS_RESOLVER="127.0.0.11 [fd12::10]"

# Copy our custom Nginx config as template for automatic envsubst by nginx:alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
