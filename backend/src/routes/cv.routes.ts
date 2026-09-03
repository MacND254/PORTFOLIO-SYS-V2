import { Router } from 'express';
import { CVController } from '../controllers/cv.controller';
import { authenticate } from '../middleware/auth.middleware';
import { cvUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', cvUpload.single('file'), CVController.upload);
router.get('/extraction', CVController.getLatestExtraction);
router.delete('/extraction', CVController.resetExtraction);
router.post('/import', CVController.importExtraction);

export default router;
