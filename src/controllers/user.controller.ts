import type { Request, Response } from 'express';

import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

// GET /api/users — admin only
export const getAllUsers = asyncHandler(
  async (_req: Request, res: Response) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  },
);

// GET /api/users/:id — admin only
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

// DELETE /api/users/:id — admin only
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin')
    throw new ApiError(403, 'Cannot delete an admin user');
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully' });
});

// PATCH /api/users/:id/role — admin only
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { role } = req.body as { role: 'student' | 'instructor' | 'admin' };
    if (!['student', 'instructor', 'admin'].includes(role))
      throw new ApiError(400, 'Invalid role');
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    );
    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, message: 'User role updated', data: user });
  },
);
