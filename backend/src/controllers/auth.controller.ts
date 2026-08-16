import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { ValidationError } from '../utils/errors';
import { SystemSettingsService } from '../services/systemSettings.service';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const isAllowed = await SystemSettingsService.isRegistrationAllowed();
      if (!isAllowed) {
        throw new ValidationError('New user registrations are currently disabled by platform administration.');
      }

      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.errors);
      }

      const result = await AuthService.register(parsed.data, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return sendSuccess({
        res,
        statusCode: 201,
        message: 'Account registered successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.errors);
      }

      const result = await AuthService.login(parsed.data, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return sendSuccess({
        res,
        message: 'Logged in successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.errors);
      }

      const frontendUrl = `${req.protocol}://${req.get('host')}`;
      const result = await AuthService.forgotPassword(parsed.data.email, frontendUrl);

      return sendSuccess({
        res,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.errors);
      }

      const result = await AuthService.resetPassword(parsed.data);

      return sendSuccess({
        res,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

      const user = await AuthService.getCurrentUser(req.user.id);
      return sendSuccess({
        res,
        message: 'Current user profile fetched.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    return sendSuccess({
      res,
      message: 'Logged out successfully.',
    });
  }
}
