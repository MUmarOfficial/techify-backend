import type { Request, Response } from 'express';

import { Course } from '../models/Course.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/enroll — student only
export const enrollInCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.body as { courseId: string };
    if (!courseId) throw new ApiError(400, 'courseId is required');

    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, 'Course not found');

    const existing = await Enrollment.findOne({
      student: req.user!._id,
      course: courseId,
    });
    if (existing) throw new ApiError(409, 'Already enrolled in this course');

    const enrollment = await Enrollment.create({
      student: req.user!._id,
      course: courseId,
    });
    res
      .status(201)
      .json({
        success: true,
        message: 'Enrolled successfully',
        data: enrollment,
      });
  },
);

// GET /api/my-courses — student only
export const getMyEnrollments = asyncHandler(
  async (req: Request, res: Response) => {
    const enrollments = await Enrollment.find({ student: req.user!._id })
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name email' },
      })
      .sort({ enrolledAt: -1 });
    res.json({ success: true, count: enrollments.length, data: enrollments });
  },
);

// PATCH /api/enroll/:id/progress — student only
export const updateProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const { progress } = req.body as { progress: number };
    if (progress === undefined || progress < 0 || progress > 100) {
      throw new ApiError(400, 'Progress must be a number between 0 and 100');
    }
    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, student: req.user!._id },
      { progress },
      { new: true },
    );
    if (!enrollment) throw new ApiError(404, 'Enrollment not found');
    res.json({ success: true, message: 'Progress updated', data: enrollment });
  },
);

// Admin: GET /api/enroll/all — admin only
export const getAllEnrollments = asyncHandler(
  async (_req: Request, res: Response) => {
    const enrollments = await Enrollment.find()
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 });
    res.json({ success: true, count: enrollments.length, data: enrollments });
  },
);
