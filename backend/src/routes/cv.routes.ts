import { Router } from 'express';
import { CVController } from '../controllers/cv.controller';
import { authenticate } from '../middleware/auth.middleware';
import { cvUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', cvUpload.single('file'), CVController.upload);
router.get('/extraction', CVController.getLatestExtraction);
router.post('/import', CVController.importExtraction);
router.post('/ai/enhance-summary', CVController.enhanceSummaryWithAi);
router.post('/ai/rewrite-bullet', CVController.rewriteBulletWithAi);
router.post('/ai/suggest-skills', CVController.suggestSkillsWithAi);

export default router;
