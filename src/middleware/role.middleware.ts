import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied — requires role: ${roles.join(' or ')}`,
      );
    }
    next();
  };
