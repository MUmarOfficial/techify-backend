import { Router } from 'express';

import {
  createLesson,
  deleteLesson,
  getCourseLessonsPreview,
  getLessonsByCourse,
  updateLesson,
} from '../controllers/lesson.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { checkEnrollment, preventDownload } from '../middleware/checkEnrollment.middleware.js';

const router = Router();

// PUBLIC routes (no authentication)
router.get('/course/:courseId/preview', getCourseLessonsPreview);

// PROTECTED routes (require authentication and enrollment verification)
router.get('/course/:courseId', protect, checkEnrollment, preventDownload, getLessonsByCourse);
router.post('/', protect, authorize('instructor'), createLesson);
router.put('/:id', protect, authorize('instructor'), updateLesson);
router.delete('/:id', protect, authorize('instructor'), deleteLesson);

export default router;
