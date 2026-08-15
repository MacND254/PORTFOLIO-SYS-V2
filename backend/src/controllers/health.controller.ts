import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class HealthController {
  public static async getHealth(req: Request, res: Response) {
    const health = await AnalyticsService.getSystemHealth();
    return res.status(health.status === 'HEALTHY' ? 200 : 503).json({
      success: true,
      data: health,
    });
  }
}
