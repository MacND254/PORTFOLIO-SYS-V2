import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';

export class NotificationController {
  /**
   * GET /api/notifications
   * Query params: page, limit, status ('all'|'unread'|'read'), type, search
   */
  public static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, type, category, search } = req.query;

      const result = await NotificationService.getUserNotifications(req.user!.id, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        status: status as any,
        type: type as string,
        category: category as string,
        search: search as string,
      });

      return sendSuccess({
        res,
        message: 'Notifications fetched.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  public static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await NotificationService.getUnreadCount(req.user!.id);
      return sendSuccess({ res, message: 'Unread counts fetched.', data: counts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  public static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Notification marked as read.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  public static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await NotificationService.markAllAsRead(req.user!.id);
      return sendSuccess({ res, message: 'All notifications marked as read.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  public static async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.deleteNotification(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Notification deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/clear/all?onlyRead=true
   */
  public static async clearAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyRead = req.query.onlyRead === 'true';
      const result = await NotificationService.clearAll(req.user!.id, onlyRead);
      return sendSuccess({
        res,
        message: onlyRead ? 'Read notifications cleared.' : 'All notifications cleared.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/broadcast
   * (SuperAdmin Only)
   */
  public static async broadcastNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, message, type, link, targetAudience, specificUserId } = req.body;

      const result = await NotificationService.broadcast({
        senderId: req.user!.id,
        title,
        message,
        type,
        link,
        targetAudience: targetAudience || 'ALL',
        specificUserId,
      });

      return sendSuccess({
        res,
        statusCode: 201,
        message: `Notification broadcast sent to ${result.count} recipient(s).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/superadmin/stats
   * (SuperAdmin Only)
   */
  public static async getBroadcastStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await NotificationService.getBroadcastStats();
      return sendSuccess({
        res,
        message: 'Broadcast and notification statistics loaded.',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
