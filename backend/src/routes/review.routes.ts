import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public review submission
router.post('/public/:profileId', ReviewController.submitPublicReview);

// Admin review management
router.use(authenticate);
router.get('/request-token', ReviewController.getShareableToken);
router.get('/', ReviewController.getAdminReviews);
router.put('/:id/moderate', ReviewController.moderateReview);

export default router;
