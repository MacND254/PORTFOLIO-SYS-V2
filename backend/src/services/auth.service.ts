import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../database/client';
import { config } from '../config/env';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { validateSubdomainFormat, normalizeSubdomain } from '../utils/slug';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { Role } from '@prisma/client';

export class AuthService {
  public static async register(data: {
    fullName: string;
    email: string;
    password: string;
    desiredSubdomain: string;
    profession?: string;
  }, reqMeta?: { ipAddress?: string; userAgent?: string }) {
    const email = data.email.toLowerCase().trim();
    const subdomain = normalizeSubdomain(data.desiredSubdomain);

    // 1. Check existing user email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    // 2. Validate subdomain
    const subdomainValidation = validateSubdomainFormat(subdomain);
    if (!subdomainValidation.isValid) {
      throw new ValidationError(subdomainValidation.reason || 'Invalid subdomain format.');
    }

    // 3. Check subdomain availability
    const existingSubdomain = await prisma.subdomain.findUnique({ where: { slug: subdomain } });
    if (existingSubdomain) {
      throw new ConflictError(`Subdomain "${subdomain}" is already taken by another user.`);
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 5. Transaction to create user, profile, subdomain, portfolio status & customization
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email,
          password: hashedPassword,
          role: Role.ADMIN,
          desiredProfession: data.profession || 'Software Engineer',
          emailVerified: true, // Auto-verify in dev mode
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: user.id,
          title: data.profession || 'Professional',
          summary: `Welcome to ${data.fullName}'s professional portfolio!`,
          completenessScore: 25,
        },
      });

      await tx.subdomain.create({
        data: {
          userId: user.id,
          slug: subdomain,
          isPrimary: true,
        },
      });

      await tx.portfolioStatus.create({
        data: {
          profileId: profile.id,
          isPublished: true,
          publishStatus: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      await tx.portfolioCustomization.create({
        data: {
          profileId: profile.id,
          themeId: this.getThemeIdForProfession(data.profession || 'Software Engineer'),
          fontHeading: 'Inter',
          fontBody: 'Inter',
        },
      });

      return { user, profile, subdomain };
    });

    // 6. Audit & Notification
    await AuditService.log({
      userId: result.user.id,
      action: 'USER_REGISTERED',
      target: result.user.email,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
      metadata: { subdomain },
    });

    await NotificationService.create({
      userId: result.user.id,
      title: 'Welcome to Portfolio Platform!',
      message: `Your account is ready. Your portfolio is published at ${subdomain}.${config.platformDomain}`,
      type: 'SUCCESS',
    });

    const token = this.generateToken(result.user);
    const refreshToken = this.generateRefreshToken(result.user);

    return {
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
        subdomain,
      },
      token,
      refreshToken,
    };
  }

  public static async login(
    data: { email: string; password: string },
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subdomains: { where: { isPrimary: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Invalid credentials or account is suspended.');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);
    const primarySubdomain = user.subdomains[0]?.slug || '';

    // Record session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGGED_IN',
      target: user.email,
      ipAddress: reqMeta?.ipAddress,
      userAgent: reqMeta?.userAgent,
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subdomain: primarySubdomain,
      },
      token,
      refreshToken,
    };
  }

  public static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        desiredProfession: true,
        subdomains: {
          select: { slug: true, isPrimary: true, previousSlugs: true },
        },
        profile: {
          select: { id: true, title: true, avatarUrl: true, completenessScore: true },
        },
      },
    });

    if (!user) throw new NotFoundError('User not found.');

    const primarySubdomain = user.subdomains.find((s) => s.isPrimary)?.slug || '';
    return {
      ...user,
      subdomain: primarySubdomain,
    };
  }

  public static generateToken(user: { id: string; email: string; role: Role }): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
  }

  public static generateRefreshToken(user: { id: string; email: string; role: Role }): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn as any }
    );
  }

  private static getThemeIdForProfession(profession: string): string {
    const lower = profession.toLowerCase();
    if (lower.includes('data')) return 'data-scientist';
    if (lower.includes('cyber') || lower.includes('security')) return 'cybersecurity';
    if (lower.includes('network')) return 'network-engineer';
    if (lower.includes('devops') || lower.includes('cloud')) return 'devops-cloud';
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('product designer')) return 'ui-ux-designer';
    if (lower.includes('graphic')) return 'graphic-designer';
    if (lower.includes('architect')) return 'architect';
    if (lower.includes('civil')) return 'civil-engineer';
    if (lower.includes('electrical')) return 'electrical-engineer';
    if (lower.includes('mechanical')) return 'mechanical-engineer';
    if (lower.includes('medical') || lower.includes('doctor') || lower.includes('nurse')) return 'medical-professional';
    if (lower.includes('law') || lower.includes('legal') || lower.includes('attorney')) return 'legal-professional';
    if (lower.includes('account') || lower.includes('finance')) return 'finance-professional';
    if (lower.includes('market')) return 'marketing-professional';
    if (lower.includes('photo')) return 'photographer';
    if (lower.includes('teacher') || lower.includes('educat')) return 'educator';
    if (lower.includes('research') || lower.includes('academic')) return 'academic-researcher';
    if (lower.includes('freelance') || lower.includes('consult')) return 'freelancer-consultant';
    if (lower.includes('art') || lower.includes('creative')) return 'creative-professional';
    return 'software-engineer';
  }
}
