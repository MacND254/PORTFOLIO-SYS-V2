import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/apiResponse';
import { SystemSettingsService } from '../services/systemSettings.service';

const DEFAULT_SETTINGS = [
  { key: 'MAINTENANCE_MODE', value: 'false', description: 'Enable platform maintenance mode (block non-admin traffic).' },
  { key: 'ALLOW_REGISTRATION', value: 'true', description: 'Allow new tenant user registrations.' },
  { key: 'MAX_CV_UPLOAD_MB', value: '10', description: 'Maximum file size allowed for CV uploads in megabytes.' },
  { key: 'OPENAI_API_KEY', value: 'sk-proj-demo-key-portfolio-saas', description: 'API Key for AI CV Parsing Service.' },
  { key: 'SMTP_HOST', value: 'smtp.mailtrap.io', description: 'SMTP Host for sending platform emails.' },
  { key: 'SMTP_PORT', value: '2525', description: 'SMTP Port for outgoing email delivery.' },
  { key: 'SMTP_USER', value: 'portfolio_saas_mailer', description: 'SMTP Username.' },
  { key: 'PLATFORM_NAME', value: 'Portfolio SaaS Enterprise', description: 'Public platform branding title.' },
];

export class SettingsAdminController {
  /** GET /api/admin/settings */
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      let settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });

      // Seed defaults if table is empty
      if (settings.length === 0) {
        await prisma.systemSetting.createMany({
          data: DEFAULT_SETTINGS,
          skipDuplicates: true,
        });
        settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
      }

      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });

      return sendSuccess({
        res,
        message: 'System settings loaded.',
        data: { settings, map },
      });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/admin/settings */
  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updates: Record<string, string> = req.body;

      const operations = Object.entries(updates).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      );

      await Promise.all(operations);

      const all = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
      return sendSuccess({
        res,
        message: 'Platform settings updated successfully.',
        data: all,
      });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/public-settings */
  public static async getPublicSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const isMaintenance = await SystemSettingsService.isMaintenanceMode();
      const allowRegistration = await SystemSettingsService.isRegistrationAllowed();
      const platformName = await SystemSettingsService.getSetting('PLATFORM_NAME', 'Portfolio SaaS Enterprise');

      return sendSuccess({
        res,
        message: 'Public settings loaded.',
        data: {
          isMaintenance,
          allowRegistration,
          platformName,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
