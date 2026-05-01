import type { Request, Response } from 'express';
import { z } from 'zod';

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
    res.status(201).json({
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

const processPaymentSchema = z.object({
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  last4Digits: z
    .string()
    .length(4, 'Last 4 digits must be exactly 4 characters'),
});

// POST /api/enroll/:id/pay — student only
export const processPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = processPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(', ');
      throw new ApiError(400, messages);
    }

    // Validation success implies req.body matches schema

    // Simulate payment processing...
    const transactionId = `txn_mock_${Math.random().toString(36).substring(2, 10)}`;

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: req.params.id, student: req.user!._id },
      {
        paymentStatus: 'completed',
        paymentMethod: 'mock_credit_card',
        transactionId,
      },
      { new: true },
    );

    if (!enrollment) throw new ApiError(404, 'Enrollment not found');

    res.json({
      success: true,
      message: 'Payment successful',
      data: enrollment,
    });
  },
);
