import { Router } from 'express';
import { ThemeController } from '../controllers/theme.controller';

const router = Router();

router.get('/', ThemeController.getAllThemes);
router.get('/:id', ThemeController.getThemeById);

export default router;
