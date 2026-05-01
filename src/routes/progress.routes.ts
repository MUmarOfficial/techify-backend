import { Router } from 'express';

import {
  completeLesson,
  getProgressData,
  updateWatchProgress,
} from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication (student only)
router.use(protect);

// POST /api/progress/complete-lesson
router.post('/complete-lesson', completeLesson);

// PATCH /api/progress/watch-progress
router.patch('/watch-progress', updateWatchProgress);

// GET /api/progress/:enrollmentId
router.get('/:enrollmentId', getProgressData);

export default router;
