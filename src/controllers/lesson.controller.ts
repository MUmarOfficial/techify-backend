import type { Request, Response } from 'express';

import { Course } from '../models/Course.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { saveBase64ToFile } from '../utils/fileUpload.js';


// GET /api/lessons/course/:courseId — protected
export const getLessonsByCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort({
      order: 1,
    });
    res.json({ success: true, count: lessons.length, data: lessons });
  },
);

// GET /api/lessons/course/:courseId/preview — PUBLIC (no auth required)
export const getCourseLessonsPreview = asyncHandler(
  async (req: Request, res: Response) => {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .select('title content thumbnail order course')
      .sort({ order: 1 });

    res.json({ success: true, count: lessons.length, data: lessons });
  },
);

// POST /api/lessons — instructor only
export const createLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, content, videoUrl, thumbnail, courseId, order } = req.body as {
      title: string;
      content: string;
      videoUrl?: string;
      thumbnail?: string;
      courseId: string;
      order: number;
    };
    if (!title || !content || !courseId || !order) {
      throw new ApiError(
        400,
        'Title, content, courseId, and order are required',
      );
    }
    const course = await Course.findById(courseId);
    if (!course) throw new ApiError(404, 'Course not found');
    if (course.instructor.toString() !== req.user?._id.toString()) {
      throw new ApiError(403, 'You can only add lessons to your own courses');
    }

    // Process base64 files — any validation errors are caught by asyncHandler
    // and handled by error middleware (invalid format, size exceeds limit, etc.)
    const finalVideoUrl = videoUrl ? await saveBase64ToFile(videoUrl) : '';
    const finalThumbnail = thumbnail ? await saveBase64ToFile(thumbnail) : '';

    const lesson = await Lesson.create({
      title,
      content,
      videoUrl: finalVideoUrl,
      thumbnail: finalThumbnail,
      course: courseId,
      order,
    });

    res
      .status(201)
      .json({ success: true, message: 'Lesson created', data: lesson });
  },
);

// PUT /api/lessons/:id — instructor only
export const updateLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) throw new ApiError(404, 'Lesson not found');
    const course = await Course.findById(lesson.course);
    if (course?.instructor?.toString() !== req.user?._id?.toString()) {
      throw new ApiError(403, 'Not authorized to update this lesson');
    }
    const updateData = { ...(req.body as Record<string, unknown>) };

    // Process base64 files if provided — validation errors are caught by asyncHandler
    // Errors include: invalid format, unsupported MIME type, size exceeds limit
    if (typeof updateData.videoUrl === 'string') {
      updateData.videoUrl = await saveBase64ToFile(updateData.videoUrl);
    }
    if (typeof updateData.thumbnail === 'string') {
      updateData.thumbnail = await saveBase64ToFile(updateData.thumbnail);
    }

    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    res.json({ success: true, message: 'Lesson updated', data: updated });
  },
);

// DELETE /api/lessons/:id — instructor only
export const deleteLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) throw new ApiError(404, 'Lesson not found');
    const course = await Course.findById(lesson.course);
    if (course?.instructor?.toString() !== req.user?._id?.toString()) {
      throw new ApiError(403, 'Not authorized to delete this lesson');
    }
    await lesson.deleteOne();
    res.json({ success: true, message: 'Lesson deleted' });
  },
);
