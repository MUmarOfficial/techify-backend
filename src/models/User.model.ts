import bcrypt from 'bcryptjs';
import { Document, model, Schema } from 'mongoose';

import { ENV } from '../config/env.js';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);


// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const rounds = ENV.BCRYPT_ROUNDS;
  this.password = await bcrypt.hash(this.password, rounds);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, String(this.password));
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform: (_doc, ret: Partial<IUser>) => {
    delete ret.password;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
