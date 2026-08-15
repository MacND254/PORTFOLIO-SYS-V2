# Portfolio SaaS Platform

> A production-ready **multi-tenant CV & Professional Portfolio SaaS** — upload your resume, let AI extract your profile, pick from 20 profession themes, and publish at your own subdomain.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [How To Run](#how-to-run)
   - [Option A — Docker Compose (Recommended)](#option-a--docker-compose-recommended)
   - [Option B — Local Development (No Docker)](#option-b--local-development-no-docker)
6. [Database Seeding](#database-seeding)
7. [Demo Credentials](#demo-credentials)
8. [API Reference](#api-reference)
9. [Architecture Decisions](#architecture-decisions)
10. [Deployment Notes](#deployment-notes)

---

## Overview

| Feature                  | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **AI CV Parsing**        | Upload PDF/DOCX resume → AI extracts work experience, education, skills, projects    |
| **20 Profession Themes** | Software Engineer, Data Scientist, Cybersecurity, Lawyer, Doctor, Designer, and more |
| **Personal Subdomains**  | Each tenant publishes at `yourname.myportfolio.com`                                  |
| **Testimonial System**   | Clients submit reviews via shareable link; owner moderates before publish            |
| **PDF + QR Resume**      | One-click download of a professionally formatted resume PDF with QR code             |
| **Analytics Dashboard**  | Track views, downloads, contact messages, and testimonials                           |
| **Super Admin Panel**    | Platform-wide tenant management, user suspension, audit logs                         |
| **Multi-Tenancy**        | Full data isolation per tenant via Prisma + JWT RBAC                                 |

---

## Tech Stack

| Layer                  | Technology                                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| **Frontend**           | React 18, Vite, TypeScript, Tailwind CSS v3, Recharts, React Router v6 |
| **Backend**            | Node.js, Express, TypeScript, Prisma ORM                               |
| **Database**           | PostgreSQL 16                                                          |
| **Cache / Rate Limit** | Redis 7                                                                |
| **Auth**               | JWT (RS256), bcryptjs                                                  |
| **AI**                 | OpenAI API (GPT-4o-mini) for CV enhancement                            |
| **Files**              | Multer (local disk); swap `storage.service.ts` for S3 in prod          |
| **Containerisation**   | Docker + Docker Compose, Nginx (SPA + reverse proxy)                   |

---

## Project Structure

```
PORTFOLIO-SYS/
├── prisma/
│   └── schema.prisma              # Shared DB schema (all models)
│
├── backend/
│   ├── src/
│   │   ├── config/                # env.ts, logger.ts, redis.ts
│   │   ├── database/              # client.ts, seed.ts
│   │   ├── middleware/            # auth, rbac, tenant, error, upload, rateLimit
│   │   ├── services/              # auth, profile, cv, ai, portfolio, pdf, review,
│   │   │                          #   message, analytics, theme, audit, notification
│   │   ├── controllers/           # One controller per domain
│   │   ├── routes/                # Modular Express routers
│   │   ├── validators/            # Zod schemas
│   │   ├── utils/                 # apiResponse, errors, slug
│   │   ├── app.ts                 # Express app + middleware stack
│   │   └── server.ts              # HTTP server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Axios instance + interceptors
│   │   ├── context/AuthContext.tsx
│   │   ├── components/
│   │   │   ├── ui/                # Button, Modal, Spinner
│   │   │   ├── auth/              # ProtectedRoute
│   │   │   ├── layout/            # Sidebar, Navbar
│   │   │   ├── admin/             # CompletenessBar, SubdomainUrlBadge
│   │   │   └── portfolio/         # ThemeEngine, QrModal, ReviewModal
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── PublicPortfolioPage.tsx
│   │   │   ├── admin/             # Dashboard, CvImport, Customizer, Profile,
│   │   │   │                      #   Reviews, Messages, Analytics
│   │   │   └── superadmin/        # SuperAdminDashboard, UserManagement
│   │   ├── types/index.ts         # Shared TypeScript interfaces
│   │   └── App.tsx                # Router with lazy-loaded routes
│   ├── nginx.conf                 # SPA + API proxy config
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml             # Production: 4 services (postgres, redis, backend, frontend)
├── docker-compose.override.yml   # Dev: exposes extra ports
├── .dockerignore
├── .env.example                   # All required env variables documented
├── Makefile                       # Convenience commands
└── README.md
```

---

## Environment Setup

```powershell
# 1. Clone the repo
git clone https://github.com/your-username/PORTFOLIO-SYS.git
cd PORTFOLIO-SYS

# 2. Copy the example env file and fill in your values
cp .env.example .env
```

**Minimum required variables to change in `.env`:**

| Variable            | Description                                         |
| ------------------- | --------------------------------------------------- |
| `POSTGRES_PASSWORD` | Strong password for the DB                          |
| `JWT_SECRET`        | Long random string (min 32 chars)                   |
| `PLATFORM_DOMAIN`   | Your base domain, e.g. `myportfolio.com`            |
| `AI_API_KEY`        | OpenAI API key (optional — AI CV enhancement)       |
| `SMTP_*`            | SMTP credentials for email notifications (optional) |

---

## How To Run

### Option A — Docker Compose (Recommended)

> **Requirements:** Docker Desktop ≥ 24 and Docker Compose v2

```powershell
# 1. Build and start all 4 services (postgres, redis, backend, frontend)
docker compose up --build -d

# 2. Seed the database with demo data (first run only)
docker compose exec backend node dist/database/seed.js

# 3. Open the platform
start http://localhost:3080
```

**Service URLs after startup:**

| Service            | URL                                          | Notes                           |
| ------------------ | -------------------------------------------- | ------------------------------- |
| Platform Landing   | `http://localhost:3080`                      | Public marketing page           |
| Admin Login        | `http://localhost:3080/login`                | Sign in to dashboard            |
| Demo Portfolio     | `http://localhost:3080/p/francis`            | Francis Mwangi's live portfolio |
| Tenant Dashboard   | `http://localhost:3080/admin/dashboard`      | After login                     |
| Super Admin Panel  | `http://localhost:3080/superadmin/dashboard` | Super Admin role only           |
| Backend API        | `http://localhost:3001/api`                  | Direct backend Express API      |
| API Docs (Swagger) | `http://localhost:3001/api-docs`             | Interactive API documentation   |

**Stop everything:**

```powershell
docker compose down
```

**Using Make (shorthand):**

```powershell
make up       # Start all services
make seed     # Seed demo data
make logs     # Follow all logs in real-time
make restart  # Rebuild images and restart
make clean    # ⚠️  Wipe all containers AND volumes (data loss)
```

---

### Option B — Local Development (No Docker)

> **Requirements:** Node.js ≥ 20, PostgreSQL 16, Redis 7 running locally

#### 1. Install dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. Set up the database

```powershell
cd backend

# Push Prisma schema to your local PostgreSQL
npm run db:push

# OR use Prisma migrations (recommended for team workflows)
npx prisma migrate dev --name init --schema=../prisma/schema.prisma
```

#### 3. Seed demo data

```powershell
# From the backend directory
npm run db:seed
```

#### 4. Start the backend

```powershell
# From the backend directory
npm run dev
# → Express API running on http://localhost:3000
# → Swagger UI at   http://localhost:3000/api/docs
```

#### 5. Start the frontend

```powershell
# From the frontend directory (new terminal)
npm run dev
# → Vite dev server on http://localhost:5173
# → /api requests are proxied to :3000 automatically
```

#### 6. Open in browser

| URL                                          | What                            |
| -------------------------------------------- | ------------------------------- |
| `http://localhost:5173`                      | Landing page                    |
| `http://localhost:5173/login`                | Admin sign-in                   |
| `http://localhost:5173/register`             | New tenant registration         |
| `http://localhost:5173/p/francis`            | Demo portfolio (Francis Mwangi) |
| `http://localhost:5173/admin/dashboard`      | Tenant admin panel              |
| `http://localhost:5173/superadmin/dashboard` | Super Admin panel               |
| `http://localhost:3000/api/docs`             | Swagger API docs                |

---

## Database Seeding

The seed script populates:

- ✅ **Super Admin** account
- ✅ **Francis Mwangi** — demo tenant with a full published portfolio
- ✅ **20 profession themes** (Software Engineer, Data Scientist, Cybersecurity, etc.)
- ✅ Sample work experience, skills, projects, and approved testimonials

```powershell
# Docker
docker compose exec backend node dist/database/seed.js

# Local
cd backend && npm run db:seed
```

> ⚠️ Safe to run multiple times — uses `upsert` to avoid duplicates.

---

## Demo Credentials

| Account         | Email                        | Password         | Access                 |
| --------------- | ---------------------------- | ---------------- | ---------------------- |
| **Test Tenant** | `francis@example.com`        | `ChangeMe@12345` | Tenant admin dashboard |
| **Super Admin** | `superadmin@myportfolio.com` | `ChangeMe@12345` | Full platform admin    |

> 🔒 Change these credentials immediately in any non-local environment.

---

## API Reference

Full interactive docs available at `/api/docs` (Swagger UI).

| Method | Route                              | Auth        | Description                        |
| ------ | ---------------------------------- | ----------- | ---------------------------------- |
| `POST` | `/api/auth/register`               | —           | Register new tenant account        |
| `POST` | `/api/auth/login`                  | —           | Sign in, returns JWT               |
| `GET`  | `/api/auth/me`                     | JWT         | Get current user                   |
| `GET`  | `/api/profile`                     | JWT         | Get own profile                    |
| `PUT`  | `/api/profile`                     | JWT         | Update general bio                 |
| `POST` | `/api/profile/experiences`         | JWT         | Add work experience                |
| `POST` | `/api/profile/skills`              | JWT         | Add skill                          |
| `POST` | `/api/profile/projects`            | JWT         | Add project                        |
| `POST` | `/api/cv/upload`                   | JWT         | Upload CV file for AI processing   |
| `GET`  | `/api/cv/extraction`               | JWT         | Get latest AI extraction result    |
| `POST` | `/api/cv/import`                   | JWT         | Import extracted data into profile |
| `GET`  | `/api/themes`                      | —           | List all 20 portfolio themes       |
| `GET`  | `/api/portfolio/public/:subdomain` | —           | Fetch public portfolio data        |
| `PUT`  | `/api/portfolio/customization`     | JWT         | Update theme/customization         |
| `POST` | `/api/portfolio/publish`           | JWT         | Toggle portfolio published state   |
| `POST` | `/api/portfolio/subdomain`         | JWT         | Change subdomain slug              |
| `GET`  | `/api/portfolio/pdf`               | —           | Download portfolio as PDF          |
| `GET`  | `/api/reviews`                     | JWT         | List own reviews                   |
| `PUT`  | `/api/reviews/:id/moderate`        | JWT         | Approve / reject / delete          |
| `POST` | `/api/reviews/public/:profileId`   | —           | Submit public review               |
| `GET`  | `/api/messages`                    | JWT         | List contact messages              |
| `POST` | `/api/messages/public`             | —           | Submit contact message             |
| `GET`  | `/api/analytics/tenant`            | JWT         | Tenant analytics data              |
| `GET`  | `/api/admin/overview`              | SUPER_ADMIN | Platform-wide metrics              |
| `GET`  | `/api/admin/users`                 | SUPER_ADMIN | List all tenant accounts           |
| `PUT`  | `/api/admin/users/:id/status`      | SUPER_ADMIN | Suspend / activate user            |
| `GET`  | `/api/health`                      | —           | System health check                |

---

## Architecture Decisions

| Concern            | Decision                                                       | Rationale                                                                                   |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Multi-tenancy**  | Subdomain-based tenant resolution via `Host` header middleware | Clean URL separation; Nginx wildcard DNS handles routing                                    |
| **Auth**           | JWT in `Authorization` header                                  | Stateless; works across microservices; upgrade to HttpOnly cookie for browser XSS hardening |
| **RBAC**           | `role` field on `User` model + `requireRole()` middleware      | Simple for 2-role system (TENANT_ADMIN / SUPER_ADMIN)                                       |
| **AI CV Parsing**  | OpenAI GPT-4o-mini via structured prompts                      | Cost-effective; falls back gracefully if key not set                                        |
| **PDF Generation** | PDFKit (server-side)                                           | No headless browser overhead; renders instantly                                             |
| **QR Codes**       | `qrcode` library (Node) + `qrcode.react` (browser)             | Generated server-side for PDF, client-side for live display                                 |
| **Theme Engine**   | Single `ThemeEngine.tsx` with theme-aware utility functions    | One render path, theme differences isolated to helper fns                                   |
| **File Storage**   | Multer → local disk → named Docker volume                      | Swap `storage.service.ts` for AWS S3 in production                                          |

---

## Deployment Notes

### Wildcard Subdomain DNS

For `yourname.myportfolio.com` to work in production, configure:

1. **DNS**: Add a wildcard `A` record: `*.myportfolio.com → your-server-ip`
2. **Nginx** (on the host or as a container): Route all `*.myportfolio.com` to the frontend container on port 80
3. **SSL**: Use Certbot with `--wildcard` flag for a single certificate covering all subdomains

### Production Checklist

- [ ] Change `JWT_SECRET` to a cryptographically random 64-char string
- [ ] Set `POSTGRES_PASSWORD` to a strong password
- [ ] Configure real SMTP credentials for email notifications
- [ ] Set `PLATFORM_DOMAIN` to your actual domain
- [ ] Enable SSL / HTTPS (wildcard certificate)
- [ ] Configure S3 or equivalent for file storage (swap `storage.service.ts`)
- [ ] Set up log aggregation (Winston → Datadog / Logtail)
- [ ] Remove `docker-compose.override.yml` in CI/CD
- [ ] Run `make clean` (wipe) is destructive — never in production
