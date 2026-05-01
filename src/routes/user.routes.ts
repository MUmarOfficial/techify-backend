import { Router } from 'express';

import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUserRole,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(protect, authorize('admin')); // All user routes are admin-only

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);
router.patch('/:id/role', updateUserRole);

export default router;
