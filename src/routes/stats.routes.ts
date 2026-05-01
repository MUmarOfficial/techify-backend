import { Router } from 'express';
import { getAdminStats, getInstructorStats, getStudentStats } from '../controllers/stats.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(protect);

router.get('/admin', authorize('admin'), getAdminStats);
router.get('/instructor', authorize('instructor'), getInstructorStats);
router.get('/student', authorize('student'), getStudentStats);

export default router;
