import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { Role } from '@prisma/client';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};

export const requireTenantOwnership = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Super admin can access any tenant resources
  if (req.user.role === Role.SUPER_ADMIN) {
    return next();
  }

  // If request has a tenantUserId (or targetUserId param), verify ownership
  const targetUserId = req.params.userId || req.body.userId || req.query.userId || req.tenantUserId;

  if (targetUserId && targetUserId !== req.user.id) {
    return next(new ForbiddenError('Access denied: You cannot access or modify another tenant\'s data.'));
  }

  next();
};
