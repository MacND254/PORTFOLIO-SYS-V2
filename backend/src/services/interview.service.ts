import { prisma } from '../database/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import { NotificationService } from './notification.service';
import { MailService } from './mail.service';
import { logger } from '../config/logger';
import { normalizeSubdomain } from '../utils/slug';

export interface CreateInterviewInput {
  recruiterName: string;
  recruiterEmail: string;
  company: string;
  recruiterTitle?: string;
  interviewType?: any;
  preferredDate: string; // ISO date string e.g. "2026-09-15"
  preferredTime: string; // e.g. "14:00"
  timezone?: string;
  durationMinutes?: number;
  platformPreference?: string;
  notes?: string;
  alternateDate?: string;
  alternateTime?: string;
  honeypot?: string;
}

export class InterviewService {
  /**
   * Recruiter submits a meeting/interview request via public portfolio
   */
  public static async createScheduleRequest(
    subdomain: string,
    data: CreateInterviewInput,
    reqMeta?: { ipAddress?: string; userAgent?: string }
  ) {
    if (data.honeypot && data.honeypot.trim().length > 0) {
      // Anti-bot honeypot triggered
      return { id: 'honeypot-ignored', status: 'PENDING', message: 'Request received.' };
    }

    const normSlug = normalizeSubdomain(subdomain);
    let subRecord: any = await prisma.subdomain.findFirst({
      where: {
        OR: [
          { slug: normSlug },
          { slug: subdomain },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            profile: { select: { id: true, contactEmail: true } as any },
          },
        },
      },
    });

    // Fallback: search by user ID or profile ID directly if slug lookup failed
    if (!subRecord || !subRecord.user || !subRecord.user.profile) {
      const userRecord: any = await prisma.user.findFirst({
        where: {
          OR: [
            { id: subdomain },
            { profile: { id: subdomain } },
            { subdomains: { some: { slug: normSlug } } },
          ],
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          profile: { select: { id: true, contactEmail: true } as any },
        },
      });

      if (userRecord && userRecord.profile) {
        subRecord = { user: userRecord };
      }
    }

    if (!subRecord || !subRecord.user || !subRecord.user.profile) {
      throw new NotFoundError('Portfolio owner not found.');
    }

    const preferredDateObj = new Date(data.preferredDate);
    if (isNaN(preferredDateObj.getTime())) {
      throw new ValidationError('Invalid preferred date provided.');
    }

    let alternateDateObj: Date | undefined = undefined;
    if (data.alternateDate) {
      const parsed = new Date(data.alternateDate);
      if (!isNaN(parsed.getTime())) {
        alternateDateObj = parsed;
      }
    }

    const duration = Math.min(120, Math.max(15, Number(data.durationMinutes) || 30));
    const timezone = data.timezone || 'UTC';
    const interviewType = (data.interviewType || 'RECRUITER_SCREEN') as any;
    const platform = (data.platformPreference || 'GOOGLE_MEET').toUpperCase();

    // Create interview record
    const interview = await (prisma as any).interviewSchedule.create({
      data: {
        profileId: subRecord.user.profile.id,
        recruiterName: data.recruiterName.trim(),
        recruiterEmail: data.recruiterEmail.trim().toLowerCase(),
        company: data.company.trim(),
        recruiterTitle: data.recruiterTitle?.trim(),
        interviewType,
        preferredDate: preferredDateObj,
        preferredTime: data.preferredTime.trim(),
        timezone,
        durationMinutes: duration,
        platformPreference: platform,
        notes: data.notes?.trim(),
        alternateDate: alternateDateObj,
        alternateTime: data.alternateTime?.trim(),
        status: 'PENDING',
        ipAddress: reqMeta?.ipAddress,
        userAgent: reqMeta?.userAgent,
      },
    });

    // In-app notification to tenant
    await NotificationService.create({
      userId: subRecord.user.id,
      title: '📅 New Interview Request!',
      message: `${data.recruiterName.trim()} from ${data.company.trim()} requested a ${duration}m ${interviewType.replace(/_/g, ' ')}.`,
      type: 'INFO',
      link: '/admin/interviews',
    });

    const tenantEmail = subRecord.user.profile.contactEmail || subRecord.user.email;
    const formattedDateStr = preferredDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // 1. Email notification to tenant (async non-blocking)
    if (tenantEmail) {
      MailService.sendInterviewRequestNotificationToTenant({
        tenantEmail,
        tenantName: subRecord.user.fullName,
        recruiterName: data.recruiterName.trim(),
        recruiterEmail: data.recruiterEmail.trim().toLowerCase(),
        company: data.company.trim(),
        recruiterTitle: data.recruiterTitle?.trim(),
        interviewType,
        preferredDate: formattedDateStr,
        preferredTime: data.preferredTime.trim(),
        timezone,
        durationMinutes: duration,
        platformPreference: platform,
        notes: data.notes?.trim(),
        alternateSlot: data.alternateDate && data.alternateTime ? `${data.alternateDate} at ${data.alternateTime}` : undefined,
      }).catch((err) => logger.error('Failed to notify tenant of interview request email:', err));
    }

    // 2. Email confirmation to recruiter (async non-blocking)
    MailService.sendInterviewRequestConfirmationToRecruiter({
      recruiterEmail: data.recruiterEmail.trim().toLowerCase(),
      recruiterName: data.recruiterName.trim(),
      tenantName: subRecord.user.fullName,
      interviewType,
      preferredDate: formattedDateStr,
      preferredTime: data.preferredTime.trim(),
      timezone,
      durationMinutes: duration,
      platformPreference: platform,
    }).catch((err) => logger.error('Failed to send confirmation email to recruiter:', err));

    return interview;
  }

  /**
   * Get all interviews for tenant dashboard with filters
   */
  public static async getInterviewsForTenant(
    userId: string,
    options: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { profileId: profile.id };

    if (options.status && options.status !== 'ALL') {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { recruiterName: { contains: q, mode: 'insensitive' } },
        { recruiterEmail: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [interviews, total, unreadCount] = await Promise.all([
      (prisma as any).interviewSchedule.findMany({
        where,
        orderBy: { preferredDate: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).interviewSchedule.count({ where }),
      (prisma as any).interviewSchedule.count({
        where: { profileId: profile.id, status: 'PENDING' },
      }),
    ]);

    return {
      interviews,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get quick stats for sidebar badges and KPI tiles
   */
  public static async getInterviewStats(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const [pending, accepted, rescheduled, declined, total] = await Promise.all([
      (prisma as any).interviewSchedule.count({ where: { profileId: profile.id, status: 'PENDING' } }),
      (prisma as any).interviewSchedule.count({ where: { profileId: profile.id, status: 'ACCEPTED' } }),
      (prisma as any).interviewSchedule.count({ where: { profileId: profile.id, status: 'RESCHEDULED' } }),
      (prisma as any).interviewSchedule.count({ where: { profileId: profile.id, status: 'DECLINED' } }),
      (prisma as any).interviewSchedule.count({ where: { profileId: profile.id } }),
    ]);

    return { pending, accepted, rescheduled, declined, total };
  }

  /**
   * Get specific interview details and mark as read
   */
  public static async getInterviewById(userId: string, interviewId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const interview = await (prisma as any).interviewSchedule.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });

    if (!interview) throw new NotFoundError('Interview not found.');

    if (!interview.isRead) {
      await (prisma as any).interviewSchedule.update({
        where: { id: interviewId },
        data: { isRead: true },
      });
    }

    return interview;
  }

  /**
   * Tenant accepts interview: updates status and sends email with meeting URL and .ics calendar invite
   */
  public static async acceptInterview(
    userId: string,
    interviewId: string,
    data: { meetingLink?: string; notes?: string }
  ) {
    const profile: any = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Profile not found.');

    const interview: any = await (prisma as any).interviewSchedule.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });
    if (!interview) throw new NotFoundError('Interview not found.');

    const updated = await (prisma as any).interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: 'ACCEPTED',
        meetingLink: data.meetingLink?.trim(),
        tenantNotes: data.notes?.trim(),
        isRead: true,
      },
    });

    // Parse combined date and time for calendar invite
    const dateObj = new Date(interview.preferredDate);
    const [hours, minutes] = (interview.preferredTime || '14:00').split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      dateObj.setHours(hours, minutes, 0, 0);
    }

    const tenantEmail = profile.contactEmail || profile.user.email;
    const formattedDateStr = new Date(interview.preferredDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Automatically send confirmation email to recruiter with calendar attachment
    await MailService.sendInterviewAcceptedEmail({
      recruiterEmail: interview.recruiterEmail,
      recruiterName: interview.recruiterName,
      tenantName: profile.user.fullName,
      tenantEmail,
      interviewType: interview.interviewType,
      confirmedDate: dateObj,
      formattedDate: formattedDateStr,
      formattedTime: interview.preferredTime,
      timezone: interview.timezone,
      durationMinutes: interview.durationMinutes,
      meetingLink: data.meetingLink?.trim(),
      tenantNotes: data.notes?.trim(),
      company: interview.company,
    }).catch((err) => logger.error('Failed to send interview accepted email to recruiter:', err));

    return updated;
  }

  /**
   * Tenant reschedules interview: proposes new date/time slot and sends email to recruiter
   */
  public static async rescheduleInterview(
    userId: string,
    interviewId: string,
    data: { newDate: string; newTime: string; notes?: string }
  ) {
    const profile: any = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Profile not found.');

    const interview: any = await (prisma as any).interviewSchedule.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });
    if (!interview) throw new NotFoundError('Interview not found.');

    const newDateObj = new Date(data.newDate);
    if (isNaN(newDateObj.getTime())) {
      throw new ValidationError('Invalid new date provided for rescheduling.');
    }

    const updated = await (prisma as any).interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: 'RESCHEDULED',
        rescheduledDate: newDateObj,
        rescheduledTime: data.newTime.trim(),
        tenantNotes: data.notes?.trim(),
        isRead: true,
      },
    });

    const tenantEmail = profile.contactEmail || profile.user.email;
    const formattedNewDateStr = newDateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Automatically send reschedule proposal email to recruiter
    await MailService.sendInterviewRescheduledEmail({
      recruiterEmail: interview.recruiterEmail,
      recruiterName: interview.recruiterName,
      tenantName: profile.user.fullName,
      tenantEmail,
      company: interview.company,
      newProposedDate: formattedNewDateStr,
      newProposedTime: data.newTime.trim(),
      timezone: interview.timezone,
      tenantNotes: data.notes?.trim(),
    }).catch((err) => logger.error('Failed to send interview rescheduled email to recruiter:', err));

    return updated;
  }

  /**
   * Tenant declines interview: updates status and sends polite email to recruiter
   */
  public static async declineInterview(
    userId: string,
    interviewId: string,
    data: { notes?: string }
  ) {
    const profile: any = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!profile) throw new NotFoundError('Profile not found.');

    const interview: any = await (prisma as any).interviewSchedule.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });
    if (!interview) throw new NotFoundError('Interview not found.');

    const updated = await (prisma as any).interviewSchedule.update({
      where: { id: interviewId },
      data: {
        status: 'DECLINED',
        tenantNotes: data.notes?.trim(),
        isRead: true,
      },
    });

    const tenantEmail = profile.contactEmail || profile.user.email;

    // Automatically send polite decline email to recruiter
    await MailService.sendInterviewDeclinedEmail({
      recruiterEmail: interview.recruiterEmail,
      recruiterName: interview.recruiterName,
      tenantName: profile.user.fullName,
      tenantEmail,
      company: interview.company,
      tenantNotes: data.notes?.trim(),
    }).catch((err) => logger.error('Failed to send interview declined email to recruiter:', err));

    return updated;
  }

  /**
   * Delete or archive interview record
   */
  public static async deleteInterview(userId: string, interviewId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile not found.');

    const interview = await (prisma as any).interviewSchedule.findFirst({
      where: { id: interviewId, profileId: profile.id },
    });
    if (!interview) throw new NotFoundError('Interview not found.');

    await (prisma as any).interviewSchedule.delete({
      where: { id: interviewId },
    });

    return { success: true, message: 'Interview request deleted successfully.' };
  }
}
