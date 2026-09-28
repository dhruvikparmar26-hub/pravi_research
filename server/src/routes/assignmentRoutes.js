const express = require('express');
const router = express.Router();
const {
  assignAsset,
  unassignAsset,
  getAssetAssignments,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All assignment routes require authentication
router.use(protect);

// View assignment history — any authenticated user
router.get('/:assetId', getAssetAssignments);

// Assign / Unassign — Admin & Asset Manager only
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  assignAsset
);

router.put(
  '/:assetId/unassign',
  authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
  unassignAsset
);

module.exports = router;
