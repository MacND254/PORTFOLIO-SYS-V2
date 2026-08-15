import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AnalyticsService } from '../services/analytics.service';
import { AuditService } from '../services/audit.service';
import { sendSuccess } from '../utils/apiResponse';

export class AdminController {
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getUsers({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 15,
        search: req.query.search as string,
        role: req.query.role as any,
        status: req.query.status as any,
      });
      return sendSuccess({ res, message: 'Users fetched.', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserDetails(req.params.id);
      return sendSuccess({ res, message: 'User details fetched.', data: user });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const updated = await UserService.updateUserStatus(req.params.id, status, req.user!.id);
      return sendSuccess({ res, message: `User status changed to ${status}`, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const updated = await UserService.updateUserRole(req.params.id, role, req.user!.id);
      return sendSuccess({ res, message: `User role changed to ${role}`, data: updated });
    } catch (error) {
      next(error);
    }
  }

  public static async forceResetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { newPassword } = req.body;
      const result = await UserService.forceResetPassword(req.params.id, newPassword, req.user!.id);
      return sendSuccess({ res, message: result.message, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getPlatformAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getSuperAdminPlatformAnalytics();
      return sendSuccess({ res, message: 'Platform analytics fetched.', data: analytics });
    } catch (error) {
      next(error);
    }
  }

  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await AuditService.getLogs({
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        userId: req.query.userId as string,
        action: req.query.action as string,
      });
      return sendSuccess({ res, message: 'Audit logs fetched.', data: logs });
    } catch (error) {
      next(error);
    }
  }

  public static async getSystemHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await AnalyticsService.getSystemHealth();
      return sendSuccess({ res, message: 'System health check completed.', data: health });
    } catch (error) {
      next(error);
    }
  }
}
