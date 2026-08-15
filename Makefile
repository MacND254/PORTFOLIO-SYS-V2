# ─────────────────────────────────────────────────────────────
#  Portfolio SaaS — Makefile
#  Usage: make <target>
# ─────────────────────────────────────────────────────────────

.PHONY: help up down build logs seed restart clean dev-backend dev-frontend

# ── Help ──────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  Portfolio SaaS — Available Commands"
	@echo "  ─────────────────────────────────────"
	@echo "  make up            Start all Docker services (detached)"
	@echo "  make down          Stop and remove all containers"
	@echo "  make build         Rebuild all Docker images"
	@echo "  make logs          Follow logs from all services"
	@echo "  make logs-backend  Follow backend logs only"
	@echo "  make seed          Run database seed (demo data)"
	@echo "  make restart       Rebuild + restart everything"
	@echo "  make clean         Remove containers, volumes, and images"
	@echo "  make dev-backend   Run backend in dev mode (local)"
	@echo "  make dev-frontend  Run frontend in dev mode (local)"
	@echo ""

# ── Docker Operations ─────────────────────────────────────────
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

restart: down build up

# Seed the database with demo data (Super Admin + Francis Mwangi tenant)
seed:
	docker compose exec backend sh -c "cd /app && node dist/database/seed.js"

# Full wipe (removes named volumes — ALL DATA LOST)
clean:
	docker compose down -v --rmi all --remove-orphans

# ── Local Development (no Docker) ─────────────────────────────
dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev
