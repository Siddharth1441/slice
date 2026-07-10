import express from 'express';
import {
  placeOrder,
  trackOrder,
  getOrders,
  updateOrderStatus,
  getSalesReport,
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Public endpoints
router.post('/', placeOrder);
router.get('/track/:id', trackOrder);

// Protected endpoints
router.get('/', protect, restrictTo('admin', 'chef'), getOrders);
router.put('/:id/status', protect, restrictTo('admin', 'chef'), updateOrderStatus);
router.get('/sales-report', protect, restrictTo('admin'), getSalesReport);

export default router;
