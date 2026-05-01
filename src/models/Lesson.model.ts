import { Document, model, Schema, Types } from 'mongoose';

export interface ILesson extends Document {
  title: string;
  content: string;
  videoUrl?: string;
  thumbnail?: string;
  course: Types.ObjectId;
  order: number;

  createdAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    content: { type: String, required: [true, 'Content is required'] },
    videoUrl: { type: String, default: '' },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true, min: 1 },
    thumbnail: { type: String, default: '' },
  },

  { timestamps: true },
);

export const Lesson = model<ILesson>('Lesson', lessonSchema);
