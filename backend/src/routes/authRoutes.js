import express from 'express';
import {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  registerUser,
} from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Only authenticated admins can register new users (chefs or other admins)
router.post('/register', protect, restrictTo('admin'), registerUser);

export default router;
