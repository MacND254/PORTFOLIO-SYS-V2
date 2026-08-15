import { Response } from 'express';

export interface ApiResponseOptions<T = any> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  code?: string;
  errors?: any[];
  meta?: any;
}

export const sendSuccess = <T>({
  res,
  statusCode = 200,
  message,
  data,
  meta,
}: ApiResponseOptions<T>) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : null,
    ...(meta ? { meta } : {}),
  });
};

export const sendError = ({
  res,
  statusCode = 400,
  message,
  code = 'BAD_REQUEST',
  errors = [],
}: ApiResponseOptions) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
  });
};
