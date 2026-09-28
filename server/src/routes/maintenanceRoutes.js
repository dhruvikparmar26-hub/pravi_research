const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  getAssetMaintenanceHistory,
  createTicket,
  assignTechnician,
  startWork,
  waitForParts,
  updateWorkLog,
  resolveTicket,
  closeTicket,
  addComment,
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All maintenance routes require authentication
router.use(protect);

// ── Read — any authenticated user ───────────
router.get('/', getTickets);
router.get('/:id', getTicket);
router.get('/asset/:assetId', getAssetMaintenanceHistory);

// ── Create ticket — all roles can report issues
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN, ROLES.EMPLOYEE),
  createTicket
);

// ── Assign technician — Admin & Asset Manager
router.put(
  '/:id/assign',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  assignTechnician
);

// ── Work lifecycle — Technician (and Admin/Manager)
router.put(
  '/:id/start',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN),
  startWork
);

router.put(
  '/:id/wait-for-parts',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN),
  waitForParts
);

router.put(
  '/:id/work-log',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN),
  updateWorkLog
);

router.put(
  '/:id/resolve',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN),
  resolveTicket
);

// ── Close ticket — Manager sign-off only
router.put(
  '/:id/close',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  closeTicket
);

// ── Add comment / activity log message — all authenticated users
router.post('/:id/comment', addComment);

module.exports = router;
