import logger from '../lib/logger.js';

// Sanitize strings to prevent XSS
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/[<>\"']/g, (match) => {
            const escaped = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
            return escaped[match];
        });
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

// Validate password strength
const isValidPassword = (password) => {
    return password.length >= 6 && password.length <= 128;
};

// Middleware to validate auth inputs
export const validateAuthInput = (req, res, next) => {
    try {
        const { email, password, name, confirmPassword } = req.body;

        // Validate email if present
        if (email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            req.body.email = email.toLowerCase().trim();
        }

        // Validate password if present
        if (password) {
            if (!isValidPassword(password)) {
                return res.status(400).json({ 
                    message: 'Password must be between 6 and 128 characters' 
                });
            }
        }

        // Validate confirm password match
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Sanitize name if present
        if (name) {
            if (name.length < 2 || name.length > 100) {
                return res.status(400).json({ 
                    message: 'Name must be between 2 and 100 characters' 
                });
            }
            req.body.name = sanitizeString(name);
        }

        next();
    } catch (error) {
        logger.warn({ err: error }, 'validation_middleware_error');
        res.status(400).json({ message: 'Invalid request data' });
    }
};

// Middleware to validate room inputs
export const validateRoomInput = (req, res, next) => {
    try {
        const { name, roomId } = req.body;

        if (name) {
            if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
                return res.status(400).json({ 
                    message: 'Room name must be between 1 and 100 characters' 
                });
            }
            req.body.name = sanitizeString(name);
        }

        if (roomId) {
            if (typeof roomId !== 'string' || !/^[A-Z0-9]{6}$/.test(roomId.toUpperCase())) {
                return res.status(400).json({ 
                    message: 'Invalid room ID format' 
                });
            }
        }

        next();
    } catch (error) {
        logger.warn({ err: error }, 'room_validation_error');
        res.status(400).json({ message: 'Invalid request data' });
    }
};

export { sanitizeString, isValidEmail, isValidPassword };
