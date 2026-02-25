import express from 'express';
import passport from 'passport';
import { signup, login, getMe, getUserCount, googleCallback } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/user-count', getUserCount);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    googleCallback
);

// Protected routes
router.get('/me', protect, getMe);

export default router;
