import { Request, Response, NextFunction } from 'express';
import { CVService } from '../services/cv.service';
import { AIService } from '../services/ai.service';
import { sendSuccess } from '../utils/apiResponse';

export class CVController {
  public static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const cv = await CVService.uploadCV(req.user!.id, file!);
      return sendSuccess({
        res,
        statusCode: 201,
        message: 'CV uploaded successfully. Background processing started.',
        data: cv,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getLatestExtraction(req: Request, res: Response, next: NextFunction) {
    try {
      const extraction = await CVService.getLatestExtraction(req.user!.id);
      return sendSuccess({
        res,
        message: 'CV extraction fetched.',
        data: extraction,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async importExtraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { extractedData, options, importMode, selectedSections, ...rest } = req.body;
      const data = extractedData || rest;
      const importOptions = options || {
        importMode: importMode || 'replace',
        selectedSections: selectedSections || undefined,
      };

      const updatedProfile = await CVService.importExtraction(req.user!.id, data, importOptions);
      return sendSuccess({
        res,
        message: 'CV details imported into profile successfully.',
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async enhanceSummaryWithAi(req: Request, res: Response, next: NextFunction) {
    try {
      const { summary, profession } = req.body;
      const enhanced = await AIService.enhanceSummary(summary, profession);
      return sendSuccess({
        res,
        message: 'Summary enhanced with AI.',
        data: { enhancedSummary: enhanced },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async rewriteBulletWithAi(req: Request, res: Response, next: NextFunction) {
    try {
      const { bullet } = req.body;
      const rewritten = await AIService.rewriteResponsibility(bullet);
      return sendSuccess({
        res,
        message: 'Bullet point rewritten.',
        data: { rewrittenBullet: rewritten },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async suggestSkillsWithAi(req: Request, res: Response, next: NextFunction) {
    try {
      const { profession } = req.body;
      const skills = await AIService.suggestSkillsForProfession(profession || 'Software Engineer');
      return sendSuccess({
        res,
        message: 'Skills suggested.',
        data: { suggestedSkills: skills },
      });
    } catch (error) {
      next(error);
    }
  }
}
