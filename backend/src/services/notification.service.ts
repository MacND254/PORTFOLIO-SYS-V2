import { prisma } from '../database/client';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service';
import { NotFoundError, ValidationError } from '../utils/errors';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: string; // 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | 'ERROR'
  category?: string; // 'SYSTEM' | 'PORTFOLIO'
  link?: string;
}

export interface BroadcastNotificationInput {
  senderId: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  link?: string;
  targetAudience: 'ALL' | 'TENANTS' | 'COMPANIES' | 'SPECIFIC';
  specificUserId?: string;
}

export interface GetNotificationsOptions {
  page?: number;
  limit?: number;
  status?: 'all' | 'unread' | 'read';
  type?: string;
  category?: string;
  search?: string;
}

export class NotificationService {
  /**
   * Create a single notification for a specific user
   */
  public static async create({
    userId,
    title,
    message,
    type = 'INFO',
    category = 'SYSTEM',
    link,
  }: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        category,
        link,
      },
    });
  }

  /**
   * Notify all active SuperAdmins about a critical platform event
   */
  public static async notifySuperAdmins({
    title,
    message,
    type = 'INFO',
    link,
  }: {
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: Role.SUPER_ADMIN, status: 'ACTIVE' },
        select: { id: true },
      });

      if (superAdmins.length === 0) return [];

      const notifications = await prisma.$transaction(
        superAdmins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title,
              message,
              type,
              category: 'SYSTEM',
              link,
            },
          })
        )
      );

      return notifications;
    } catch (err: any) {
      console.error('[notifySuperAdmins] Error broadcasting to SuperAdmins:', err.message);
      return [];
    }
  }

  /**
   * Broadcast announcements across target audiences (SuperAdmin action)
   * Recipients: if targeting TENANTS → category PORTFOLIO; otherwise SYSTEM for admins
   */
  public static async broadcast(input: BroadcastNotificationInput) {
    const {
      senderId,
      title,
      message,
      type = 'INFO',
      category,
      link,
      targetAudience,
      specificUserId,
    } = input;

    if (!title || !title.trim()) {
      throw new ValidationError('Announcement title is required.');
    }
    if (!message || !message.trim()) {
      throw new ValidationError('Announcement message is required.');
    }

    let targetUsers: { id: string; email: string; role: string }[] = [];

    switch (targetAudience) {
      case 'ALL':
        targetUsers = await prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, email: true, role: true },
        });
        break;

      case 'TENANTS':
        targetUsers = await prisma.user.findMany({
          where: { role: Role.ADMIN, status: 'ACTIVE' },
          select: { id: true, email: true, role: true },
        });
        break;

      case 'COMPANIES':
        targetUsers = await prisma.user.findMany({
          where: { role: Role.COMPANY, status: 'ACTIVE' },
          select: { id: true, email: true, role: true },
        });
        break;

      case 'SPECIFIC':
        if (!specificUserId) {
          throw new ValidationError('Specific recipient user ID or email is required.');
        }
        const singleUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: specificUserId },
              { email: specificUserId.toLowerCase().trim() },
            ],
            status: 'ACTIVE',
          },
          select: { id: true, email: true, role: true },
        });
        if (!singleUser) {
          throw new NotFoundError(`User "${specificUserId}" not found or inactive.`);
        }
        targetUsers = [singleUser];
        break;

      default:
        throw new ValidationError(`Invalid target audience: ${targetAudience}`);
    }

    if (targetUsers.length === 0) {
      return { count: 0, targetAudience, message: 'No active users found in selected audience.' };
    }

    // Determine category per user: ADMIN → PORTFOLIO, others → SYSTEM
    const createdNotifications = await prisma.$transaction(
      targetUsers.map((u) => {
        const notifCategory = category || (u.role === Role.ADMIN ? 'PORTFOLIO' : 'SYSTEM');
        return prisma.notification.create({
          data: {
            userId: u.id,
            title: title.trim(),
            message: message.trim(),
            type,
            category: notifCategory,
            link: link?.trim() || null,
          },
        });
      })
    );

    // Audit log this administrative broadcast
    await AuditService.log({
      userId: senderId,
      action: 'NOTIFICATION_BROADCAST',
      target: targetAudience,
      metadata: {
        title: title.trim(),
        type,
        recipientCount: createdNotifications.length,
        link: link?.trim() || null,
        targetAudience,
      },
    });

    return {
      count: createdNotifications.length,
      targetAudience,
      type,
      title: title.trim(),
    };
  }

  /**
   * Get paginated notifications for a user with rich filtering
   * Supports category filter: 'SYSTEM' or 'PORTFOLIO'
   */
  public static async getUserNotifications(
    userId: string,
    options: GetNotificationsOptions = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options.status === 'unread') {
      where.isRead = false;
    } else if (options.status === 'read') {
      where.isRead = true;
    }

    if (options.type && options.type !== 'ALL') {
      where.type = options.type.toUpperCase();
    }

    if (options.category && options.category !== 'ALL') {
      where.category = options.category.toUpperCase();
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages,
      pagination: { total, page, limit, totalPages },
    };
  }

  /**
   * Mark an individual notification as read
   */
  public static async markAsRead(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new NotFoundError('Notification not found.');

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  public static async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
  }

  /**
   * Delete a single notification
   */
  public static async deleteNotification(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new NotFoundError('Notification not found.');

    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Clear all notifications or only read notifications
   */
  public static async clearAll(userId: string, onlyRead: boolean = false) {
    const where: any = { userId };
    if (onlyRead) {
      where.isRead = true;
    }
    return prisma.notification.deleteMany({ where });
  }

  /**
   * SuperAdmin: Get broadcast stats and notification overview metrics
   */
  public static async getBroadcastStats() {
    const [
      totalNotifications,
      superAdminUnread,
      typeBreakdown,
      recentBroadcastLogs,
      userCountByRole,
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false, category: 'SYSTEM' } }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        where: { action: 'NOTIFICATION_BROADCAST' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    const audienceCounts = {
      TOTAL_USERS: userCountByRole.reduce((acc, curr) => acc + curr._count.id, 0),
      TENANTS: userCountByRole.find((r) => r.role === Role.ADMIN)?._count.id || 0,
      COMPANIES: userCountByRole.find((r) => r.role === Role.COMPANY)?._count.id || 0,
      SUPER_ADMINS: userCountByRole.find((r) => r.role === Role.SUPER_ADMIN)?._count.id || 0,
    };

    return {
      totalNotifications,
      unreadCount: superAdminUnread,
      unreadSuperAdmin: superAdminUnread,
      totalTenants: audienceCounts.TENANTS,
      totalCompanies: audienceCounts.COMPANIES,
      typeBreakdown: typeBreakdown.map((t) => ({ type: t.type, count: t._count.id })),
      audienceCounts,
      recentBroadcasts: recentBroadcastLogs,
    };
  }

  /**
   * Fast, lightweight unread count for user notifications
   * Returns total unread, category PORTFOLIO, and category SYSTEM
   */
  public static async getUnreadCount(userId: string) {
    const [unreadTotal, unreadPortfolio, unreadSystem] = await Promise.all([
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.count({ where: { userId, isRead: false, category: 'PORTFOLIO' } }),
      prisma.notification.count({ where: { userId, isRead: false, category: 'SYSTEM' } }),
    ]);

    return {
      unreadCount: unreadTotal,
      portfolioUnread: unreadPortfolio,
      systemUnread: unreadSystem,
    };
  }
}
