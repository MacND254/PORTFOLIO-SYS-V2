import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  experienceSchema,
  educationSchema,
  skillSchema,
  projectSchema,
  certificationSchema,
} from '../validators/profile.validator';
import { ValidationError } from '../utils/errors';

export class ProfileController {
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.getProfileByUserId(req.user!.id);
      return sendSuccess({ res, message: 'Profile details fetched.', data: profile });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await ProfileService.updateProfile(req.user!.id, req.body);
      return sendSuccess({ res, message: 'Profile updated successfully.', data: updated });
    } catch (error) {
      next(error);
    }
  }

  public static async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No image file uploaded.');
      }
      const mediaUrl = `/uploads/images/${req.file.filename}`;
      return sendSuccess({
        res,
        message: 'Image uploaded successfully.',
        data: { url: mediaUrl, filename: req.file.filename },
      });
    } catch (error) {
      next(error);
    }
  }

  // --- EXPERIENCES ---
  public static async addExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = experienceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid experience data', parsed.error.errors);
      const item = await ProfileService.addExperience(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Experience added.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async updateExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = experienceSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid data', parsed.error.errors);
      const item = await ProfileService.updateExperience(req.params.id, req.user!.id, parsed.data);
      return sendSuccess({ res, message: 'Experience updated.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteExperience(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteExperience(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Experience deleted.' });
    } catch (error) {
      next(error);
    }
  }

  // --- EDUCATION ---
  public static async addEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = educationSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid education data', parsed.error.errors);
      const item = await ProfileService.addEducation(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Education added.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteEducation(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteEducation(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Education deleted.' });
    } catch (error) {
      next(error);
    }
  }

  // --- SKILLS ---
  public static async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = skillSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid skill data', parsed.error.errors);
      const item = await ProfileService.addSkill(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Skill added.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteSkill(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Skill deleted.' });
    } catch (error) {
      next(error);
    }
  }

  // --- PROJECTS ---
  public static async addProject(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = projectSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid project data', parsed.error.errors);
      const item = await ProfileService.addProject(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Project added.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteProject(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Project deleted.' });
    } catch (error) {
      next(error);
    }
  }

  // --- CERTIFICATIONS ---
  public static async addCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = certificationSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid certification data', parsed.error.errors);
      const item = await ProfileService.addCertification(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Certification added.', data: item });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteCertification(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteCertification(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Certification deleted.' });
    } catch (error) {
      next(error);
    }
  }
}
