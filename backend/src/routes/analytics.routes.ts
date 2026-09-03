import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public route for tracking interactions (e.g. resume download clicks)
router.post('/track', AnalyticsController.trackEvent);

// Protected route for tenant analytics dashboard
router.get('/tenant', authenticate, AnalyticsController.getTenantAnalytics);

export default router;
