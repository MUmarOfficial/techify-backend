import { Router } from 'express';

import {
  enrollInCourse,
  getAllEnrollments,
  getMyEnrollments,
  updateProgress,
} from '../controllers/enrollment.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.post('/', protect, authorize('student'), enrollInCourse);
router.get('/my-courses', protect, authorize('student'), getMyEnrollments);
router.patch('/:id/progress', protect, authorize('student'), updateProgress);
router.get('/all', protect, authorize('admin'), getAllEnrollments);

export default router;
