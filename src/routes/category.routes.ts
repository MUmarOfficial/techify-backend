import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getCategories,
} from '../controllers/category.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getCategories);
router.post('/', protect, authorize('admin'), createCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
