import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InterviewService } from '../services/interview.service';
import { ValidationError } from '../utils/errors';

const scheduleRequestSchema = z.object({
  subdomain: z.string().optional(),
  recruiterName: z.string().min(2, 'Name must be at least 2 characters'),
  recruiterEmail: z.string().email('Invalid work email address'),
  company: z.string().min(1, 'Company name is required'),
  recruiterTitle: z.string().optional(),
  interviewType: z.enum([
    'RECRUITER_SCREEN',
    'TECHNICAL_INTERVIEW',
    'HIRING_MANAGER',
    'INTRO_CALL',
    'PROJECT_DISCUSSION',
    'OTHER',
  ]).optional().default('RECRUITER_SCREEN'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  timezone: z.string().optional().default('UTC'),
  durationMinutes: z.number().optional().default(30),
  platformPreference: z.string().optional().default('GOOGLE_MEET'),
  notes: z.string().optional(),
  alternateDate: z.string().optional(),
  alternateTime: z.string().optional(),
  honeypot: z.string().optional(),
});

const acceptSchema = z.object({
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
});

const rescheduleSchema = z.object({
  newDate: z.string().min(1, 'New proposed date is required'),
  newTime: z.string().min(1, 'New proposed time is required'),
  notes: z.string().optional(),
});

const declineSchema = z.object({
  notes: z.string().optional(),
});

export class InterviewController {
  /**
   * Public: Recruiter schedules a call/meeting
   */
  public static async createScheduleRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = scheduleRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const subdomain = req.tenantSubdomain || parsed.data.subdomain;
      if (!subdomain) {
        throw new ValidationError('Subdomain context is missing.');
      }

      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await InterviewService.createScheduleRequest(subdomain, parsed.data, {
        ipAddress,
        userAgent,
      });

      return res.status(201).json({
        success: true,
        message: 'Interview request submitted successfully. The candidate has been notified.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Get interview requests
   */
  public static async getInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { status, search, page, limit } = req.query;

      const result = await InterviewService.getInterviewsForTenant(userId, {
        status: status as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.json({
        success: true,
        data: result.interviews,
        meta: {
          total: result.total,
          unreadCount: result.unreadCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Get quick stats for KPI cards & sidebar badge
   */
  public static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const stats = await InterviewService.getInterviewStats(userId);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Get single interview request
   */
  public static async getInterviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const interview = await InterviewService.getInterviewById(userId, id);

      return res.json({
        success: true,
        data: interview,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Accept interview request
   */
  public static async acceptInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const parsed = acceptSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const updated = await InterviewService.acceptInterview(userId, id, parsed.data);

      return res.json({
        success: true,
        message: 'Interview accepted! Confirmation email and calendar invite dispatched to recruiter.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Reschedule interview request
   */
  public static async rescheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const parsed = rescheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const updated = await InterviewService.rescheduleInterview(userId, id, parsed.data);

      return res.json({
        success: true,
        message: 'Reschedule proposal sent to recruiter.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Decline interview request
   */
  public static async declineInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const parsed = declineSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const updated = await InterviewService.declineInterview(userId, id, parsed.data);

      return res.json({
        success: true,
        message: 'Interview request declined. Recruiter notified.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: Delete interview request
   */
  public static async deleteInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const result = await InterviewService.deleteInterview(userId, id);

      return res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}
