import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/portfolio.service';
import { PDFService } from '../services/pdf.service';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/apiResponse';

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
      // Allow public download if tenant resolves, or admin download
      const userId = req.user ? req.user.id : req.tenantUserId;
      if (!userId) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }

      const pdfBuffer = await PDFService.generateResumePdf(userId);

      // Record Download Event
      const profile = await PortfolioService.getAdminPreview(userId);
      if (profile && profile.profile) {
        AnalyticsService.recordEvent({
          profileId: profile.profile.id,
          eventType: 'DOWNLOAD_RESUME',
          visitorIp: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Resume_${profile.owner.fullName.replace(/\s+/g, '_')}.pdf`);
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
}
