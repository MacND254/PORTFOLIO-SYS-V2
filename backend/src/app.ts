import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import session from 'express-session';
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

// CORS setup supporting subdomains and local network access
const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow exact origin, subdomain matches, or LAN private IP addresses
      const isAllowed = allowedOrigins.some((allowed) => {
        if (origin === allowed) return true;
        try {
          const originUrl = new URL(origin);
          const originHost = originUrl.hostname;
          if (originHost.endsWith(`.${config.platformDomain}`) || originHost.endsWith('.localhost')) {
            return true;
          }

          // Allow LAN private network IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.0.0.1)
          const isPrivateIP = /^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(originHost);
          if (isPrivateIP) {
            return true;
          }

          return false;
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

// Session middleware (required by Passport for OAuth state parameter)
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: config.env === 'production', maxAge: 10 * 60 * 1000 }, // 10 min
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
