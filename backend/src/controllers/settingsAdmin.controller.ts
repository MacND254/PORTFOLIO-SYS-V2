import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/apiResponse';
import { SystemSettingsService } from '../services/systemSettings.service';
import { MailService } from '../services/mail.service';

const DEFAULT_SETTINGS = [
  { key: 'MAINTENANCE_MODE', value: 'false', description: 'Enable platform maintenance mode (block non-admin traffic).' },
  { key: 'ALLOW_REGISTRATION', value: 'true', description: 'Allow new tenant user registrations.' },
  { key: 'MAX_CV_UPLOAD_MB', value: '10', description: 'Maximum file size allowed for CV uploads in megabytes.' },
  { key: 'OPENAI_API_KEY', value: 'sk-proj-demo-key-portfolio-saas', description: 'API Key for AI CV Parsing Service.' },
  // 1. Portfolio Messages Forwarding Gateway
  { key: 'SMTP_HOST', value: 'smtp.gmail.com', description: 'Portfolio Gateway: Host' },
  { key: 'SMTP_PORT', value: '587', description: 'Portfolio Gateway: Port' },
  { key: 'SMTP_SECURE', value: 'false', description: 'Portfolio Gateway: SSL' },
  { key: 'SMTP_USER', value: '', description: 'Portfolio Gateway: Username' },
  { key: 'SMTP_PASS', value: '', description: 'Portfolio Gateway: Password' },
  { key: 'SMTP_FROM_EMAIL', value: 'noreply@myportfolio.com', description: 'Portfolio Gateway: From Email' },
  { key: 'SMTP_FROM_NAME', value: 'Portfolio SaaS Mailer', description: 'Portfolio Gateway: From Name' },
  // 2. Security & Password Reset Mail Gateway
  { key: 'SMTP_RESET_HOST', value: 'smtp.gmail.com', description: 'Password Reset Gateway: Host' },
  { key: 'SMTP_RESET_PORT', value: '587', description: 'Password Reset Gateway: Port' },
  { key: 'SMTP_RESET_SECURE', value: 'false', description: 'Password Reset Gateway: SSL' },
  { key: 'SMTP_RESET_USER', value: '', description: 'Password Reset Gateway: Username' },
  { key: 'SMTP_RESET_PASS', value: '', description: 'Password Reset Gateway: Password' },
  { key: 'SMTP_RESET_FROM_EMAIL', value: 'security@myportfolio.com', description: 'Password Reset Gateway: From Email' },
  { key: 'SMTP_RESET_FROM_NAME', value: 'Portfolio Security & Password Reset Gateway', description: 'Password Reset Gateway: From Name' },
  { key: 'PLATFORM_NAME', value: 'Portfolio SaaS Enterprise', description: 'Public platform branding title.' },
];

export class SettingsAdminController {
  /** GET /api/admin/settings */
  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure all default settings exist in database
      await prisma.systemSetting.createMany({
        data: DEFAULT_SETTINGS,
        skipDuplicates: true,
      });

      const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });

      const map: Record<string, string> = {};
      settings.forEach((s: any) => { map[s.key] = s.value; });

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

  /** POST /api/admin/settings/test-email */
  public static async testSmtpConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const recipientEmail = req.body.recipientEmail || req.user?.email || 'test@example.com';
      const gatewayType: 'portfolio' | 'reset' = req.body.gatewayType === 'reset' ? 'reset' : 'portfolio';
      const result = await MailService.sendTestEmail(recipientEmail, gatewayType);
      if (!result.success) {
        return res.status(400).json({ success: false, message: result.message });
      }
      return sendSuccess({
        res,
        message: result.message,
        data: result,
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
