import { prisma } from '../database/client';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { validateSubdomainFormat, normalizeSubdomain } from '../utils/slug';
import { AuditService } from './audit.service';
import { config } from '../config/env';

export class PortfolioService {
  public static async getPublicPortfolioBySubdomain(subdomain: string) {
    const normSlug = normalizeSubdomain(subdomain);
    const subRecord = await prisma.subdomain.findUnique({
      where: { slug: normSlug },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            status: true,
            profile: {
              include: {
                experiences: { orderBy: { orderIndex: 'asc' } },
                educations: { orderBy: { orderIndex: 'asc' } },
                skills: { orderBy: { orderIndex: 'asc' } },
                certifications: { orderBy: { orderIndex: 'asc' } },
                awards: { orderBy: { orderIndex: 'asc' } },
                projects: { orderBy: { orderIndex: 'asc' } },
                publications: { orderBy: { orderIndex: 'asc' } },
                languages: { orderBy: { orderIndex: 'asc' } },
                services: { orderBy: { orderIndex: 'asc' } },
                references: { where: { isPublic: true }, orderBy: { orderIndex: 'asc' } },
                memberships: { orderBy: { orderIndex: 'asc' } },
                customSections: { where: { isVisible: true }, orderBy: { orderIndex: 'asc' } },
                customization: {
                  include: { theme: true },
                },
                portfolioStatus: true,
                reviews: {
                  where: { isApproved: true },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!subRecord || !subRecord.user || subRecord.user.status !== 'ACTIVE') {
      throw new NotFoundError('Portfolio not found.');
    }

    const { profile } = subRecord.user;
    if (!profile || !profile.portfolioStatus || profile.portfolioStatus.publishStatus !== 'PUBLISHED') {
      throw new NotFoundError('This portfolio is currently private or unpublished.');
    }

    // Build an explicitly public owner object before returning the profile. The
    // profile query does not include User by default, so mutating profile.user
    // here used to throw for portfolios with private email enabled.
    const sanitizedProfile: Record<string, any> = {
      ...profile,
      user: {
        fullName: subRecord.user.fullName,
        ...(profile.isPublicEmail ? { email: subRecord.user.email } : {}),
      },
    };
    if (!profile.isPublicPhone) delete (sanitizedProfile as any).phone;

    return {
      subdomain: normSlug,
      owner: {
        fullName: subRecord.user.fullName,
      },
      profile: sanitizedProfile,
      seo: this.generateSeoMetadata(subRecord.user.fullName, normSlug, profile),
      schemaJsonLd: this.generateSchemaJsonLd(subRecord.user.fullName, normSlug, profile),
    };
  }

  public static async getAdminPreview(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        experiences: { orderBy: { orderIndex: 'asc' } },
        educations: { orderBy: { orderIndex: 'asc' } },
        skills: { orderBy: { orderIndex: 'asc' } },
        certifications: { orderBy: { orderIndex: 'asc' } },
        awards: { orderBy: { orderIndex: 'asc' } },
        projects: { orderBy: { orderIndex: 'asc' } },
        publications: { orderBy: { orderIndex: 'asc' } },
        languages: { orderBy: { orderIndex: 'asc' } },
        services: { orderBy: { orderIndex: 'asc' } },
        references: { orderBy: { orderIndex: 'asc' } },
        memberships: { orderBy: { orderIndex: 'asc' } },
        customSections: { orderBy: { orderIndex: 'asc' } },
        customization: {
          include: { theme: true },
        },
        portfolioStatus: true,
        reviews: { orderBy: { createdAt: 'desc' } },
        user: {
          select: {
            fullName: true,
            email: true,
            subdomains: { where: { isPrimary: true } },
          },
        },
      },
    });

    if (!profile) throw new NotFoundError('Profile not found.');

    const primarySubdomain = profile.user.subdomains[0]?.slug || 'preview';
    return {
      subdomain: primarySubdomain,
      owner: { fullName: profile.user.fullName },
      profile,
    };
  }

  public static async updateCustomization(userId: string, customizationData: any) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    // Theme design is shared platform content. Tenant admins may select a published
    // theme for their portfolio, but cannot override its visual settings.
    const themeId = typeof customizationData?.themeId === 'string'
      ? customizationData.themeId.trim()
      : '';
    if (!themeId) throw new ValidationError('Please select a theme.');

    const theme = await prisma.portfolioTheme.findUnique({ where: { themeId } });
    if (!theme || !theme.isPublished) {
      throw new ValidationError('The selected theme is unavailable.');
    }

    const updated = await prisma.portfolioCustomization.upsert({
      where: { profileId: profile.id },
      update: { themeId },
      create: {
        profileId: profile.id,
        themeId,
      },
      include: { theme: true },
    });

    // Save automatic revision snapshot
    await this.createRevision(profile.id, userId, 'Updated portfolio design customization');

    return updated;
  }

  public static async publishPortfolio(userId: string, publish: boolean) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const status = await prisma.portfolioStatus.upsert({
      where: { profileId: profile.id },
      update: {
        isPublished: publish,
        publishStatus: publish ? 'PUBLISHED' : 'UNPUBLISHED',
        publishedAt: publish ? new Date() : undefined,
      },
      create: {
        profileId: profile.id,
        isPublished: publish,
        publishStatus: publish ? 'PUBLISHED' : 'UNPUBLISHED',
        publishedAt: publish ? new Date() : undefined,
      },
    });

    await AuditService.log({
      userId,
      action: publish ? 'PORTFOLIO_PUBLISHED' : 'PORTFOLIO_UNPUBLISHED',
      target: profile.id,
    });

    return status;
  }

  public static async changeSubdomain(userId: string, newSlugRaw: string) {
    const newSlug = normalizeSubdomain(newSlugRaw);
    const validation = validateSubdomainFormat(newSlug);
    if (!validation.isValid) {
      throw new ValidationError(validation.reason || 'Invalid subdomain format.');
    }

    const existing = await prisma.subdomain.findUnique({ where: { slug: newSlug } });
    if (existing && existing.userId !== userId) {
      throw new ConflictError(`Subdomain "${newSlug}" is already taken.`);
    }

    const currentSub = await prisma.subdomain.findFirst({
      where: { userId, isPrimary: true },
    });

    if (!currentSub) {
      throw new NotFoundError('Current subdomain not found.');
    }

    if (currentSub.slug === newSlug) {
      return currentSub;
    }

    const previousSlugs = [...currentSub.previousSlugs, currentSub.slug];

    const updated = await prisma.subdomain.update({
      where: { id: currentSub.id },
      data: {
        slug: newSlug,
        previousSlugs,
      },
    });

    await AuditService.log({
      userId,
      action: 'SUBDOMAIN_CHANGED',
      target: newSlug,
      metadata: { previous: currentSub.slug },
    });

    return updated;
  }

  public static async createRevision(profileId: string, userId: string, note?: string) {
    const fullProfile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        experiences: true,
        educations: true,
        skills: true,
        projects: true,
        customization: true,
      },
    });

    return prisma.portfolioRevision.create({
      data: {
        profileId,
        snapshotData: fullProfile as any,
        revisionNote: note || 'Autosave snapshot',
        createdByUserId: userId,
      },
    });
  }

  private static generateSeoMetadata(fullName: string, subdomain: string, profile: any) {
    const title = `${fullName} - ${profile.title || 'Professional Portfolio'}`;
    const description = profile.summary || profile.headline || `Explore ${fullName}'s work experience, skills, projects, and certifications.`;
    const url = `https://${subdomain}.${config.platformDomain}`;

    return {
      title,
      description,
      canonicalUrl: url,
      openGraph: {
        title,
        description,
        url,
        type: 'profile',
        image: profile.avatarUrl || `https://${subdomain}.${config.platformDomain}/og-image.png`,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: profile.avatarUrl || '',
      },
    };
  }

  private static generateSchemaJsonLd(fullName: string, subdomain: string, profile: any) {
    const url = `https://${subdomain}.${config.platformDomain}`;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': `${url}#person`,
          name: fullName,
          jobTitle: profile.title,
          description: profile.summary || profile.headline,
          url,
          image: profile.avatarUrl,
          sameAs: [profile.linkedin, profile.github, profile.twitter, profile.website].filter(Boolean),
          worksFor: profile.experiences && profile.experiences[0] ? {
            '@type': 'Organization',
            name: profile.experiences[0].company,
          } : undefined,
        },
        {
          '@type': 'ProfilePage',
          '@id': url,
          url,
          name: `${fullName} - Professional Portfolio`,
          mainEntity: { '@id': `${url}#person` },
        },
      ],
    };
  }
}
