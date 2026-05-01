import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { Enrollment } from '../models/Enrollment.model.js';
import type { IUser } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';

interface UserRequest extends Request {
  user?: IUser;
  enrollmentId?: string;
}

// Middleware to verify user is enrolled in the course before accessing video
export const checkEnrollment = async (
  req: UserRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get courseId from params or query
    const courseId = (req.params.courseId || req.query.courseId) as string;
    const userId = req.user?._id;

    if (!courseId || !userId) {
      throw new ApiError(400, 'Course ID and authentication required');
    }

    // Find enrollment record
    const enrollment = await Enrollment.findOne({
      course: new Types.ObjectId(courseId),
      student: userId,
    });

    if (!enrollment) {
      throw new ApiError(
        403,
        'You are not enrolled in this course. Please enroll to access videos.',
      );
    }

    // Store enrollment in request for later use
    req.enrollmentId = enrollment._id.toString();
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      const message =
        error instanceof Error ? error.message : 'Failed to verify enrollment';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
};

// Middleware to set response headers to prevent video downloads
export const preventDownload = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Set headers to prevent file download
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Remove Content-Disposition download header if it exists
  res.removeHeader('Content-Disposition-Download');

  next();
};
