import { Request, Response, NextFunction } from 'express';
import { ThemeService } from '../services/theme.service';
import { sendSuccess } from '../utils/apiResponse';

export class ThemeController {
  public static async getAllThemes(req: Request, res: Response, next: NextFunction) {
    try {
      const themes = await ThemeService.getAllThemes();
      return sendSuccess({ res, message: 'Themes fetched successfully.', data: themes });
    } catch (error) {
      next(error);
    }
  }

  public static async getThemeById(req: Request, res: Response, next: NextFunction) {
    try {
      const theme = await ThemeService.getThemeById(req.params.id);
      return sendSuccess({ res, message: 'Theme details fetched.', data: theme });
    } catch (error) {
      next(error);
    }
  }
}
