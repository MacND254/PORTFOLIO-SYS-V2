import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { PortfolioService } from '../services/portfolio.service';
import { ProfileService } from '../services/profile.service';
import { PDFService } from '../services/pdf.service';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';

export class PortfolioController {
  public static async getPublicPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const subdomain = req.tenantSubdomain || (req.params.subdomain as string);
      const portfolio = await PortfolioService.getPublicPortfolioBySubdomain(subdomain);

      // Record Analytics Event (VIEW)
      if (portfolio.profile && portfolio.profile.id) {
        AnalyticsService.recordEvent({
          profileId: portfolio.profile.id,
          eventType: 'VIEW',
          visitorIp: req.ip,
          userAgent: req.get('User-Agent'),
          referrer: req.get('Referer'),
          path: req.path,
        });
      }

      return sendSuccess({
        res,
        message: 'Public portfolio loaded.',
        data: portfolio,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const portfolio = await PortfolioService.getAdminPreview(req.user!.id);
      return sendSuccess({
        res,
        message: 'Portfolio preview loaded.',
        data: portfolio,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCustomization(req: Request, res: Response, next: NextFunction) {
    try {
      const customization = await PortfolioService.updateCustomization(req.user!.id, req.body);
      return sendSuccess({
        res,
        message: 'Portfolio customization saved.',
        data: customization,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async publishPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { isPublished } = req.body;
      const status = await PortfolioService.publishPortfolio(req.user!.id, isPublished ?? true);
      return sendSuccess({
        res,
        message: isPublished ? 'Portfolio published successfully!' : 'Portfolio unpublished.',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async changeSubdomain(req: Request, res: Response, next: NextFunction) {
    try {
      const { newSubdomain } = req.body;
      const updated = await PortfolioService.changeSubdomain(req.user!.id, newSubdomain);
      return sendSuccess({
        res,
        message: `Subdomain changed successfully to ${updated.slug}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async downloadPdfResume(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedSubdomain = req.tenantSubdomain || String(req.query.subdomain || '').trim();
      if (!requestedSubdomain) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }

      const templateStyle = String(req.query.template || req.query.style || 'modern').toLowerCase();

      let targetUserId: string | null = null;
      let ownerFullName = 'Resume';
      let profileId: string | null = null;

      // Allow authenticated owner or superadmin to download even if portfolio is unpublished
      if (req.user) {
        const normSlug = requestedSubdomain.toLowerCase().trim();
        const subRecord = await prisma.subdomain.findUnique({
          where: { slug: normSlug },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                profile: { select: { id: true } },
              },
            },
          },
        });

        if (subRecord && subRecord.user && (subRecord.user.id === req.user.id || req.user.role === 'SUPER_ADMIN')) {
          targetUserId = subRecord.user.id;
          ownerFullName = subRecord.user.fullName;
          profileId = subRecord.user.profile?.id || null;
        }
      }

      // If not owner/super admin, enforce active published status
      if (!targetUserId) {
        const portfolio = await PortfolioService.getPublicPortfolioBySubdomain(requestedSubdomain);
        targetUserId = portfolio.profile.userId;
        ownerFullName = portfolio.owner.fullName;
        profileId = portfolio.profile.id;
      }

      if (!targetUserId) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }

      const pdfBuffer = await PDFService.generateResumePdf(targetUserId, templateStyle);

      if (profileId) {
        const recentEvent = await prisma.analyticsEvent.findFirst({
          where: {
            profileId,
            eventType: 'DOWNLOAD_RESUME',
            timestamp: { gte: new Date(Date.now() - 5000) },
            ...(req.ip ? { visitorIp: req.ip } : {}),
          },
        });
        if (!recentEvent) {
          AnalyticsService.recordEvent({
            profileId,
            eventType: 'DOWNLOAD_RESUME',
            visitorIp: req.ip,
            userAgent: req.get('User-Agent'),
          });
        }
      }

      const ownerName = ownerFullName
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'Resume';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Disposition', `attachment; filename="${ownerName}_Resume.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  public static async getQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user ? req.user.id : req.tenantUserId;
      if (!userId) return res.status(404).json({ message: 'Portfolio not found' });

      const profile = await PortfolioService.getAdminPreview(userId);
      const url = `https://${profile.subdomain}.${process.env.PLATFORM_DOMAIN || 'localhost'}`;
      const qrDataUrl = await PDFService.generateQrCodeDataUrl(url);

      return sendSuccess({
        res,
        message: 'QR code generated.',
        data: { qrDataUrl, portfolioUrl: url },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getRevisions(req: Request, res: Response, next: NextFunction) {
    try {
      const revisions = await PortfolioService.getRevisions(req.user!.id);
      return sendSuccess({ res, message: 'Portfolio revisions loaded.', data: revisions });
    } catch (error) {
      next(error);
    }
  }

  public static async restoreRevision(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PortfolioService.restoreRevision(req.user!.id, req.params.revisionId);
      return sendSuccess({ res, message: 'Revision restored.', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async unlockVerifiedDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const subdomain = req.tenantSubdomain || (req.params.subdomain as string);
      const { key } = req.body;
      if (!key) throw new ValidationError('Access key is required.');

      const result = await ProfileService.unlockVerifiedDocumentsByPublicSubdomain(subdomain, key);
      return sendSuccess({
        res,
        message: 'Verified documents unlocked successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getSitemap(req: Request, res: Response, next: NextFunction) {
    try {
      const { SeoService } = await import('../services/seo.service');
      const xml = await SeoService.generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.send(xml);
    } catch (error) {
      next(error);
    }
  }

  public static async getRobots(req: Request, res: Response, next: NextFunction) {
    try {
      const { SeoService } = await import('../services/seo.service');
      const subdomain = req.tenantSubdomain || (req.params.subdomain as string);
      const txt = SeoService.generateRobotsTxt(subdomain);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(txt);
    } catch (error) {
      next(error);
    }
  }

  public static async getManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { SeoService } = await import('../services/seo.service');
      const subdomain = req.tenantSubdomain || (req.params.subdomain as string);
      const manifest = await SeoService.generateManifestJson(subdomain);
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      return res.json(manifest);
    } catch (error) {
      next(error);
    }
  }
}

