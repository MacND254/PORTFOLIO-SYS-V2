import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

import { imageUpload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.post('/upload-media', imageUpload.single('file'), ProfileController.uploadMedia);

// Experiences
router.post('/experiences', ProfileController.addExperience);
router.put('/experiences/:id', ProfileController.updateExperience);
router.delete('/experiences/:id', ProfileController.deleteExperience);

// Education
router.post('/educations', ProfileController.addEducation);
router.delete('/educations/:id', ProfileController.deleteEducation);

// Skills
router.post('/skills', ProfileController.addSkill);
router.delete('/skills/:id', ProfileController.deleteSkill);

// Projects
router.post('/projects', ProfileController.addProject);
router.put('/projects/:id', ProfileController.updateProject);
router.delete('/projects/:id', ProfileController.deleteProject);

// Certifications
router.post('/certifications', ProfileController.addCertification);
router.delete('/certifications/:id', ProfileController.deleteCertification);

// Services & Pricing
router.post('/services', ProfileController.addService);
router.delete('/services/:id', ProfileController.deleteService);

// Publications
router.post('/publications', ProfileController.addPublication);
router.delete('/publications/:id', ProfileController.deletePublication);

// Awards
router.post('/awards', ProfileController.addAward);
router.delete('/awards/:id', ProfileController.deleteAward);

// Languages
router.post('/languages', ProfileController.addLanguage);
router.delete('/languages/:id', ProfileController.deleteLanguage);

// References
router.post('/references', ProfileController.addReference);
router.delete('/references/:id', ProfileController.deleteReference);

// Custom Sections
router.post('/custom-sections', ProfileController.addCustomSection);
router.delete('/custom-sections/:id', ProfileController.deleteCustomSection);

export default router;
