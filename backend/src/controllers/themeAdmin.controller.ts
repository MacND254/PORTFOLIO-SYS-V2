import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';
import { sendSuccess } from '../utils/apiResponse';
import {
  SEEDED_THEMES,
  THEME_ANIMATION_OPTIONS,
  THEME_CARD_STYLE_OPTIONS,
  THEME_COLOR_KEYS,
  THEME_FEATURE_KEYS,
  THEME_FONT_OPTIONS,
  THEME_LAYOUT_OPTIONS,
} from '../services/theme.service';
import { NotFoundError, ValidationError } from '../utils/errors';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const ensureOneOf = (value: unknown, options: readonly string[], label: string) => {
  if (typeof value !== 'string' || !options.includes(value)) {
    throw new ValidationError(`Invalid ${label}.`);
  }
};

export class ThemeAdminController {
  /** GET /admin/themes — all 20 themes with live DB overrides */
  public static async getAllThemes(req: Request, res: Response, next: NextFunction) {
    try {
      const themes = await prisma.portfolioTheme.findMany({
        orderBy: { orderIndex: 'asc' },
      });
      return sendSuccess({ res, message: 'All themes fetched.', data: themes });
    } catch (error) {
      next(error);
    }
  }

  /** PUT /admin/themes/:themeId — edit any theme property */
  public static async updateTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { themeId } = req.params;
      const existing = await prisma.portfolioTheme.findUnique({ where: { themeId } });
      if (!existing) throw new NotFoundError(`Theme "${themeId}" not found.`);

      const updateData: Record<string, unknown> = {};
      if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || req.body.name.trim().length < 2 || req.body.name.trim().length > 80) {
          throw new ValidationError('Theme name must be between 2 and 80 characters.');
        }
        updateData.name = req.body.name.trim();
      }
      if (req.body.profession !== undefined) {
        if (typeof req.body.profession !== 'string' || req.body.profession.trim().length < 2 || req.body.profession.trim().length > 80) {
          throw new ValidationError('Profession must be between 2 and 80 characters.');
        }
        updateData.profession = req.body.profession.trim();
      }
      if (req.body.description !== undefined) {
        if (typeof req.body.description !== 'string' || req.body.description.trim().length > 500) {
          throw new ValidationError('Theme description must be 500 characters or fewer.');
        }
        updateData.description = req.body.description.trim();
      }

      if (req.body.defaultColors !== undefined) {
        if (!isObject(req.body.defaultColors)) throw new ValidationError('Color palette must be an object.');
        const colors = { ...(existing.defaultColors as Record<string, unknown>) };
        for (const [key, value] of Object.entries(req.body.defaultColors)) {
          if (!(THEME_COLOR_KEYS as readonly string[]).includes(key) || typeof value !== 'string' || !HEX_COLOR.test(value)) {
            throw new ValidationError(`Invalid value for color "${key}".`);
          }
          colors[key] = value.toUpperCase();
        }
        updateData.defaultColors = colors;
      }

      if (req.body.typography !== undefined) {
        if (!isObject(req.body.typography)) throw new ValidationError('Typography must be an object.');
        const typography = { ...(existing.typography as Record<string, unknown>) };
        for (const [key, value] of Object.entries(req.body.typography)) {
          if (!['heading', 'body', 'code'].includes(key)) throw new ValidationError(`Invalid typography setting "${key}".`);
          ensureOneOf(value, THEME_FONT_OPTIONS, 'font family');
          typography[key] = value;
        }
        updateData.typography = typography;
      }

      if (req.body.layoutConfig !== undefined) {
        if (!isObject(req.body.layoutConfig)) throw new ValidationError('Layout configuration must be an object.');
        const layoutConfig = { ...(existing.layoutConfig as Record<string, unknown>) };
        for (const [key, value] of Object.entries(req.body.layoutConfig)) {
          if (key === 'layout') ensureOneOf(value, THEME_LAYOUT_OPTIONS, 'layout');
          else if (key === 'cardStyle') ensureOneOf(value, THEME_CARD_STYLE_OPTIONS, 'card style');
          else if (key === 'animation') ensureOneOf(value, THEME_ANIMATION_OPTIONS, 'animation');
          else if ((THEME_FEATURE_KEYS as readonly string[]).includes(key)) {
            if (typeof value !== 'boolean') throw new ValidationError(`"${key}" must be true or false.`);
          } else if (key === 'heroStyle') {
            if (typeof value !== 'string' || !/^[a-z0-9-]{0,48}$/i.test(value)) {
              throw new ValidationError('Invalid hero style.');
            }
          } else {
            throw new ValidationError(`Unsupported layout setting "${key}".`);
          }
          layoutConfig[key] = value;
        }
        updateData.layoutConfig = layoutConfig;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('Provide at least one editable theme setting.');
      }

      const theme = await prisma.portfolioTheme.update({
        where: { themeId },
        data: updateData,
      });

      return sendSuccess({ res, message: `Theme "${themeId}" updated.`, data: theme });
    } catch (error) {
      next(error);
    }
  }

  /** POST /admin/themes/:themeId/toggle-publish */
  public static async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const { themeId } = req.params;
      const theme = await prisma.portfolioTheme.findUnique({ where: { themeId } });
      if (!theme) throw new NotFoundError(`Theme "${themeId}" not found.`);

      const updated = await prisma.portfolioTheme.update({
        where: { themeId },
        data: { isPublished: !theme.isPublished },
      });

      return sendSuccess({
        res,
        message: `Theme ${updated.isPublished ? 'published' : 'hidden'}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /** POST /admin/themes/:themeId/reset — restore defaults from seed */
  public static async resetTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const { themeId } = req.params;
      const seed = SEEDED_THEMES.find((t) => t.themeId === themeId);
      if (!seed) throw new NotFoundError(`No seed data found for theme "${themeId}".`);

      const reset = await prisma.portfolioTheme.update({
        where: { themeId },
        data: {
          name: seed.name,
          profession: seed.profession,
          description: seed.description,
          defaultColors: seed.defaultColors,
          typography: seed.typography,
          layoutConfig: seed.layoutConfig,
        },
      });

      return sendSuccess({ res, message: `Theme "${themeId}" reset to defaults.`, data: reset });
    } catch (error) {
      next(error);
    }
  }
}
