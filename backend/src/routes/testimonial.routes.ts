import { Router } from 'express';
import { TestimonialController } from '../controllers/testimonial.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public routes (no auth)
router.get('/', TestimonialController.getPublic);
router.post('/', TestimonialController.submit);

// SuperAdmin-only management
router.get('/manage', authenticate, requireRole(Role.SUPER_ADMIN), TestimonialController.listAll);
router.patch('/:id', authenticate, requireRole(Role.SUPER_ADMIN), TestimonialController.moderate);
router.delete('/:id', authenticate, requireRole(Role.SUPER_ADMIN), TestimonialController.remove);

export default router;
