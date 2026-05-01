import { Document, model, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Category = model<ICategory>('Category', categorySchema);
