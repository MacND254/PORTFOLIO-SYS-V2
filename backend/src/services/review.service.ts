import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

export class ReviewService {
  public static async createReviewRequestToken(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    // Return current profile ID and a newly generated token string for sharing
    return {
      reviewUrlToken: profile.id,
      shareableUrl: `/review/${profile.id}`,
    };
  }

  public static async submitReview(
    profileId: string,
    data: {
      reviewerName: string;
      reviewerEmail: string;
      reviewerCompany?: string;
      reviewerJobTitle?: string;
      reviewerWebsite?: string;
      reviewerPhotoUrl?: string;
      rating: number;
      reviewText: string;
    },
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundError('Portfolio not found.');

    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5 stars.');
    }

    const review = await prisma.review.create({
      data: {
        profileId: profile.id,
        reviewerName: data.reviewerName,
        reviewerEmail: data.reviewerEmail,
        reviewerCompany: data.reviewerCompany,
        reviewerJobTitle: data.reviewerJobTitle,
        reviewerWebsite: data.reviewerWebsite,
        reviewerPhotoUrl: data.reviewerPhotoUrl,
        rating: data.rating,
        reviewText: data.reviewText,
        isApproved: false,
        status: 'PENDING',
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    await NotificationService.create({
      userId: profile.userId,
      title: 'New Client Review Received!',
      message: `${data.reviewerName} submitted a ${data.rating}-star review for your portfolio.`,
      type: 'INFO',
      link: '/admin/reviews',
    });

    return review;
  }

  public static async getReviewsForAdmin(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    return prisma.review.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async moderateReview(
    reviewId: string,
    userId: string,
    action: 'APPROVE' | 'REJECT' | 'TOGGLE_FEATURE' | 'DELETE'
  ) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const review = await prisma.review.findFirst({
      where: { id: reviewId, profileId: profile.id },
    });
    if (!review) throw new NotFoundError('Review not found.');

    if (action === 'DELETE') {
      await prisma.review.delete({ where: { id: reviewId } });
      return { message: 'Review deleted.' };
    }

    if (action === 'APPROVE') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: true, status: 'APPROVED' },
      });
      await AuditService.log({ userId, action: 'REVIEW_APPROVED', target: reviewId });
      return updated;
    }

    if (action === 'REJECT') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isApproved: false, status: 'REJECTED' },
      });
      await AuditService.log({ userId, action: 'REVIEW_REJECTED', target: reviewId });
      return updated;
    }

    if (action === 'TOGGLE_FEATURE') {
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: { isFeatured: !review.isFeatured },
      });
      return updated;
    }

    throw new ValidationError('Invalid moderation action.');
  }

  public static async sendReviewInvitation(userId: string, reviewerEmail: string, reviewerName: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subdomains: { where: { isPrimary: true } },
      },
    });

    if (!user || !user.profile) throw new NotFoundError('Profile not found.');

    const { MailService } = await import('./mail.service');
    const primarySubdomain = user.subdomains[0]?.slug || 'portfolio';
    const sent = await MailService.sendReviewInvitationEmail({
      reviewerEmail,
      reviewerName,
      tenantName: user.fullName,
      reviewToken: user.profile.id,
      subdomain: primarySubdomain,
    });

    if (!sent) throw new ValidationError('Failed to send testimonial invitation email. Please check System Mail Settings.');

    return { message: `Testimonial invitation sent successfully to ${reviewerEmail}` };
  }
}
