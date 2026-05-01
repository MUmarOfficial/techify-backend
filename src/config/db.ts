import mongoose from 'mongoose';
import { log } from '../utils/logger.js';
import { ENV } from './env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    log.info('🔄 Using existing MongoDB connection');
    return;
  }

  const uri = ENV.MONGO_URI;
  if (!uri)
    throw new Error('MONGO_URI is not defined in environment variables');

  try {
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0]?.readyState === mongoose.STATES.connected;
    log.info('✅ MongoDB connected successfully');
  } catch (err) {
    log.err('❌ MongoDB connection failed:', err);

    if (!ENV.IS_VERCEL) {
      process.exit(1);
    }
    throw err;
  }
}
