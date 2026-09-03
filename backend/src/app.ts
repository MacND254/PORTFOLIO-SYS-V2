import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { createClient } from 'ioredis';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { logger } from './config/logger';
import { configurePassport } from './config/passport';
import apiRouter from './routes';
import { errorHandler } from './middleware/error.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import swaggerDocument from './swagger.json';

const app = express();

// Trust reverse proxy (Railway, Render, Nginx, Cloudflare) for SSL termination and secure cookies
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow image/file downloads across ports
  })
);

// CORS setup supporting subdomains
const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow exact origin or subdomain matches
      const isAllowed = allowedOrigins.some((allowed) => {
        if (origin === allowed) return true;
        try {
          const originHost = new URL(origin).hostname;
          return originHost.endsWith(`.${config.platformDomain}`) || originHost.endsWith('.localhost');
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(null, true); // Permissive in dev fallback
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Redis-backed Session Store ───────────────────────────────────────────────
// Required for Passport OAuth state to survive across replicas and restarts.
// Falls back gracefully to MemoryStore in environments where Redis is unavailable.
let sessionStore: session.Store | undefined = undefined;

try {
  const RedisStore = connectRedis(session);
  const redisClient = new createClient(config.redisUrl);
  redisClient.on('error', (err) => logger.warn(`Redis session store error: ${err.message}. OAuth may be unstable.`));
  sessionStore = new RedisStore({ client: redisClient as any, prefix: 'sess:' });
  logger.info('OAuth session store: Redis');
} catch (err: any) {
  logger.warn(`Could not connect Redis session store: ${err.message}. Using MemoryStore (not suitable for production).`);
}

// Session middleware (required by Passport for OAuth state parameter)
app.use(
  session({
    store: sessionStore,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.env === 'production', // HTTPS only in production
      httpOnly: true,
      sameSite: config.env === 'production' ? 'none' : 'lax', // 'none' needed for cross-site OAuth redirects
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  })
);

// Passport OAuth strategies
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Static file serving for uploads (CVs and Images)
app.use('/uploads', express.static(config.storagePath));

// Global Rate Limiter
app.use('/api', globalRateLimiter);
app.use('/api/v1', globalRateLimiter);

// OpenAPI Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Primary API Router (supports both /api and /api/v1 prefixes)
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// Health check root alias
app.get('/health', (_req, res) => {
  res.redirect('/api/health');
});

// Root SEO & PWA Discovery routes
app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const { SeoService } = await import('./services/seo.service');
    const xml = await SeoService.generateSitemapXml();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.send(xml);
  } catch (err) {
    next(err);
  }
});

app.get('/robots.txt', async (req, res) => {
  const { SeoService } = await import('./services/seo.service');
  const txt = SeoService.generateRobotsTxt(req.hostname.split('.')[0]);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(txt);
});

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Multi-Tenant CV & Professional Portfolio SaaS API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health',
    sitemap: '/sitemap.xml',
    robots: '/robots.txt',
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
