import type { Request, Response } from 'express';
import { Category } from '../models/Category.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// GET /api/categories
export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, categories });
});

// POST /api/categories (Admin Only)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  if (!name) throw new ApiError(400, 'Category name is required');

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) throw new ApiError(409, 'Category already exists');

  const category = await Category.create({ name: name.trim() });
  res.status(201).json({ success: true, category });
});

// DELETE /api/categories/:id (Admin Only)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});
