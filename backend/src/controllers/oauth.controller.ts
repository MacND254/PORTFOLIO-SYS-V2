import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { config } from '../config/env';
import { configurePassport } from '../config/passport';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { ValidationError } from '../utils/errors';

/**
 * OAuth Flow:
 * 1. GET /api/auth/google         → Redirects browser to Google consent screen
 * 2. GET /api/auth/google/callback → Google redirects back here with code
 *    a. If returning user → issue JWT → redirect frontend to /admin/dashboard?token=xxx
 *    b. If new user       → issue short-lived "pending" token with OAuth data
 *                           → redirect frontend to /register/oauth?state=xxx
 *                           The frontend shows subdomain + profession form, then
 *                           calls POST /api/auth/social-login/complete with the state.
 *
 * Same flow for GitHub.
 */
export class OAuthController {
  /**
   * Initiates Google OAuth redirect.
   */
  public static googleAuth(req: Request, res: Response, next: NextFunction) {
    if (!config.oauth.google.clientId || !config.oauth.google.clientSecret) {
      return res.redirect(
        `${config.frontendUrl}/register?error=${encodeURIComponent('Google OAuth is not configured in .env')}`
      );
    }
    // Ensure passport strategy is registered
    if (!(passport as any)._strategies?.google) {
      configurePassport();
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  }

  /**
   * Handles Google OAuth callback from Google.
   */
  public static googleCallback(req: Request, res: Response, next: NextFunction) {
    if (!(passport as any)._strategies?.google) {
      configurePassport();
    }
    passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/register?error=google_auth_failed` }, async (err: any, oauthUser: any) => {
      if (err || !oauthUser) {
        return res.redirect(`${config.frontendUrl}/register?error=google_auth_failed`);
      }
      await OAuthController._handleOAuthCallback(oauthUser, req, res);
    })(req, res, next);
  }

  /**
   * Initiates GitHub OAuth redirect.
   */
  public static githubAuth(req: Request, res: Response, next: NextFunction) {
    if (!config.oauth.github.clientId || !config.oauth.github.clientSecret) {
      return res.redirect(
        `${config.frontendUrl}/register?error=${encodeURIComponent('GitHub OAuth is not configured in .env')}`
      );
    }
    if (!(passport as any)._strategies?.github) {
      configurePassport();
    }
    passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
  }

  /**
   * Handles GitHub OAuth callback from GitHub.
   */
  public static githubCallback(req: Request, res: Response, next: NextFunction) {
    if (!(passport as any)._strategies?.github) {
      configurePassport();
    }
    passport.authenticate('github', { session: false, failureRedirect: `${config.frontendUrl}/register?error=github_auth_failed` }, async (err: any, oauthUser: any) => {
      if (err || !oauthUser) {
        return res.redirect(`${config.frontendUrl}/register?error=github_auth_failed`);
      }
      await OAuthController._handleOAuthCallback(oauthUser, req, res);
    })(req, res, next);
  }

  /**
   * Common handler for both Google and GitHub OAuth callbacks.
   *
   * If the user already exists → full JWT → redirect to dashboard.
   * If the user is new         → pending token → redirect to onboarding form.
   */
  private static async _handleOAuthCallback(
    oauthUser: { provider: 'google' | 'github'; providerId: string; email: string; fullName: string; avatarUrl: string },
    req: Request,
    res: Response
  ) {
    try {
      const { prisma } = await import('../database/client');

      // Check if the user already exists
      const existing = await prisma.user.findUnique({
        where: { email: oauthUser.email.toLowerCase().trim() },
        select: { id: true, status: true },
      });

      if (existing) {
        // Returning user — log them in fully
        const result = await AuthService.socialLogin(
          {
            provider: oauthUser.provider,
            email: oauthUser.email,
            fullName: oauthUser.fullName,
            providerId: oauthUser.providerId,
            avatarUrl: oauthUser.avatarUrl,
          },
          { ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );
        // Redirect to dashboard with JWT in query string (frontend picks it up and stores in localStorage)
        return res.redirect(`${config.frontendUrl}/oauth/callback?token=${result.token}&status=login`);
      }

      // New user — issue a short-lived "pending OAuth" state token (10 minutes)
      const pendingToken = jwt.sign(
        {
          _oauthPending: true,
          provider: oauthUser.provider,
          providerId: oauthUser.providerId,
          email: oauthUser.email,
          fullName: oauthUser.fullName,
          avatarUrl: oauthUser.avatarUrl,
        },
        config.jwtSecret,
        { expiresIn: '10m' } as any
      );

      return res.redirect(
        `${config.frontendUrl}/register/oauth?state=${encodeURIComponent(pendingToken)}`
      );
    } catch (err: any) {
      return res.redirect(`${config.frontendUrl}/register?error=${encodeURIComponent(err.message || 'oauth_error')}`);
    }
  }

  /**
   * POST /api/auth/social-login/complete
   * Called by the frontend onboarding form after the user picks subdomain and profession.
   * Validates the pending state token and completes account creation.
   */
  public static async completeSocialSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { state, desiredSubdomain, desiredProfession } = req.body;

      if (!state) throw new ValidationError('OAuth state token is required.');
      if (!desiredSubdomain) throw new ValidationError('Desired subdomain is required.');

      // Verify the pending token
      let pending: any;
      try {
        pending = jwt.verify(state, config.jwtSecret);
      } catch {
        throw new ValidationError('OAuth session expired or invalid. Please start again.');
      }

      if (!pending._oauthPending) {
        throw new ValidationError('Invalid OAuth state token.');
      }

      const result = await AuthService.socialLogin(
        {
          provider: pending.provider,
          email: pending.email,
          fullName: pending.fullName,
          providerId: pending.providerId,
          avatarUrl: pending.avatarUrl,
          desiredSubdomain,
          desiredProfession: desiredProfession || 'Software Engineer',
        },
        { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      );

      return sendSuccess({
        res,
        message: `Account created successfully via ${pending.provider}.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
