import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { contactRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public contact submission
router.post('/public', resolveTenant, contactRateLimiter, MessageController.submitContactMessage);

// Admin message management
router.use(authenticate);
router.get('/', MessageController.getAdminMessages);
router.put('/:id', MessageController.updateMessageStatus);
router.delete('/:id', MessageController.deleteMessage);

export default router;
