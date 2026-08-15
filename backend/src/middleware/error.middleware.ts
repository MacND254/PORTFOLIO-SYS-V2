import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return sendError({
      res,
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      errors: err.errors,
    });
  }

  // Handle Prisma errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return sendError({
        res,
        statusCode: 409,
        message: 'A record with this unique value already exists.',
        code: 'DUPLICATE_RECORD',
      });
    }
  }

  return sendError({
    res,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_SERVER_ERROR',
  });
};
