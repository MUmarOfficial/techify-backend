import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';


// Routes
import authRoutes from '../src/routes/auth.routes';
import courseRoutes from '../src/routes/course.routes';
import enrollmentRoutes from '../src/routes/enrollment.routes';
import progressRoutes from '../src/routes/progress.routes';
import lessonRoutes from '../src/routes/lesson.routes';
import statsRoutes from '../src/routes/stats.routes';
import userRoutes from '../src/routes/user.routes';
import categoryRoutes from '../src/routes/category.routes';
import { connectDB } from './config/db';

import { ENV } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import { log } from './utils/logger';

const app = express();

// Middleware
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: ENV.MAX_JSON_PAYLOAD }));
app.use(express.urlencoded({ extended: true, limit: ENV.MAX_JSON_PAYLOAD }));

// Serve uploads ONLY if we are not in a serverless environment (like Vercel)
if (!ENV.IS_VERCEL) {
  const uploadsDir = path.join(process.cwd(), ENV.UPLOAD_PATH);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use(`/${ENV.UPLOAD_PATH}`, express.static(uploadsDir));
}

if (ENV.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/categories', categoryRoutes);


// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorMiddleware);

import pkg from '../package.json';

import { User } from './models/User.model';
import { seedData } from './seeder';

const PORT = Number(ENV.PORT) || 5000;

// Function to start server / initialize DB
const initApp = async () => {
  try {
    await connectDB();
    
    // Automated Seeding on first deployment
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      log.info('📦 Empty database detected. Running automated seeder...');
      await seedData(true);
    }

    // Only listen if NOT on Vercel
    if (!ENV.IS_VERCEL) {
      app.listen(PORT, () => {
        log.info('=========================================');
        log.info(`🏷️  ${pkg.name} v${pkg.version}`);
        log.info(`🚀 Environment: ${ENV.NODE_ENV}`);
        log.info('=========================================');
        log.info(`► Base API:     http://localhost:${PORT}/api`);
        log.info(`► Health Check: http://localhost:${PORT}/health`);
        log.info('=========================================');
      });
    }
  } catch (err) {
    log.err('Failed to initialize application', err as Error);
  }
};

initApp().catch((err) => {
  log.err('Fatal error during application startup:', err);
});

// Required for Vercel Serverless
export default app;
