import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { normalizeSubdomain, isReservedSubdomain } from '../utils/slug';
import { config } from '../config/env';
import { NotFoundError } from '../utils/errors';

export const resolveTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let subdomain: string | null = null;

    // 1. Check custom header (useful for frontend API calls or local testing)
    const headerSubdomain = req.headers['x-tenant-subdomain'] as string;
    if (headerSubdomain) {
      subdomain = normalizeSubdomain(headerSubdomain);
    }

    // 2. Check query string fallback
    if (!subdomain && req.query.subdomain) {
      subdomain = normalizeSubdomain(req.query.subdomain as string);
    }

    // 3. Extract from Host Header
    if (!subdomain) {
      const host = req.headers.host || '';
      const hostname = host.split(':')[0]; // remove port if present

      // Host format: <subdomain>.<PLATFORM_DOMAIN>
      const platformDomain = config.platformDomain.toLowerCase();
      if (hostname.endsWith(`.${platformDomain}`) || hostname.endsWith('.localhost')) {
        const parts = hostname.split('.');
        // e.g. francis.myportfolio.com => parts = ['francis', 'myportfolio', 'com']
        // e.g. francis.localhost => parts = ['francis', 'localhost']
        if (parts.length >= 2) {
          const potentialSlug = parts[0];
          if (potentialSlug !== 'www' && potentialSlug !== 'api' && potentialSlug !== 'app' && potentialSlug !== platformDomain) {
            subdomain = normalizeSubdomain(potentialSlug);
          }
        }
      }
    }

    if (subdomain && !isReservedSubdomain(subdomain)) {
      const tenantRecord = await prisma.subdomain.findUnique({
        where: { slug: subdomain },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              profile: {
                select: {
                  id: true,
                  portfolioStatus: {
                    select: {
                      isPublished: true,
                      publishStatus: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (tenantRecord && tenantRecord.user && tenantRecord.user.status === 'ACTIVE') {
        req.tenantSubdomain = subdomain;
        req.tenantUserId = tenantRecord.user.id;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantSubdomain || !req.tenantUserId) {
    return next(new NotFoundError('Tenant portfolio not found or inactive.'));
  }
  next();
};
