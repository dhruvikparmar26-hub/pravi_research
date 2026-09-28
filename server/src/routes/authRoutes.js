const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
  validateRequest,
  validateRegister,
  validateLogin,
} = require('../middleware/validateRequest');
const { ROLES } = require('../config/constants');

// ── Public Routes ───────────────────────────
router.post('/login', validateRequest(validateLogin), login);
router.post('/logout', logout);

// ── Protected Routes ────────────────────────
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

// ── Admin-only ──────────────────────────────
router.post(
  '/register',
  protect,
  authorize(ROLES.ADMIN),
  validateRequest(validateRegister),
  register
);

module.exports = router;
