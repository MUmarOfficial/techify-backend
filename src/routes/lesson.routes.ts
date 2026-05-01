import { Router } from 'express';

import {
  createLesson,
  deleteLesson,
  getCourseLessonsPreview,
  getLessonsByCourse,
  updateLesson,
} from '../controllers/lesson.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { checkEnrollment, preventDownload } from '../middleware/checkEnrollment.middleware';

const router = Router();

// PUBLIC routes (no authentication)
router.get('/course/:courseId/preview', getCourseLessonsPreview);

// PROTECTED routes (require authentication and enrollment verification)
router.get('/course/:courseId', protect, checkEnrollment, preventDownload, getLessonsByCourse);
router.post('/', protect, authorize('instructor'), createLesson);
router.put('/:id', protect, authorize('instructor'), updateLesson);
router.delete('/:id', protect, authorize('instructor'), deleteLesson);

export default router;
