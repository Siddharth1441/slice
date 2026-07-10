import express from 'express';
import {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMenu);

// Protected routes (Admin only)
router.post('/', protect, restrictTo('admin'), createMenuItem);
router.put('/:id', protect, restrictTo('admin'), updateMenuItem);
router.delete('/:id', protect, restrictTo('admin'), deleteMenuItem);

export default router;
