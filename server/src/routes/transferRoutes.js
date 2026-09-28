const express = require('express');
const router = express.Router();
const {
  getTransfers,
  getTransfer,
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
} = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All transfer routes require authentication
router.use(protect);

// ── Read — any authenticated user ───────────
router.get('/', getTransfers);
router.get('/:id', getTransfer);

// ── Request a transfer — Admin & Asset Manager
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  requestTransfer
);

// ── Approve / Reject — Admin only ───────────
router.put(
  '/:id/approve',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  approveTransfer
);

router.put(
  '/:id/reject',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  rejectTransfer
);

// ── Dispatch — Admin & Asset Manager ────────
router.put(
  '/:id/dispatch',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  dispatchTransfer
);

// ── Receive at destination — Admin, Asset Manager, Technician
router.put(
  '/:id/receive',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN),
  receiveTransfer
);

module.exports = router;
