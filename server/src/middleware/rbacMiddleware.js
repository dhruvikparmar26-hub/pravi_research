const { sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// Role-Based Access Control Middleware
//
// Usage in routes:
//   router.post('/assets', protect, authorize('ADMIN', 'ASSET_MANAGER'), createAsset);
//
// Must be used AFTER the `protect` middleware
// because it reads req.user.role.
// ──────────────────────────────────────────────

/**
 * Returns middleware that allows only the specified roles.
 *
 * @param  {...string} allowedRoles  One or more role strings (from constants.js)
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // protect middleware should have already set req.user
    if (!req.user) {
      return sendError(res, 401, 'Not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = { authorize };
