import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { ThemeAdminController } from '../controllers/themeAdmin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.SUPER_ADMIN));

router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.put('/users/:id/role', AdminController.updateUserRole);
router.post('/users/:id/reset-password', AdminController.forceResetPassword);

router.get('/analytics', AdminController.getPlatformAnalytics);
router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/system-health', AdminController.getSystemHealth);

// Theme Management (Super Admin only)
router.get('/themes', ThemeAdminController.getAllThemes);
router.put('/themes/:themeId', ThemeAdminController.updateTheme);
router.post('/themes/:themeId/toggle-publish', ThemeAdminController.togglePublish);
router.post('/themes/:themeId/reset', ThemeAdminController.resetTheme);

import { SettingsAdminController } from '../controllers/settingsAdmin.controller';

// Global System Settings (Super Admin only)
router.get('/settings', SettingsAdminController.getSettings);
router.put('/settings', SettingsAdminController.updateSettings);
router.post('/settings/test-email', SettingsAdminController.testSmtpConnection);

export default router;
