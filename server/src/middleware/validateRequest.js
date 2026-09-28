const { sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// Request Validation Middleware
//
// Generic factory that validates req.body against
// a validation function you provide. Keeps
// controllers clean — no inline validation code.
//
// Usage:
//   router.post('/assets', protect, validateRequest(validateCreateAsset), createAsset);
// ──────────────────────────────────────────────

/**
 * @param {Function} validatorFn  A function that receives the request body
 *                                and returns { isValid: boolean, errors: string[] }
 * @returns {Function} Express middleware
 */
const validateRequest = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors } = validatorFn(req.body);

    if (!isValid) {
      return sendError(res, 400, 'Validation failed', errors);
    }

    next();
  };
};

// ── Auth Validators ─────────────────────────

const validateRegister = (body) => {
  const errors = [];

  if (!body.name || !body.name.trim()) {
    errors.push('Name is required');
  }

  if (!body.email || !body.email.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!body.password) {
    errors.push('Password is required');
  } else if (body.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return { isValid: errors.length === 0, errors };
};

const validateLogin = (body) => {
  const errors = [];

  if (!body.email || !body.email.trim()) {
    errors.push('Email is required');
  }

  if (!body.password) {
    errors.push('Password is required');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateRequest,
  validateRegister,
  validateLogin,
};
