import { Router } from 'express';
import { createCategory, deleteCategory, getCategories } from '../controllers/category.controller';
import { authorize, protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', protect, authorize('admin'), createCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
