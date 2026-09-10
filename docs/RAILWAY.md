# Railway deployment

Deploy this repository as four Railway services in one project:

| Railway service | Source | Public | Notes |
| --- | --- | --- | --- |
| `portfolio-postgres` | Railway managed PostgreSQL | No | Railway manages database persistence and backups. |
| `portfolio-redis` | Railway managed Redis | No | Used for cache and rate-limit support. |
| `portfolio-backend` | This repository, root directory `/backend` | Yes | Express API, OAuth callbacks, and uploaded files. |
| `portfolio-frontend` | This repository, root directory `/frontend` | Yes | Nginx serves the SPA and proxies `/api`, `/uploads`, and SEO routes privately to the backend. |

Use Railway's managed PostgreSQL and Redis services rather than deploying the images from `docker-compose.yml`. The Compose file remains the local-development configuration.

## Service setup

For each application service, connect the same GitHub repository and set its **Root Directory** as shown above. Railway will discover the `Dockerfile` in that directory. Generate public domains for both application services. The backend domain is required for OAuth provider callback URLs; normal browser API traffic stays same-origin through the frontend proxy.

Add the following variables to `portfolio-backend`. Replace the service names in reference variables if you chose different names in Railway.

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=${{portfolio-postgres.DATABASE_URL}}
REDIS_URL=${{portfolio-redis.REDIS_URL}}
FRONTEND_URL=https://${{portfolio-frontend.RAILWAY_PUBLIC_DOMAIN}}
BACKEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
CORS_ORIGIN=https://${{portfolio-frontend.RAILWAY_PUBLIC_DOMAIN}}
PLATFORM_DOMAIN=example.com
JWT_SECRET=<generate a long random secret>
JWT_REFRESH_SECRET=<generate a different long random secret>
SESSION_SECRET=<generate a different long random secret>
```

Add your existing optional OAuth, SMTP, and AI variables to the backend as well. If you use OAuth, register these callbacks with each provider:

```text
https://<portfolio-backend-public-domain>/api/auth/google/callback
https://<portfolio-backend-public-domain>/api/auth/github/callback
```

For `portfolio-frontend`, set:

```dotenv
PORT=8080
BACKEND_HOST=portfolio-backend.railway.internal:3000
```

The backend is intentionally fixed at port `3000` inside Railway private networking, and the frontend uses Railway's own injected/configured `PORT`. Do not set `VITE_API_URL`: the built frontend uses relative `/api` URLs so requests remain on the public frontend domain and Nginx proxies them internally.

## Persistence and health checks

Attach a Railway Volume to `portfolio-backend` at `/app/uploads`. This preserves CVs, images, and verified documents across deployments. Do not attach volumes to the managed PostgreSQL or Redis services.

Set the backend healthcheck path to `/api/health` with a 120 second timeout. Set the frontend healthcheck path to `/`. The backend container retries Prisma schema synchronization before it accepts traffic. It uses `prisma db push` because the repository does not yet contain Prisma migration files; switch the entrypoint to `prisma migrate deploy` once migrations are committed.

## Custom domain and tenant subdomains

Set `PLATFORM_DOMAIN` to the frontend's custom apex domain, for example `myportfolio.com`. Point both the apex and wildcard DNS records (`*.myportfolio.com`) at the **frontend** Railway service. This lets Nginx serve `tenant.myportfolio.com` while forwarding API calls to the backend. Add the apex and wildcard custom domains in Railway before relying on tenant URLs.

## Verify

After deployment, verify:

```text
https://<frontend-domain>/
https://<frontend-domain>/api/health
https://<backend-domain>/api/health
```

The first backend deployment creates or updates the schema but does not seed demo data. If demo data is wanted, run `node dist/database/seed.js` once from the backend Railway service shell after deployment.
