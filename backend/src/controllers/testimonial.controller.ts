import { Request, Response, NextFunction } from 'express';
import { TestimonialService } from '../services/testimonial.service';
import { sendSuccess } from '../utils/apiResponse';

export class TestimonialController {
  /** POST /api/testimonials — public submission */
  public static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const testimonial = await TestimonialService.submit(req.body, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return sendSuccess({ res, statusCode: 201, message: 'Thank you! Your testimonial has been submitted for review.', data: testimonial });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/testimonials — public approved testimonials */
  public static async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      const items = await TestimonialService.getPublic(limit);
      return sendSuccess({ res, message: 'Platform testimonials loaded.', data: items });
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/testimonials/manage — SuperAdmin list all */
  public static async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit, search } = req.query;
      const result = await TestimonialService.listAll({
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        search: search as string,
      });
      return sendSuccess({ res, message: 'Testimonials loaded.', data: result });
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/testimonials/:id — SuperAdmin moderate */
  public static async moderate(req: Request, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      const result = await TestimonialService.moderate(
        req.params.id,
        req.user!.id,
        action
      );
      return sendSuccess({ res, message: `Testimonial ${action.toLowerCase()}d successfully.`, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/testimonials/:id — SuperAdmin delete */
  public static async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TestimonialService.moderate(req.params.id, req.user!.id, 'DELETE');
      return sendSuccess({ res, message: 'Testimonial deleted.', data: result });
    } catch (error) {
      next(error);
    }
  }
}
