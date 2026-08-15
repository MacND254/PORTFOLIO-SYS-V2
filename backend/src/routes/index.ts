import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import cvRoutes from './cv.routes';
import themeRoutes from './theme.routes';
import portfolioRoutes from './portfolio.routes';
import reviewRoutes from './review.routes';
import messageRoutes from './message.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes';
import { HealthController } from '../controllers/health.controller';
import { SettingsAdminController } from '../controllers/settingsAdmin.controller';
import { checkMaintenanceMode } from '../middleware/maintenance.middleware';

const router = Router();

// Public un-authenticated settings endpoint
router.get('/public-settings', SettingsAdminController.getPublicSettings);

// Apply Maintenance Mode Middleware across all API routes
router.use(checkMaintenanceMode);

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/cv', cvRoutes);
router.use('/themes', themeRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/reviews', reviewRoutes);
router.use('/messages', messageRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', HealthController.getHealth);

export default router;
