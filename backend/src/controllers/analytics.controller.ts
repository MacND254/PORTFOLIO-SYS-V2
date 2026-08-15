import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/apiResponse';

export class AnalyticsController {
  public static async getTenantAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await AnalyticsService.getTenantAnalytics(req.user!.id);
      return sendSuccess({ res, message: 'Analytics metrics fetched.', data: analytics });
    } catch (error) {
      next(error);
    }
  }
}
