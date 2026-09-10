import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../database/client';
import { config } from '../config/env';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { validateSubdomainFormat, normalizeSubdomain } from '../utils/slug';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { MailService } from './mail.service';
import { Role } from '@prisma/client';

export class AuthService {
  public static async socialLogin(data: {
    provider: 'google' | 'github';
    email: string;
    fullName: string;
    providerId?: string;
    avatarUrl?: string;
    desiredSubdomain?: string;
    desiredProfession?: string;
  }, reqMeta?: { ipAddress?: string; userAgent?: string }) {
    const email = data.email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        subdomains: { where: { isPrimary: true } },
      },
    });

    if (!user) {
      let baseSub = (data.desiredSubdomain || data.fullName || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      if (baseSub.length < 3) baseSub = `user${Math.floor(1000 + Math.random() * 9000)}`;

      let subdomainSlug = baseSub;
      let counter = 1;
      while (await prisma.subdomain.findUnique({ where: { slug: subdomainSlug } })) {
        subdomainSlug = `${baseSub}${counter}`;
        counter++;
      }

      const profession = data.desiredProfession || 'Software Engineer';
      const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

      const result = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            fullName: data.fullName || email.split('@')[0],
            email,
            password: randomPassword,
            role: Role.ADMIN,
            desiredProfession: profession,
            emailVerified: true,
          },
        });

        const newProfile = await tx.profile.create({
          data: {
            userId: newUser.id,
            title: profession,
            summary: `Welcome to ${data.fullName}'s professional portfolio!`,
            avatarUrl: data.avatarUrl || null,
            completenessScore: 30,
          },
        });

        await tx.subdomain.create({
          data: {
            userId: newUser.id,
            slug: subdomainSlug,
            isPrimary: true,
          },
        });

        await tx.portfolioStatus.create({
          data: {
            profileId: newProfile.id,
            isPublished: true,
            publishStatus: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        await tx.portfolioCustomization.create({
          data: {
            profileId: newProfile.id,
            themeId: this.getThemeIdForProfession(profession),
            fontHeading: 'Inter',
            fontBody: 'Inter',
          },
        });

        return newUser;
      });

      user = await prisma.user.findUnique({
        where: { id: result.id },
        include: {
          profile: true,
          subdomains: { where: { isPrimary: true } },
        },
      });
    }

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is inactive or suspended.');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: (config.jwtExpiresIn || '7d') as any }
    );

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN_SOCIAL',
      target: data.provider,
      metadata: { ip: reqMeta?.ipAddress },
    });

    const primarySubdomain = user.subdomains?.[0]?.slug || 'portfolio';

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        subdomain: primarySubdomain,
        avatarUrl: user.profile?.avatarUrl,
      },
    };
  }
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
    const result = await prisma.$transaction(async (tx: any) => {
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
      category: 'PORTFOLIO',
      link: '/admin/dashboard',
    });

    await NotificationService.notifySuperAdmins({
      title: 'New Tenant Registered',
      message: `${result.user.fullName} (${result.user.email}) registered with subdomain: ${subdomain}`,
      type: 'INFO',
      link: '/superadmin/users',
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

    if (!user) {
      await AuditService.log({
        action: 'USER_LOGIN_FAILED',
        target: email,
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
        metadata: { reason: 'User not found' },
      });
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      await AuditService.log({
        action: 'USER_LOGIN_FAILED',
        target: email,
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
        metadata: { reason: 'Account suspended/deactivated' },
      });
      throw new UnauthorizedError('Account is suspended or deactivated.');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      await AuditService.log({
        userId: user.id,
        action: 'USER_LOGIN_FAILED',
        target: email,
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
        metadata: { reason: 'Invalid password' },
      });
      throw new UnauthorizedError('Invalid email or password.');
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

    const primarySubdomain = user.subdomains.find((s: any) => s.isPrimary)?.slug || '';
    return {
      ...user,
      subdomain: primarySubdomain,
    };
  }

  public static async forgotPassword(email: string, frontendUrl?: string) {
    const normEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normEmail } });

    // Always return a success message to prevent user enumeration
    if (!user || user.status !== 'ACTIVE') {
      return {
        message: 'If an active account exists with that email address, a password reset link has been dispatched.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires },
    });

    await MailService.sendPasswordResetEmail({
      email: user.email,
      resetToken,
      userName: user.fullName,
      frontendUrl,
    });

    await AuditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      target: user.email,
    });

    return {
      message: 'If an active account exists with that email address, a password reset link has been dispatched.',
    };
  }

  public static async resetPassword(data: { token: string; newPassword: string }) {
    const { token, newPassword } = data;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired password reset token. Please request a new link.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Invalidate active sessions
    await prisma.session.deleteMany({ where: { userId: user.id } });

    await AuditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      target: user.email,
    });

    return { message: 'Password updated successfully. You can now log in with your new credentials.' };
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

  public static async updateAccountDetails(
    userId: string,
    data: { fullName?: string; email?: string; desiredProfession?: string; subdomain?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subdomains: { where: { isPrimary: true } } },
    });
    if (!user) throw new NotFoundError('User not found.');

    const updateData: any = {};
    if (data.fullName && data.fullName.trim()) updateData.fullName = data.fullName.trim();
    if (data.desiredProfession !== undefined) updateData.desiredProfession = data.desiredProfession.trim();

    if (data.email && data.email.toLowerCase().trim() !== user.email) {
      const newEmail = data.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== userId) throw new ConflictError('This email is already in use by another account.');
      updateData.email = newEmail;
    }

    let updatedSubdomain = user.subdomains[0]?.slug || '';

    if (data.subdomain && data.subdomain.trim() && data.subdomain.trim() !== updatedSubdomain) {
      const newSub = normalizeSubdomain(data.subdomain);
      const validation = validateSubdomainFormat(newSub);
      if (!validation.isValid) throw new ValidationError(validation.reason || 'Invalid subdomain format.');

      const taken = await prisma.subdomain.findUnique({ where: { slug: newSub } });
      if (taken && taken.userId !== userId) throw new ConflictError(`Subdomain "${newSub}" is already taken.`);

      await prisma.subdomain.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      const existingUserSub = await prisma.subdomain.findUnique({ where: { slug: newSub } });
      if (existingUserSub) {
        await prisma.subdomain.update({
          where: { id: existingUserSub.id },
          data: { isPrimary: true },
        });
      } else {
        await prisma.subdomain.create({
          data: { userId, slug: newSub, isPrimary: true },
        });
      }
      updatedSubdomain = newSub;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        desiredProfession: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'USER_ACCOUNT_UPDATED',
      target: updatedUser.email,
    });

    return {
      ...updatedUser,
      subdomain: updatedSubdomain,
    };
  }

  public static async changePassword(
    userId: string,
    data: { currentPassword?: string; newPassword: string }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    if (user.password) {
      if (!data.currentPassword) throw new ValidationError('Current password is required.');
      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) throw new UnauthorizedError('Current password is incorrect.');
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long.');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await AuditService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      target: user.email,
    });

    return { message: 'Password updated successfully.' };
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
