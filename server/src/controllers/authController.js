const User = require('../models/User');
const { ROLES, ROLE_LIST } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// Helper: Set JWT token in HTTP-only cookie
// ──────────────────────────────────────────────
const sendTokenCookie = (user, statusCode, res, message) => {
  const token = user.generateToken();

  const cookieOptions = {
    httpOnly: true, // Not accessible via JavaScript (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) * 24 * 60 * 60 * 1000, // days → ms
  };

  res.cookie('token', token, cookieOptions);

  return sendSuccess(res, statusCode, message, {
    user: user.toSafeObject(),
    token,
  });
};

// ──────────────────────────────────────────────
// POST /api/auth/register
// Admin-only: creates a new user account.
// ──────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 400, 'A user with this email already exists');
    }

    // Validate role if provided
    if (role && !ROLE_LIST.includes(role)) {
      return sendError(res, 400, `Invalid role. Allowed: ${ROLE_LIST.join(', ')}`);
    }

    // Only Admin can create Admin accounts
    if (role === ROLES.ADMIN && req.user.role !== ROLES.ADMIN) {
      return sendError(res, 403, 'Only an Admin can create Admin accounts');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.EMPLOYEE,
      department: department || '',
      phone: phone || '',
    });

    return sendSuccess(res, 201, 'User registered successfully', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/login
// Public: authenticates user and sets JWT cookie.
// ──────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated — contact your administrator');
    }

    // Compare submitted password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    return sendTokenCookie(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/logout
// Clears the JWT cookie.
// ──────────────────────────────────────────────
const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0), // Expire immediately
  });

  return sendSuccess(res, 200, 'Logged out successfully');
};

// ──────────────────────────────────────────────
// GET /api/auth/me
// Returns the currently authenticated user's profile.
// ──────────────────────────────────────────────
const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  return sendSuccess(res, 200, 'User profile retrieved', {
    user: req.user.toSafeObject(),
  });
};

// ──────────────────────────────────────────────
// PUT /api/auth/me
// Allows the authenticated user to update their
// own name, phone, and department (not role).
// ──────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, department } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (department !== undefined) updates.department = department;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, 200, 'Profile updated', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
};
