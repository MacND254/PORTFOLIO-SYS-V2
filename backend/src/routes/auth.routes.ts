import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { OAuthController } from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// ── Standard auth ──────────────────────────────────────────────────────────
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/social-login', authRateLimiter, AuthController.socialLogin);
router.post('/social-login/complete', authRateLimiter, OAuthController.completeSocialSignup);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

// ── Google OAuth redirect flow ─────────────────────────────────────────────
router.get('/google', OAuthController.googleAuth);
router.get('/google/callback', OAuthController.googleCallback);

// ── GitHub OAuth redirect flow ─────────────────────────────────────────────
router.get('/github', OAuthController.githubAuth);
router.get('/github/callback', OAuthController.githubCallback);

export default router;
