import { Router } from 'express';
import {
  changePassword,
  getMe,
  login,
  register,
  updateProfile,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/change-password', protect, changePassword);
router.patch('/profile', protect, updateProfile);

export default router;
