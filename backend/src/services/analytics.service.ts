import { prisma } from '../database/client';
import { getRedisStatus } from '../config/redis';

export class AnalyticsService {
  /**
   * Helper: Parses User-Agent into standard device category
   */
  public static parseDevice(userAgent?: string): 'Desktop' | 'Mobile' | 'Tablet' {
    if (!userAgent) return 'Desktop';
    const ua = userAgent.toLowerCase();
    if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
      return 'Tablet';
    }
    if (/(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo)/.test(ua)) {
      return 'Mobile';
    }
    return 'Desktop';
  }

  /**
   * Helper: Parses User-Agent into standard browser name
   */
  public static parseBrowser(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
    if (ua.includes('chrome/') && !ua.includes('chromium')) return 'Chrome';
    if (ua.includes('safari/') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox/')) return 'Firefox';
    if (ua.includes('trident/') || ua.includes('msie')) return 'Internet Explorer';
    return 'Other';
  }

  /**
   * Helper: Parses referrer URL into standard origin platform
   */
  public static parseReferrer(referrer?: string): string {
    if (!referrer || referrer.trim() === '') return 'Direct / None';
    try {
      const url = new URL(referrer);
      const host = url.hostname.toLowerCase();
      if (host.includes('linkedin.com') || host.includes('lnkd.in')) return 'LinkedIn';
      if (host.includes('github.com')) return 'GitHub';
      if (host.includes('google.')) return 'Google Search';
      if (host.includes('twitter.com') || host.includes('t.co') || host.includes('x.com')) return 'Twitter / X';
      if (host.includes('facebook.com') || host.includes('fb.me')) return 'Facebook';
      if (host.includes('instagram.com')) return 'Instagram';
      if (host.includes('reddit.com')) return 'Reddit';
      if (host.includes('medium.com')) return 'Medium';
      if (host.includes('dev.to')) return 'Dev.to';
      if (host.includes('news.ycombinator.com')) return 'Hacker News';
      if (host.includes('localhost') || host.includes('127.0.0.1')) return 'Local / Internal';
      return host.replace(/^www\./, '');
    } catch {
      return 'Direct / None';
    }
  }

  /**
   * Records a native analytics event with automatic device/browser/referrer parsing
   */
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
      const resolvedDevice = deviceType || this.parseDevice(userAgent);
      const resolvedBrowser = browser || this.parseBrowser(userAgent);
      const resolvedReferrer = this.parseReferrer(referrer);

      await prisma.analyticsEvent.create({
        data: {
          profileId,
          eventType,
          visitorIp,
          userAgent,
          referrer: resolvedReferrer,
          deviceType: resolvedDevice,
          browser: resolvedBrowser,
          path: path || '/',
        },
      });
    } catch (e) {
      console.error('Failed to record analytics event:', e);
    }
  }

  /**
   * Retrieves comprehensive tenant analytics with date range filters, device, browser, and referrer breakdowns
   */
  public static async getTenantAnalytics(userId: string, timeRange: '7d' | '30d' | '90d' | 'all' = '30d') {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;

    // Calculate start date based on selected time range
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '90d') days = 90;
    else if (timeRange === 'all') days = 180; // capped for chart resolution

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const whereRange = timeRange === 'all'
      ? { profileId: profile.id }
      : { profileId: profile.id, timestamp: { gte: startDate } };

    // Parallel queries for fast aggregation
    const [
      totalViews,
      totalDownloads,
      totalContacts,
      totalReviews,
      rangeEvents,
      recentEventsRaw,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { profileId: profile.id, eventType: 'VIEW', ...(timeRange !== 'all' ? { timestamp: { gte: startDate } } : {}) } }),
      prisma.analyticsEvent.count({ where: { profileId: profile.id, eventType: 'DOWNLOAD_RESUME', ...(timeRange !== 'all' ? { timestamp: { gte: startDate } } : {}) } }),
      prisma.contactMessage.count({ where: { profileId: profile.id, ...(timeRange !== 'all' ? { createdAt: { gte: startDate } } : {}) } }),
      prisma.review.count({ where: { profileId: profile.id, ...(timeRange !== 'all' ? { createdAt: { gte: startDate } } : {}) } }),
      prisma.analyticsEvent.findMany({
        where: whereRange,
        select: {
          eventType: true,
          timestamp: true,
          deviceType: true,
          browser: true,
          referrer: true,
          visitorIp: true,
        },
      }),
      prisma.analyticsEvent.findMany({
        where: { profileId: profile.id },
        orderBy: { timestamp: 'desc' },
        take: 25,
      }),
    ]);

    // Compute unique visitors (distinct IPs per day in the range)
    const uniqueVisitorKeys = new Set<string>();
    rangeEvents.forEach((ev: any) => {
      const dateStr = ev.timestamp.toISOString().split('T')[0];
      const ip = ev.visitorIp || 'anon';
      uniqueVisitorKeys.add(`${dateStr}-${ip}`);
    });
    const uniqueVisitors = uniqueVisitorKeys.size;

    // Conversion Rate: (Resume Downloads + Contact Messages) / Max(1, Views) * 100
    const conversionRate = totalViews > 0
      ? Math.min(100, parseFloat((((totalDownloads + totalContacts) / totalViews) * 100).toFixed(1)))
      : 0;

    // 1. Daily Chart Series (Views, Downloads, Contacts)
    const dateMap: Record<string, { views: number; downloads: number; contacts: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = { views: 0, downloads: 0, contacts: 0 };
    }

    rangeEvents.forEach((ev: any) => {
      const key = ev.timestamp.toISOString().split('T')[0];
      if (dateMap[key]) {
        if (ev.eventType === 'VIEW') dateMap[key].views++;
        else if (ev.eventType === 'DOWNLOAD_RESUME') dateMap[key].downloads++;
      }
    });

    const viewsChartData = Object.entries(dateMap).map(([date, counts]) => ({
      date,
      views: counts.views,
      downloads: counts.downloads,
    }));

    // 2. Device Breakdown
    const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    rangeEvents.forEach((ev: any) => {
      const dev = ev.deviceType || 'Desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });
    const totalEventsInRange = Math.max(1, rangeEvents.length);
    const deviceBreakdown = Object.entries(deviceCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalEventsInRange) * 100),
    }));

    // 3. Browser Breakdown
    const browserCounts: Record<string, number> = {};
    rangeEvents.forEach((ev: any) => {
      const b = ev.browser || 'Other';
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });
    const browserBreakdown = Object.entries(browserCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalEventsInRange) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Referrer Breakdown
    const referrerCounts: Record<string, number> = {};
    rangeEvents.forEach((ev: any) => {
      const ref = ev.referrer || 'Direct / None';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const referrerBreakdown = Object.entries(referrerCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: Math.round((count / totalEventsInRange) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Recent Events Formatted
    const recentEvents = recentEventsRaw.map((ev: any) => ({
      id: ev.id,
      eventType: ev.eventType,
      deviceType: ev.deviceType || 'Desktop',
      browser: ev.browser || 'Unknown',
      referrer: ev.referrer || 'Direct',
      path: ev.path || '/',
      timestamp: ev.timestamp,
    }));

    return {
      timeRange,
      overview: {
        totalViews,
        uniqueVisitors,
        totalDownloads,
        totalContacts,
        totalReviews,
        conversionRate,
      },
      viewsChartData,
      deviceBreakdown,
      browserBreakdown,
      referrerBreakdown,
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

    const professionsRaw = await prisma.user.groupBy({
      by: ['desiredProfession'],
      where: { role: 'ADMIN' },
      _count: { desiredProfession: true },
    });

    const popularProfessions = professionsRaw.map((p: any) => ({
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
