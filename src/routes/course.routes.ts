import { Router } from 'express';

import {
  createCourse,
  deleteCourse,
  getCourseById,
  getCourses,
  getMyCourses,
  updateCourse,
} from '../controllers/course.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.get('/', getCourses);
router.get('/my', protect, authorize('instructor'), getMyCourses);
router.get('/:id', getCourseById);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

export default router;
