const User = require('../models/User');
const { ROLE_LIST } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// GET /api/users
// Admin-only: list all users with optional filters.
// ──────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Users retrieved', {
      users: users.map((u) => u.toSafeObject()),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/users/:id
// Admin-only: get a single user by ID.
// ──────────────────────────────────────────────
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User retrieved', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/users/:id
// Admin-only: update a user's role, department,
// phone, or active status.
// ──────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const { name, role, department, phone, isActive } = req.body;

    // Validate role if provided
    if (role && !ROLE_LIST.includes(role)) {
      return sendError(res, 400, `Invalid role. Allowed: ${ROLE_LIST.join(', ')}`);
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && isActive === false) {
      return sendError(res, 400, 'You cannot deactivate your own account');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User updated', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
};
