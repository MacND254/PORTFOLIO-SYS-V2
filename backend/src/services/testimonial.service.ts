import { prisma } from '../database/client';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { NotFoundError, ValidationError } from '../utils/errors';

export class TestimonialService {
  /**
   * Public: Submit a platform testimonial (pending review by SuperAdmin)
   */
  public static async submit(
    data: {
      submitterName: string;
      submitterEmail: string;
      submitterRole?: string;
      submitterCompany?: string;
      submitterPhotoUrl?: string;
      content: string;
      rating: number;
    },
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (!data.submitterName?.trim()) throw new ValidationError('Name is required.');
    if (!data.submitterEmail?.trim()) throw new ValidationError('Email is required.');
    if (!data.content?.trim()) throw new ValidationError('Testimonial content is required.');
    if (data.rating < 1 || data.rating > 5) throw new ValidationError('Rating must be between 1 and 5.');

    const testimonial = await (prisma as any).platformTestimonial.create({
      data: {
        submitterName: data.submitterName.trim(),
        submitterEmail: data.submitterEmail.trim().toLowerCase(),
        submitterRole: data.submitterRole?.trim() || null,
        submitterCompany: data.submitterCompany?.trim() || null,
        submitterPhotoUrl: data.submitterPhotoUrl?.trim() || null,
        content: data.content.trim(),
        rating: data.rating,
        status: 'PENDING',
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    // Notify all SuperAdmins about the new testimonial
    await NotificationService.notifySuperAdmins({
      title: 'New Platform Testimonial Submitted',
      message: `${data.submitterName}${data.submitterCompany ? ` from ${data.submitterCompany}` : ''} left a ${data.rating}-star testimonial. Review and publish it.`,
      type: 'INFO',
      link: '/superadmin/notifications',
    });

    return testimonial;
  }

  /**
   * Public: Get approved platform testimonials for landing page display
   */
  public static async getPublic(limit = 12) {
    return (prisma as any).platformTestimonial.findMany({
      where: { status: { in: ['APPROVED', 'FEATURED'] } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        submitterName: true,
        submitterRole: true,
        submitterCompany: true,
        submitterPhotoUrl: true,
        content: true,
        rating: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /**
   * SuperAdmin: List all testimonials with optional status filter
   */
  public static async listAll(options: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { submitterName: { contains: q, mode: 'insensitive' } },
        { submitterCompany: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      (prisma as any).platformTestimonial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).platformTestimonial.count({ where }),
    ]);

    const pendingCount = await (prisma as any).platformTestimonial.count({ where: { status: 'PENDING' } });

    return {
      testimonials: items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      pendingCount,
    };
  }

  /**
   * SuperAdmin: Moderate a testimonial (approve, reject, feature, delete)
   */
  public static async moderate(
    id: string,
    moderatorId: string,
    action: 'APPROVE' | 'REJECT' | 'FEATURE' | 'DELETE'
  ) {
    const testimonial = await (prisma as any).platformTestimonial.findUnique({ where: { id } });
    if (!testimonial) throw new NotFoundError('Testimonial not found.');

    if (action === 'DELETE') {
      await (prisma as any).platformTestimonial.delete({ where: { id } });
      return { message: 'Testimonial deleted.' };
    }

    const statusMap: Record<string, string> = {
      APPROVE: 'APPROVED',
      REJECT: 'REJECTED',
      FEATURE: 'FEATURED',
    };

    const updated = await (prisma as any).platformTestimonial.update({
      where: { id },
      data: {
        status: statusMap[action],
        moderatedById: moderatorId,
        moderatedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: moderatorId,
      action: `TESTIMONIAL_${action}ED`,
      target: id,
      metadata: { submitterName: testimonial.submitterName, rating: testimonial.rating },
    });

    return updated;
  }
}
