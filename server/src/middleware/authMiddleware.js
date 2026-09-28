const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// Authentication Middleware
// Extracts JWT from HTTP-only cookie, verifies it,
// and attaches the full user document to req.user.
// ──────────────────────────────────────────────

const protect = async (req, res, next) => {
  try {
    // 1. Extract token from cookie or Authorization header
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Not authenticated — please log in');
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user — make sure account still exists and is active
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 401, 'User belonging to this token no longer exists');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated — contact your administrator');
    }

    // 4. Attach user to request — available in all downstream handlers
    req.user = user;
    next();
  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    // Let the global error handler format them
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Invalid or expired token — please log in again');
    }
    next(error);
  }
};

module.exports = { protect };
