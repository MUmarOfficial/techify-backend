import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { ENV } from '../config/env.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) throw new ApiError(401, 'Not authorized — no token provided');

    const secret = ENV.JWT_SECRET;
    if (!secret) throw new ApiError(500, 'JWT secret is not configured');

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    if (!user)
      throw new ApiError(401, 'User belonging to this token no longer exists');

    req.user = user as unknown as typeof req.user;
    next();
  },
);

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `User role ${req.user?.role} is not authorized to access this route`,
      );
    }
    next();
  };
};
