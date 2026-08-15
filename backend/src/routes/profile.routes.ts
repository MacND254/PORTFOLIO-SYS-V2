import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);

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
router.delete('/projects/:id', ProfileController.deleteProject);

// Certifications
router.post('/certifications', ProfileController.addCertification);
router.delete('/certifications/:id', ProfileController.deleteCertification);

export default router;
