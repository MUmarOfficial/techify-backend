import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { ENV } from '../config/env.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { saveBase64ToFile } from '../utils/fileUpload.js';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const generateToken = (id: string): string => {
  const secret = ENV.JWT_SECRET!;
  const expiresIn = ENV.JWT_EXPIRES_IN;
  return jwt.sign({ id }, secret, { expiresIn } as jwt.SignOptions);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'instructor';
  };

  if (!name || !email || !password)
    throw new ApiError(400, 'Name, email, and password are required');
  if (!PASSWORD_REGEX.test(password))
    throw new ApiError(
      400,
      'Password must be at least 8 characters and include a letter, a number, and a symbol',
    );

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, 'Email already registered');

  const user = await User.create({
    name,
    email,
    password,
    role: role ?? 'student',
  });
  const token = generateToken(user._id.toString());

  res
    .status(201)
    .json({ success: true, message: 'Registration successful', token, user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password)
    throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken(user._id.toString());
  user.password = '';
  res.json({ success: true, message: 'Login successful', token, user });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, user });
});

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword)
      throw new ApiError(400, 'Current and new password are required');

    if (!PASSWORD_REGEX.test(newPassword))
      throw new ApiError(
        400,
        'New password must be at least 8 characters and include a letter, a number, and a symbol',
      );

    const user = await User.findById(req.user!._id).select('+password');
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  },
);

/**
 * Helper to validate profile update data
 * Reduces cognitive complexity of the main controller
 */
const validateUpdateData = async (
  userId: string,
  name?: string,
  email?: string,
  avatar?: string,
) => {
  if (!name && !email && avatar === undefined) {
    throw new ApiError(400, 'Nothing to update');
  }

  if (name && (name.trim().length < 2 || name.trim().length > 50)) {
    throw new ApiError(400, 'Name must be between 2 and 50 characters');
  }

  if (email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    const conflict = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId },
    });
    if (conflict) {
      throw new ApiError(409, 'Email already in use by another account');
    }
  }

  if (avatar && avatar.length > 1_500_000) {
    throw new ApiError(400, 'Avatar image exceeds 1 MB limit');
  }
};

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, avatar } = req.body as {
      name?: string;
      email?: string;
      avatar?: string;
    };

    await validateUpdateData(req.user!._id.toString(), name, email, avatar);

    const updates: { name?: string; email?: string; avatar?: string } = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (avatar !== undefined) {
      updates.avatar = avatar ? await saveBase64ToFile(avatar) : '';
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ success: true, message: 'Profile updated', user });
  },
);
