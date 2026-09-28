const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  changeAssetStatus,
  getAssetTimeline,
} = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All asset routes require authentication
router.use(protect);

// ── Read operations — any authenticated user ──
router.get('/', getAssets);
router.get('/:id', getAsset);
router.get('/:id/timeline', getAssetTimeline);

// ── Write operations — Admin & Asset Manager ──
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  createAsset
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  updateAsset
);

router.put(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  changeAssetStatus
);

module.exports = router;
