import { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from '../services/systemSettings.service';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isMaintenance = await SystemSettingsService.isMaintenanceMode();
    if (!isMaintenance) {
      return next();
    }

    // Always allow super admin settings, auth login, and super admin users
    const path = req.path.toLowerCase();
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/logout') || path.includes('/auth/me');
    const isAdminSettings = path.includes('/admin/settings');
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (isAuthRoute || isAdminSettings || isSuperAdmin) {
      return next();
    }

    return res.status(503).json({
      status: 'error',
      statusCode: 503,
      message: 'Platform is currently undergoing scheduled maintenance. Please check back shortly.',
      isMaintenance: true,
    });
  } catch (error) {
    next();
  }
};
