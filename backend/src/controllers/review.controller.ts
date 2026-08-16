import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { sendSuccess } from '../utils/apiResponse';
import { reviewSubmissionSchema } from '../validators/review.validator';
import { ValidationError } from '../utils/errors';

export class ReviewController {
  public static async getShareableToken(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReviewService.createReviewRequestToken(req.user!.id);
      return sendSuccess({ res, message: 'Review token generated.', data });
    } catch (error) {
      next(error);
    }
  }

  public static async submitPublicReview(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = reviewSubmissionSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid review submission', parsed.error.errors);

      const review = await ReviewService.submitReview(req.params.profileId, parsed.data, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return sendSuccess({
        res,
        statusCode: 201,
        message: 'Thank you! Your testimonial has been submitted and is pending review.',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAdminReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await ReviewService.getReviewsForAdmin(req.user!.id);
      return sendSuccess({ res, message: 'Reviews fetched.', data: reviews });
    } catch (error) {
      next(error);
    }
  }

  public static async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      const result = await ReviewService.moderateReview(req.params.id, req.user!.id, action);
      return sendSuccess({ res, message: 'Review updated.', data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewerEmail, reviewerName } = req.body;
      if (!reviewerEmail || !reviewerName) {
        throw new ValidationError('reviewerEmail and reviewerName are required.');
      }
      const result = await ReviewService.sendReviewInvitation(req.user!.id, reviewerEmail, reviewerName);
      return sendSuccess({ res, message: result.message, data: result });
    } catch (error) {
      next(error);
    }
  }
}
