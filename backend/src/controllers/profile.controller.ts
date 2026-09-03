import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  experienceSchema,
  educationSchema,
  skillSchema,
  projectSchema,
  certificationSchema,
  referenceSchema,
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

  public static async resetProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const reset = await ProfileService.resetProfile(req.user!.id);
      return sendSuccess({ res, message: 'Profile reset to empty state successfully.', data: reset });
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
      const field = req.query.field as string | undefined;

      // Immediately persist avatarUrl or coverUrl to profile if field param is provided
      if (field && (field === 'avatarUrl' || field === 'coverUrl') && req.user?.id) {
        try {
          await ProfileService.updateProfile(req.user.id, { [field]: mediaUrl });
        } catch (persistErr) {
          // Non-fatal: log but still return the URL to the client
          console.error('[uploadMedia] Failed to auto-persist URL to profile:', persistErr);
        }
      }

      return sendSuccess({
        res,
        message: 'Image uploaded successfully.',
        data: { url: mediaUrl, filename: req.file.filename, field },
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

  public static async uploadCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No certificate file uploaded.');
      }

      const fileUrl = `/uploads/images/${req.file.filename}`;
      return sendSuccess({
        res,
        message: 'Certificate file uploaded successfully.',
        data: { url: fileUrl, filename: req.file.filename },
      });
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

  public static async updateEducation(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = educationSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid data', parsed.error.errors);
      const item = await ProfileService.updateEducation(req.params.id, req.user!.id, parsed.data);
      return sendSuccess({ res, message: 'Education updated.', data: item });
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

  public static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = projectSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid project data', parsed.error.errors);
      await ProfileService.updateProject(req.params.id, req.user!.id, parsed.data);
      return sendSuccess({ res, message: 'Project updated.' });
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

  public static async updateCertification(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = certificationSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid data', parsed.error.errors);
      const item = await ProfileService.updateCertification(req.params.id, req.user!.id, parsed.data);
      return sendSuccess({ res, message: 'Certification updated.', data: item });
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

  // --- SERVICES ---
  public static async addService(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ProfileService.addService(req.user!.id, req.body);
      return sendSuccess({ res, statusCode: 201, message: 'Service added.', data: item });
    } catch (error) { next(error); }
  }
  public static async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteService(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Service deleted.' });
    } catch (error) { next(error); }
  }

  // --- PUBLICATIONS ---
  public static async addPublication(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ProfileService.addPublication(req.user!.id, req.body);
      return sendSuccess({ res, statusCode: 201, message: 'Publication added.', data: item });
    } catch (error) { next(error); }
  }
  public static async deletePublication(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deletePublication(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Publication deleted.' });
    } catch (error) { next(error); }
  }

  // --- AWARDS ---
  public static async addAward(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ProfileService.addAward(req.user!.id, req.body);
      return sendSuccess({ res, statusCode: 201, message: 'Award added.', data: item });
    } catch (error) { next(error); }
  }
  public static async deleteAward(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteAward(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Award deleted.' });
    } catch (error) { next(error); }
  }

  // --- LANGUAGES ---
  public static async addLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ProfileService.addLanguage(req.user!.id, req.body);
      return sendSuccess({ res, statusCode: 201, message: 'Language added.', data: item });
    } catch (error) { next(error); }
  }
  public static async deleteLanguage(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteLanguage(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Language deleted.' });
    } catch (error) { next(error); }
  }

  // --- REFERENCES ---
  public static async addReference(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = referenceSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid reference data', parsed.error.errors);
      const item = await ProfileService.addReference(req.user!.id, parsed.data);
      return sendSuccess({ res, statusCode: 201, message: 'Reference added.', data: item });
    } catch (error) { next(error); }
  }
  public static async updateReference(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = referenceSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid reference data', parsed.error.errors);
      const item = await ProfileService.updateReference(req.params.id, req.user!.id, parsed.data);
      return sendSuccess({ res, message: 'Reference updated.', data: item });
    } catch (error) { next(error); }
  }
  public static async deleteReference(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteReference(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Reference deleted.' });
    } catch (error) { next(error); }
  }

  // --- CUSTOM SECTIONS ---
  public static async addCustomSection(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ProfileService.addCustomSection(req.user!.id, req.body);
      return sendSuccess({ res, statusCode: 201, message: 'Custom Section added.', data: item });
    } catch (error) { next(error); }
  }
  public static async updateCustomSection(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.updateCustomSection(req.params.id, req.user!.id, req.body);
      return sendSuccess({ res, message: 'Custom Section updated.' });
    } catch (error) { next(error); }
  }
  public static async deleteCustomSection(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteCustomSection(req.params.id, req.user!.id);
      return sendSuccess({ res, message: 'Custom Section deleted.' });
    } catch (error) { next(error); }
  }

  // --- VERIFIED DOCUMENTS ---
  public static async getVerifiedDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await ProfileService.getVerifiedDocuments(req.user!.id);
      return sendSuccess({ res, message: 'Verified documents fetched.', data: items });
    } catch (error) { next(error); }
  }

  public static async addVerifiedDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const fileUrl = req.file ? `/uploads/images/${req.file.filename}` : req.body.fileUrl;
      if (!fileUrl) throw new ValidationError('Document file or fileUrl is required.');

      const item = await ProfileService.addVerifiedDocument(req.user!.id, {
        documentType: req.body.documentType,
        title: req.body.title,
        documentNumber: req.body.documentNumber,
        fileUrl,
        fileSize: req.file?.size || req.body.fileSize,
        mimeType: req.file?.mimetype || req.body.mimeType,
      });
      return sendSuccess({ res, statusCode: 201, message: 'Verified document uploaded successfully.', data: item });
    } catch (error) { next(error); }
  }

  public static async deleteVerifiedDocument(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteVerifiedDocument(req.user!.id, req.params.id);
      return sendSuccess({ res, message: 'Verified document removed.' });
    } catch (error) { next(error); }
  }

  // --- DOCUMENT ACCESS KEYS ---
  public static async getDocumentAccessKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const keys = await ProfileService.getDocumentAccessKeys(req.user!.id);
      return sendSuccess({ res, message: 'Access keys fetched.', data: keys });
    } catch (error) { next(error); }
  }

  public static async generateDocumentAccessKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientName, validityHours } = req.body;
      const keyRecord = await ProfileService.generateDocumentAccessKey(
        req.user!.id,
        recipientName,
        validityHours ? parseInt(validityHours, 10) : 24
      );
      return sendSuccess({ res, statusCode: 201, message: 'One-time document access key generated.', data: keyRecord });
    } catch (error) { next(error); }
  }

  public static async deleteDocumentAccessKey(req: Request, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteDocumentAccessKey(req.user!.id, req.params.id);
      return sendSuccess({ res, message: 'Access key revoked.' });
    } catch (error) { next(error); }
  }
}

