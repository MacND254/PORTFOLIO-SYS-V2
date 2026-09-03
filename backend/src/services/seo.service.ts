import { prisma } from '../database/client';
import { config } from '../config/env';
import { normalizeSubdomain } from '../utils/slug';

export class SeoService {
  /**
   * Generates a compliant XML Sitemap of all active published portfolios and core pages
   */
  public static async generateSitemapXml(): Promise<string> {
    const platformDomain = config.platformDomain || 'myportfolio.com';
    const baseUrl = `https://${platformDomain}`;

    interface SitemapUrl {
      loc: string;
      lastmod?: string;
      priority: string;
      changefreq: string;
    }

    // Static platform marketing & legal pages
    const staticPages: SitemapUrl[] = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/login`, priority: '0.5', changefreq: 'monthly' },
      { loc: `${baseUrl}/register`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/privacy`, priority: '0.3', changefreq: 'yearly' },
      { loc: `${baseUrl}/terms`, priority: '0.3', changefreq: 'yearly' },
    ];

    // Fetch all actively published primary subdomains
    const publishedSubdomains = await prisma.subdomain.findMany({
      where: {
        isPrimary: true,
        user: {
          status: 'ACTIVE',
          profile: {
            portfolioStatus: {
              isPublished: true,
              publishStatus: 'PUBLISHED',
            },
          },
        },
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    const tenantPages = publishedSubdomains.map((sub: any) => {
      const updatedAt = sub.user?.profile?.updatedAt
        ? new Date(sub.user.profile.updatedAt).toISOString()
        : new Date().toISOString();
      return {
        loc: `https://${sub.slug}.${platformDomain}/`,
        lastmod: updatedAt,
        priority: '0.8',
        changefreq: 'weekly',
      };
    });

    const allUrls = [...staticPages, ...tenantPages];

    const xmlItems = allUrls
      .map(
        (page) => `  <url>
    <loc>${page.loc}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;
  }

  /**
   * Generates a dynamic robots.txt file
   */
  public static generateRobotsTxt(subdomain?: string): string {
    const platformDomain = config.platformDomain || 'myportfolio.com';
    const sitemapUrl = `https://${platformDomain}/sitemap.xml`;

    return `# Robots.txt for ${subdomain ? `${subdomain}.${platformDomain}` : platformDomain}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /superadmin/
Disallow: /api/
Disallow: /oauth/

Sitemap: ${sitemapUrl}
`;
  }

  /**
   * Generates W3C Web App Manifest (PWA) for a given portfolio subdomain
   */
  public static async generateManifestJson(subdomain: string): Promise<Record<string, any>> {
    const normSlug = normalizeSubdomain(subdomain);
    const subRecord = await prisma.subdomain.findUnique({
      where: { slug: normSlug },
      include: {
        user: {
          select: {
            fullName: true,
            profile: {
              include: {
                customization: true,
              },
            },
          },
        },
      },
    });

    const fullName = subRecord?.user?.fullName || 'Professional Portfolio';
    const customization = subRecord?.user?.profile?.customization;
    const pwaManifest = (customization?.pwaManifest as Record<string, any>) || {};
    const avatarUrl = subRecord?.user?.profile?.avatarUrl;
    const faviconUrl = customization?.faviconUrl;

    const themeColor = pwaManifest.themeColor || '#4f46e5';
    const backgroundColor = pwaManifest.backgroundColor || '#0f172a';
    const name = pwaManifest.name || `${fullName} — Portfolio`;
    const shortName = pwaManifest.shortName || fullName.split(' ')[0] || 'Portfolio';
    const display = pwaManifest.display || 'standalone';

    const icons: Array<{ src: string; sizes: string; type: string }> = [];
    if (faviconUrl) {
      icons.push({
        src: faviconUrl,
        sizes: '192x192',
        type: 'image/png',
      });
      icons.push({
        src: faviconUrl,
        sizes: '512x512',
        type: 'image/png',
      });
    } else if (avatarUrl) {
      icons.push({
        src: avatarUrl,
        sizes: '192x192',
        type: 'image/png',
      });
      icons.push({
        src: avatarUrl,
        sizes: '512x512',
        type: 'image/png',
      });
    } else {
      icons.push({
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      });
    }

    return {
      name,
      short_name: shortName,
      description: `${fullName}'s professional resume and portfolio showcase.`,
      start_url: `/p/${normSlug}`,
      display,
      background_color: backgroundColor,
      theme_color: themeColor,
      orientation: 'portrait-primary',
      icons,
    };
  }
}
