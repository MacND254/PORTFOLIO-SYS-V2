import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';
import { contactRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// Public: Recruiter schedule request submission
router.post('/public', resolveTenant, contactRateLimiter, InterviewController.createScheduleRequest);

// Protected Tenant Admin Endpoints
router.use(authenticate);
router.get('/', InterviewController.getInterviews);
router.get('/stats', InterviewController.getStats);
router.get('/:id', InterviewController.getInterviewById);
router.patch('/:id/accept', InterviewController.acceptInterview);
router.patch('/:id/reschedule', InterviewController.rescheduleInterview);
router.patch('/:id/decline', InterviewController.declineInterview);
router.delete('/:id', InterviewController.deleteInterview);

export default router;
