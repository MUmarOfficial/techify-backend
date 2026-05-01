import { Document, model, Schema, Types } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: Types.ObjectId;
  category: string;
  price: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    thumbnail: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Course = model<ICourse>('Course', courseSchema);
