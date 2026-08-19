import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

export interface OAuthProfile {
  provider: 'google' | 'github';
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
}

declare global {
  namespace Express {
    // Express.User represents the logged-in user attached to req.user by auth.middleware
    interface User {
      id: string;
      email: string;
      role: Role;
      fullName: string;
      provider?: 'google' | 'github';
      providerId?: string;
      avatarUrl?: string;
    }

    interface Request {
      user?: User;
      tenantSubdomain?: string;
      tenantUserId?: string;
    }
  }
}

export {};
