import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Enrollment } from '../models/Enrollment.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/progress/complete-lesson — mark lesson as complete
export const completeLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId, lessonId } = req.body as {
      enrollmentId: string;
      lessonId: string;
    };

    if (!enrollmentId || !lessonId) {
      throw new ApiError(400, 'enrollmentId and lessonId are required');
    }

    // Verify enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) throw new ApiError(404, 'Enrollment not found');

    // Verify student owns this enrollment
    if (enrollment.student.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, 'Not authorized to update this enrollment');
    }

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    // Verify lesson belongs to enrolled course
    if (lesson.course.toString() !== enrollment.course.toString()) {
      throw new ApiError(
        400,
        'This lesson does not belong to your enrolled course',
      );
    }

    // Add to completedLessons if not already there
    const lessonObjectId = new Types.ObjectId(lessonId);
    if (!enrollment.completedLessons.some((id) => id.toString() === lessonId)) {
      enrollment.completedLessons.push(lessonObjectId);
    }

    // Get total lessons in course
    const totalLessons = await Lesson.countDocuments({
      course: enrollment.course,
    });

    // Recalculate progress percentage
    enrollment.progress = Math.round(
      (enrollment.completedLessons.length / totalLessons) * 100,
    );

    await enrollment.save();

    res.json({
      success: true,
      message: 'Lesson marked complete',
      data: enrollment,
    });
  },
);

// PATCH /api/progress/watch-progress — update video watch percentage
export const updateWatchProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId, lessonId, percentage } = req.body as {
      enrollmentId: string;
      lessonId: string;
      percentage: number;
    };

    if (!enrollmentId || !lessonId || percentage === undefined) {
      throw new ApiError(
        400,
        'enrollmentId, lessonId, and percentage are required',
      );
    }

    if (percentage < 0 || percentage > 100) {
      throw new ApiError(400, 'Percentage must be between 0 and 100');
    }

    // Verify enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) throw new ApiError(404, 'Enrollment not found');

    // Verify student owns this enrollment
    if (enrollment.student.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, 'Not authorized to update this enrollment');
    }

    // Verify lesson exists and belongs to enrolled course
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new ApiError(404, 'Lesson not found');

    if (lesson.course.toString() !== enrollment.course.toString()) {
      throw new ApiError(
        400,
        'This lesson does not belong to your enrolled course',
      );
    }

    // Find or create watch progress entry for this lesson
    const existingIndex = enrollment.videoWatchProgress.findIndex(
      (wp) => wp.lessonId.toString() === lessonId,
    );

    if (existingIndex >= 0) {
      // Update existing entry
      enrollment.videoWatchProgress[existingIndex].percentage = percentage;
    } else {
      // Create new entry
      enrollment.videoWatchProgress.push({
        lessonId: new Types.ObjectId(lessonId),
        percentage,
      });
    }

    // Update lastAccessedLesson
    enrollment.lastAccessedLesson = new Types.ObjectId(lessonId);

    await enrollment.save();

    // Check if video is fully watched (95%+)
    const unlocked = percentage >= 95;

    res.json({
      success: true,
      message: 'Watch progress updated',
      data: {
        unlocked,
        percentage,
        lastAccessedLesson: enrollment.lastAccessedLesson,
      },
    });
  },
);

// GET /api/progress/:enrollmentId — get detailed progress data
export const getProgressData = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    // Verify enrollment exists
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course')
      .populate('student', 'name email');

    if (!enrollment) throw new ApiError(404, 'Enrollment not found');

    // Verify student owns this enrollment
    if (enrollment.student._id.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, 'Not authorized to view this enrollment');
    }

    // Get all lessons for the course, sorted by order
    const lessons = await Lesson.find({
      course: enrollment.course._id,
    }).sort({ order: 1 });

    // Map lessons with completion and watch progress status
    const lessonsWithStatus = lessons.map((lesson) => {
      const watchProgress = enrollment.videoWatchProgress.find(
        (wp) => wp.lessonId.toString() === lesson._id.toString(),
      );

      return {
        _id: lesson._id,
        title: lesson.title,
        order: lesson.order,
        isCompleted: enrollment.completedLessons.includes(lesson._id),
        watchPercentage: watchProgress?.percentage || 0,
        isCurrent:
          enrollment.lastAccessedLesson?.toString() === lesson._id.toString(),
      };
    });

    res.json({
      success: true,
      data: {
        enrollmentId,
        progress: enrollment.progress,
        completedCount: enrollment.completedLessons.length,
        totalLessons: lessons.length,
        lastAccessedLesson: enrollment.lastAccessedLesson,
        lessons: lessonsWithStatus,
      },
    });
  },
);
