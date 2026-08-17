import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/apiResponse';

export class NotificationController {
  /** GET /api/notifications */
  public static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      let notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Seed starter notification if empty
      if (notifications.length === 0) {
        await prisma.notification.create({
          data: {
            userId: req.user!.id,
            title: 'Welcome to Portfolio SaaS!',
            message: 'Upload your CV or choose from 20 profession themes to publish your live website.',
            type: 'SUCCESS',
            link: '/admin/customizer',
          },
        });
        notifications = await prisma.notification.findMany({
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
        });
      }

      const unreadCount = notifications.filter((n: any) => !n.isRead).length;

      return sendSuccess({
        res,
        message: 'Notifications fetched.',
        data: { notifications, unreadCount },
      });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/notifications/:id/read */
  public static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user!.id },
        data: { isRead: true },
      });
      return sendSuccess({ res, message: 'Notification marked as read.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/notifications/read-all */
  public static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true },
      });
      return sendSuccess({ res, message: 'All notifications marked as read.', data: updated });
    } catch (error) {
      next(error);
    }
  }
}
