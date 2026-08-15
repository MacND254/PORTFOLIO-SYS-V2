import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authenticate } from '../middleware/auth.middleware';
import { resolveTenant } from '../middleware/tenant.middleware';

const router = Router();

// Public routes
router.get('/public', resolveTenant, PortfolioController.getPublicPortfolio);
router.get('/public/:subdomain', PortfolioController.getPublicPortfolio);
router.get('/pdf', resolveTenant, PortfolioController.downloadPdfResume);
router.get('/qr', resolveTenant, PortfolioController.getQrCode);

// Authenticated Admin routes
router.use(authenticate);
router.get('/preview', PortfolioController.getAdminPreview);
router.put('/customization', PortfolioController.updateCustomization);
router.post('/publish', PortfolioController.publishPortfolio);
router.post('/subdomain', PortfolioController.changeSubdomain);

// Revisions & Version Control
router.get('/revisions', PortfolioController.getRevisions);
router.post('/revisions/:revisionId/restore', PortfolioController.restoreRevision);

export default router;
