import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/apiResponse';
import { prisma } from '../database/client';
import { normalizeSubdomain } from '../utils/slug';

export class AnalyticsController {
  public static async getTenantAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as '7d' | '30d' | '90d' | 'all') || '30d';
      const analytics = await AnalyticsService.getTenantAnalytics(req.user!.id, range);
      return sendSuccess({ res, message: 'Analytics metrics fetched.', data: analytics });
    } catch (error) {
      next(error);
    }
  }

  public static async trackEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { subdomain, eventType, path } = req.body;
      if (!subdomain || !eventType) {
        return res.status(400).json({ success: false, message: 'subdomain and eventType are required' });
      }

      const normSlug = normalizeSubdomain(subdomain);
      const subRecord = await prisma.subdomain.findUnique({
        where: { slug: normSlug },
        include: { user: { include: { profile: { select: { id: true } } } } },
      });

      if (subRecord?.user?.profile?.id) {
        AnalyticsService.recordEvent({
          profileId: subRecord.user.profile.id,
          eventType: eventType as any,
          visitorIp: req.ip,
          userAgent: req.get('User-Agent'),
          referrer: req.get('Referer'),
          path: path || `/p/${normSlug}`,
        });
      }

      return sendSuccess({ res, message: 'Event recorded.' });
    } catch (error) {
      next(error);
    }
  }
}
