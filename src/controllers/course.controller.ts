import type { Request, Response } from 'express';

import { Course } from '../models/Course.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { saveBase64ToFile } from '../utils/fileUpload';


// GET /api/courses — public
export const getCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await Course.find()
    .populate('instructor', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: courses.length, data: courses });
});

// GET /api/courses/:id — public
export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id).populate(
      'instructor',
      'name email',
    );
    if (!course) throw new ApiError(404, 'Course not found');
    res.json({ success: true, data: course });
  },
);

// POST /api/courses — instructor only
export const createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, category, price, thumbnail } = req.body as {
      title: string;
      description: string;
      category: string;
      price: number;
      thumbnail?: string;
    };
    if (!title || !description || !category || price === undefined) {
      throw new ApiError(
        400,
        'Title, description, category, and price are required',
      );
    }
    const finalThumbnail = thumbnail ? await saveBase64ToFile(thumbnail) : '';

    const course = await Course.create({
      title,
      description,
      category,
      price,
      thumbnail: finalThumbnail,
      instructor: req.user!._id,
    });

    res
      .status(201)
      .json({ success: true, message: 'Course created', data: course });
  },
);

// PUT /api/courses/:id — instructor (own) or admin
export const updateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    const isOwner = course.instructor.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin)
      throw new ApiError(403, 'Not authorized to update this course');

    const updateData = { ...(req.body as Record<string, unknown>) };
    if (typeof updateData.thumbnail === 'string') {
      updateData.thumbnail = await saveBase64ToFile(updateData.thumbnail);
    }


    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    res.json({ success: true, message: 'Course updated', data: updated });
  },
);

// DELETE /api/courses/:id — instructor (own) or admin
export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new ApiError(404, 'Course not found');

    const isOwner = course.instructor.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin)
      throw new ApiError(403, 'Not authorized to delete this course');

    await course.deleteOne();
    res.json({ success: true, message: 'Course deleted' });
  },
);

// GET /api/courses/my — instructor's own courses
export const getMyCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const courses = await Course.find({ instructor: req.user!._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: courses.length, data: courses });
  },
);
