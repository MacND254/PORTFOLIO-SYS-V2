import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// User notification routes
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/', NotificationController.getNotifications);
router.put('/read-all', NotificationController.markAllAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);
router.patch('/:id/read', NotificationController.markAsRead);
router.delete('/clear/all', NotificationController.clearAllNotifications);
router.delete('/:id', NotificationController.deleteNotification);

// SuperAdmin notification broadcast & stats
router.post('/broadcast', requireRole(Role.SUPER_ADMIN), NotificationController.broadcastNotification);
router.get('/superadmin/stats', requireRole(Role.SUPER_ADMIN), NotificationController.getBroadcastStats);

export default router;
