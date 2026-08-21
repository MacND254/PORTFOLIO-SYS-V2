import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { contactRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public contact & document access key requests
router.post('/public', resolveTenant, contactRateLimiter, MessageController.submitContactMessage);
router.post('/public/request-key', resolveTenant, contactRateLimiter, MessageController.submitAccessKeyRequest);

// Admin message management
router.use(authenticate);
router.get('/', MessageController.getAdminMessages);
router.put('/:id', MessageController.updateMessageStatus);
router.post('/:id/accept-key', MessageController.acceptKeyRequest);
router.post('/:id/decline-key', MessageController.declineKeyRequest);
router.delete('/:id', MessageController.deleteMessage);

export default router;
