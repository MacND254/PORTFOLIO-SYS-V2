import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { sendSuccess } from '../utils/apiResponse';
import { contactSubmissionSchema } from '../validators/review.validator';
import { ValidationError } from '../utils/errors';

export class MessageController {
  public static async submitContactMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = contactSubmissionSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid contact message', parsed.error.errors);

      const subdomain = req.tenantSubdomain || (req.body.subdomain as string);
      const result = await MessageService.submitContactMessage(subdomain, parsed.data, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return sendSuccess({
        res,
        statusCode: 201,
        message: 'Your message has been sent successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await MessageService.getMessagesForAdmin(req.user!.id);
      return sendSuccess({ res, message: 'Messages fetched.', data: messages });
    } catch (error) {
      next(error);
    }
  }

  public static async updateMessageStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.markMessageStatus(req.params.id, req.user!.id, req.body);
      return sendSuccess({ res, message: 'Message updated.', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      await MessageService.deleteMessage(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Message deleted.' });
    } catch (error) {
      next(error);
    }
  }

  public static async submitAccessKeyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const subdomain = req.tenantSubdomain || (req.body.subdomain as string) || req.params.subdomain;
      const { name, email, company, message } = req.body;
      if (!name || !email) throw new ValidationError('Name and email are required.');

      const result = await MessageService.submitAccessKeyRequest(subdomain, { name, email, company, message }, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return sendSuccess({
        res,
        statusCode: 201,
        message: 'Access key request submitted to portfolio owner.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async acceptKeyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { validityHours } = req.body;
      const result = await MessageService.acceptKeyRequest(req.params.id, req.user!.id, { validityHours: Number(validityHours) || 24 });
      return sendSuccess({ res, message: 'Key request accepted and dispatched.', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async declineKeyRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.declineKeyRequest(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Key request declined.', data: result });
    } catch (error) {
      next(error);
    }
  }
}
