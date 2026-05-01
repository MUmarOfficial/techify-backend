import mongoose from 'mongoose';

import { log } from '../utils/logger';
import { ENV } from './env';

export async function connectDB(): Promise<void> {
  const uri = ENV.MONGO_URI;
  if (!uri)
    throw new Error('MONGO_URI is not defined in environment variables');
  try {
    await mongoose.connect(uri);
    log.info('✅ MongoDB connected successfully');
  } catch (err) {
    log.err('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}
