import bcrypt from 'bcryptjs';
import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { AuditService } from './audit.service';
import { UserStatus, Role } from '@prisma/client';

export class UserService {
  public static async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { subdomains: { some: { slug: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          desiredProfession: true,
          createdAt: true,
          subdomains: {
            select: { slug: true, isPrimary: true },
          },
          profile: {
            select: {
              id: true,
              title: true,
              completenessScore: true,
              portfolioStatus: {
                select: { isPublished: true, publishStatus: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u: any) => ({
        ...u,
        subdomain: u.subdomains.find((s: any) => s.isPrimary)?.slug || '',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subdomains: true,
        profile: {
          include: {
            experiences: true,
            educations: true,
            skills: true,
            projects: true,
            certifications: true,
            portfolioStatus: true,
            customization: true,
            _count: {
              select: {
                reviews: true,
                contactMessages: true,
                analyticsEvents: true,
              },
            },
          },
        },
        cvs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!user) throw new NotFoundError('User not found.');
    return user;
  }

  public static async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminUserId: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AuditService.log({
      userId: adminUserId,
      action: `USER_STATUS_${status}`,
      target: user.email,
    });

    return updated;
  }

  public static async updateUserRole(userId: string, role: Role, adminUserId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await AuditService.log({
      userId: adminUserId,
      action: `USER_ROLE_CHANGED_${role}`,
      target: user.email,
    });

    return updated;
  }

  public static async forceResetPassword(
    userId: string,
    newPassword?: string,
    adminUserId?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    const passToUse = newPassword || 'ChangeMe@12345';
    const hashedPassword = await bcrypt.hash(passToUse, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await AuditService.log({
      userId: adminUserId,
      action: 'USER_PASSWORD_FORCE_RESET',
      target: user.email,
    });

    return { message: 'Password reset successfully.', newPassword: passToUse };
  }
}
