const { sendError } = require('../utils/apiResponse');

/**
 * Global error-handling middleware.
 * Every unhandled error in controllers/services eventually reaches here.
 *
 * Must be registered LAST in the Express middleware chain
 * (after all routes) so Express recognises the 4-parameter signature.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no status was set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose Bad ObjectId ─────────────────
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found — invalid ID format';
  }

  // ── Mongoose Duplicate Key ────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    statusCode = 400;
    message = `Duplicate value entered for: ${field}`;
  }

  // ── Mongoose Validation Error ─────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    statusCode = 400;
    message = messages.join('. ');
  }

  // ── JWT Errors ────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('ERROR →', err);
  }

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
