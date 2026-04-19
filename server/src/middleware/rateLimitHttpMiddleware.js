import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '../lib/logger.js';

// Create rate limiters for different endpoints
const authLimiter = new RateLimiterMemory({
    points: 5, // 5 requests per window
    duration: 15 * 60, // 15 minutes
});

const loginLimiter = new RateLimiterMemory({
    points: 5, // 5 login attempts per window
    duration: 15 * 60, // 15 minutes
});

const signupLimiter = new RateLimiterMemory({
    points: 3, // 3 signup attempts per window
    duration: 60 * 60, // 1 hour
});

// Middleware to apply rate limiting
const createRateLimitMiddleware = (limiter, message = 'Too many requests, please try again later') => {
    return async (req, res, next) => {
        try {
            const key = req.ip || req.connection.remoteAddress;
            await limiter.consume(key);
            next();
        } catch (error) {
            logger.warn(
                { 
                    ip: req.ip, 
                    endpoint: req.originalUrl,
                    remaining: error.remainingPoints,
                    resetTime: error.msBeforeNext 
                },
                'rate_limit_exceeded'
            );
            res.status(429).json({ 
                message,
                retryAfter: Math.ceil(error.msBeforeNext / 1000),
            });
        }
    };
};

export const rateLimitAuth = createRateLimitMiddleware(authLimiter, 'Too many auth requests');
export const rateLimitLogin = createRateLimitMiddleware(loginLimiter, 'Too many login attempts');
export const rateLimitSignup = createRateLimitMiddleware(signupLimiter, 'Too many signup attempts');
