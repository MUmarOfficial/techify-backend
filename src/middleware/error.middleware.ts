import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { log } from '../utils/logger';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  log.err(`[ERROR] ${err.message}`);

  // Mongoose duplicate key
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    const errorObj = err as { keyValue?: Record<string, unknown> };
    const field = Object.keys(errorObj.keyValue || {})[0] ?? 'field';
    res
      .status(409)
      .json({ success: false, message: `${field} already exists` });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErr = err as {
      errors?: Record<string, { message: string }>;
    };
    const messages = Object.values(validationErr.errors || {}).map(
      (e) => e.message,
    );
    res.status(400).json({ success: false, message: messages.join(', ') });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res
      .status(401)
      .json({ success: false, message: 'Token expired — please log in again' });
    return;
  }

  // Custom API error
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Unknown error
  res.status(500).json({ success: false, message: 'Internal server error' });
}
