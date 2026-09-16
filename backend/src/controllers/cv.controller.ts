import { Request, Response, NextFunction } from 'express';
import { CVService } from '../services/cv.service';
import { sendSuccess } from '../utils/apiResponse';

export class CVController {
  public static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const cv = await CVService.uploadCV(req.user!.id, file!);
      // Respond immediately with 202 Accepted — Gemini extraction runs in the background.
      // The client should poll GET /api/cv/latest until status === 'REVIEW_REQUIRED'.
      return sendSuccess({
        res,
        statusCode: 202,
        message: 'CV uploaded successfully. AI extraction is processing in the background. Poll /api/cv/latest to check progress.',
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

  public static async resetExtraction(req: Request, res: Response, next: NextFunction) {
    try {
      await CVService.resetExtraction(req.user!.id);
      return sendSuccess({
        res,
        message: 'CV extraction data reset successfully.',
        data: null,
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
}
