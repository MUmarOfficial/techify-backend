import { Document, model, Schema, Types } from 'mongoose';

export interface IEnrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  progress: number;
  completedLessons: Types.ObjectId[];
  lastAccessedLesson?: Types.ObjectId;
  videoWatchProgress: Array<{
    lessonId: Types.ObjectId;
    percentage: number;
  }>;
  enrolledAt: Date;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  transactionId?: string;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    lastAccessedLesson: { type: Schema.Types.ObjectId, ref: 'Lesson' },
    videoWatchProgress: [
      {
        lessonId: {
          type: Schema.Types.ObjectId,
          ref: 'Lesson',
          required: true,
        },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
  },
  { timestamps: { createdAt: 'enrolledAt', updatedAt: false } },
);

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);
