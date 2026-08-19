import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from './env';

export function configurePassport() {
  // ── Google OAuth Strategy ──────────────────────────────────────────────────
  if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.google.clientId,
          clientSecret: config.oauth.google.clientSecret,
          callbackURL: config.oauth.google.callbackUrl,
          scope: ['profile', 'email'],
        },
        (_accessToken, _refreshToken, profile, done) => {
          // Pass the normalised profile to the route handler via req.user
          const user = {
            provider: 'google' as const,
            providerId: profile.id,
            email: profile.emails?.[0]?.value || '',
            fullName: profile.displayName || '',
            avatarUrl: profile.photos?.[0]?.value || '',
          };
          return done(null, user as any);
        }
      )
    );
  }

  // ── GitHub OAuth Strategy ──────────────────────────────────────────────────
  if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: config.oauth.github.clientId,
          clientSecret: config.oauth.github.clientSecret,
          callbackURL: config.oauth.github.callbackUrl,
          scope: ['user:email'],
        },
        (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          const email =
            profile.emails?.find((e: any) => e.primary)?.value ||
            profile.emails?.[0]?.value ||
            `${profile.username}@github.noemail`;
          const user = {
            provider: 'github' as const,
            providerId: profile.id,
            email,
            fullName: profile.displayName || profile.username || '',
            avatarUrl: profile.photos?.[0]?.value || '',
          };
          return done(null, user as any);
        }
      )
    );
  }

  // Minimal serializers (we don't use sessions — JWT only)
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: any, done) => done(null, user));
}
