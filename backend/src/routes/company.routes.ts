import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { contactRateLimiter } from '../middleware/rateLimit.middleware';
import { Role } from '@prisma/client';

const router = Router();

// ── Public Routes (no auth) ──────────────────────────────────────────────────
// Validate invite token (company registration page loads this first)
router.get('/invite/validate', CompanyController.validateToken);
// Register company via invite token
router.post('/register', contactRateLimiter, CompanyController.registerCompany);

// ── Authenticated Routes ─────────────────────────────────────────────────────
router.use(authenticate);

// ── Superadmin: Invite & Company Management ──────────────────────────────────
router.get('/invites', requireRole(Role.SUPER_ADMIN), CompanyController.listInvites);
router.post('/invites', requireRole(Role.SUPER_ADMIN), CompanyController.createInvite);
router.patch('/invites/:id/revoke', requireRole(Role.SUPER_ADMIN), CompanyController.revokeInvite);
router.patch('/invites/:id/reactivate', requireRole(Role.SUPER_ADMIN), CompanyController.reactivateInvite);
router.delete('/invites/:id', requireRole(Role.SUPER_ADMIN), CompanyController.deleteInvite);
router.post('/invites/:id/resend', requireRole(Role.SUPER_ADMIN), CompanyController.resendInviteEmail);

router.get('/all', requireRole(Role.SUPER_ADMIN), CompanyController.listAllCompanies);
router.patch('/:id/verify', requireRole(Role.SUPER_ADMIN), CompanyController.toggleVerifyCompany);
router.patch('/:id/status', requireRole(Role.SUPER_ADMIN), CompanyController.updateCompanyStatus);
router.delete('/:id', requireRole(Role.SUPER_ADMIN), CompanyController.deleteCompany);

// ── Company: Profile ──────────────────────────────────────────────────────────
router.get('/profile', requireRole(Role.COMPANY as any), CompanyController.getProfile);
router.patch('/profile', requireRole(Role.COMPANY as any), CompanyController.updateProfile);

// ── Company: Job Postings ──────────────────────────────────────────────────────
router.post('/jobs', requireRole(Role.COMPANY as any), CompanyController.createJob);
router.get('/jobs', requireRole(Role.COMPANY as any), CompanyController.listJobs);
router.get('/jobs/:id', requireRole(Role.COMPANY as any), CompanyController.getJob);
router.patch('/jobs/:id', requireRole(Role.COMPANY as any), CompanyController.updateJob);
router.delete('/jobs/:id', requireRole(Role.COMPANY as any), CompanyController.deleteJob);

// ── Candidate Matching ─────────────────────────────────────────────────────────
router.get('/jobs/:id/matches', requireRole(Role.COMPANY as any), CompanyController.getJobMatches);

export default router;
