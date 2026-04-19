import express from 'express';
import passport from 'passport';
import { signup, login, getMe, getUserCount, googleCallback } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateAuthInput } from '../middleware/validationMiddleware.js';
import { rateLimitLogin, rateLimitSignup } from '../middleware/rateLimitHttpMiddleware.js';

const router = express.Router();

// Public routes with validation and rate limiting
router.post('/signup', rateLimitSignup, validateAuthInput, signup);
router.post('/login', rateLimitLogin, validateAuthInput, login);
router.get('/user-count', getUserCount);

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    googleCallback
);

// Protected routes
router.get('/me', protect, getMe);

export default router;
