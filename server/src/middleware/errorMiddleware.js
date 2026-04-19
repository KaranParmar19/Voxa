import logger from '../lib/logger.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Log the full error details (server-side only)
  logger.error(
    {
      err,
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?._id?.toString?.(),
    },
    'http_unhandled_error'
  );

  // Send sanitized error message to client (never expose sensitive info)
  const message = isDev 
    ? (err.message || 'Internal Server Error')
    : 'An error occurred. Please try again later.';

  res.status(statusCode).json({
    message,
    // Only include request ID in dev mode for debugging
    ...(isDev && { requestId: req.id }),
  });
};
