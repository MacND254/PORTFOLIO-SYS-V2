import { prisma } from '../database/client';
import { getRedisStatus } from '../config/redis';

export class AnalyticsService {
  public static async recordEvent({
    profileId,
    eventType,
    visitorIp,
    userAgent,
    referrer,
    deviceType,
    browser,
    path,
  }: {
    profileId: string;
    eventType: 'VIEW' | 'DOWNLOAD_RESUME' | 'CONTACT_SUBMIT' | 'REVIEW_SUBMIT';
    visitorIp?: string;
    userAgent?: string;
    referrer?: string;
    deviceType?: string;
    browser?: string;
    path?: string;
  }) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          profileId,
          eventType,
          visitorIp,
          userAgent,
          referrer,
          deviceType: deviceType || 'Desktop',
          browser,
          path: path || '/',
        },
      });
    } catch (e) {
      console.error('Failed to record analytics event:', e);
    }
  }

  public static async getTenantAnalytics(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;

    const [totalViews, totalDownloads, totalContacts, totalReviews, recentEvents] = await Promise.all([
      prisma.analyticsEvent.count({ where: { profileId: profile.id, eventType: 'VIEW' } }),
      prisma.analyticsEvent.count({ where: { profileId: profile.id, eventType: 'DOWNLOAD_RESUME' } }),
      prisma.contactMessage.count({ where: { profileId: profile.id } }),
      prisma.review.count({ where: { profileId: profile.id } }),
      prisma.analyticsEvent.findMany({
        where: { profileId: profile.id },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
    ]);

    // Group views by date for chart rendering
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const viewsList = await prisma.analyticsEvent.findMany({
      where: {
        profileId: profile.id,
        eventType: 'VIEW',
        timestamp: { gte: thirtyDaysAgo },
      },
      select: { timestamp: true },
    });

    const viewsByDate: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      viewsByDate[dateStr] = 0;
    }

    viewsList.forEach((e) => {
      const dateStr = e.timestamp.toISOString().split('T')[0];
      if (viewsByDate[dateStr] !== undefined) {
        viewsByDate[dateStr]++;
      }
    });

    const viewsChartData = Object.entries(viewsByDate)
      .map(([date, count]) => ({ date, views: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      overview: {
        totalViews,
        totalDownloads,
        totalContacts,
        totalReviews,
      },
      viewsChartData,
      recentEvents,
    };
  }

  public static async getSuperAdminPlatformAnalytics() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalPortfolios,
      publishedPortfolios,
      totalCVsUploaded,
      totalCVsAnalyzed,
      totalReviewsSubmitted,
      totalReviewsPending,
      totalContactMessages,
      totalViews,
      totalDownloads,
      recentRegistrations,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'ADMIN', status: 'SUSPENDED' } }),
      prisma.profile.count(),
      prisma.portfolioStatus.count({ where: { isPublished: true, publishStatus: 'PUBLISHED' } }),
      prisma.cV.count(),
      prisma.cVExtraction.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.contactMessage.count(),
      prisma.analyticsEvent.count({ where: { eventType: 'VIEW' } }),
      prisma.analyticsEvent.count({ where: { eventType: 'DOWNLOAD_RESUME' } }),
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, fullName: true, email: true, createdAt: true, desiredProfession: true },
      }),
    ]);

    // Popular professions breakdown
    const professionsRaw = await prisma.user.groupBy({
      by: ['desiredProfession'],
      where: { role: 'ADMIN' },
      _count: { desiredProfession: true },
    });

    const popularProfessions = professionsRaw.map((p) => ({
      profession: p.desiredProfession || 'Software Engineer',
      count: p._count.desiredProfession,
    }));

    return {
      overview: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalPortfolios,
        publishedPortfolios,
        totalCVsUploaded,
        totalCVsAnalyzed,
        totalReviewsSubmitted,
        totalReviewsPending,
        totalContactMessages,
        totalViews,
        totalDownloads,
      },
      popularProfessions,
      recentRegistrations,
    };
  }

  public static async getSystemHealth() {
    let dbStatus = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = true;
    } catch {
      dbStatus = false;
    }

    const redisStatus = await getRedisStatus();

    return {
      status: dbStatus ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date(),
      services: {
        api: 'UP',
        database: dbStatus ? 'UP' : 'DOWN',
        redis: redisStatus ? 'UP' : 'OFFLINE_FALLBACK',
        storage: 'UP',
        cvEngine: 'UP',
      },
      uptimeSeconds: process.uptime(),
    };
  }
}
