import { prisma } from '../database/client';

export class SystemSettingsService {
  public static async getSetting(key: string, defaultValue: string = ''): Promise<string> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
      });
      return setting ? setting.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  public static async isMaintenanceMode(): Promise<boolean> {
    const val = await this.getSetting('MAINTENANCE_MODE', 'false');
    return val === 'true';
  }

  public static async isRegistrationAllowed(): Promise<boolean> {
    const val = await this.getSetting('ALLOW_REGISTRATION', 'true');
    return val === 'true';
  }
}
