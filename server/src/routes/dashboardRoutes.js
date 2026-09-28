const express = require('express');
const router = express.Router();
const {
  getOverview,
  getAssetAnalytics,
  getMaintenanceAnalytics,
  getExpirations,
  getActivityFeed,
  getFinancials,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All dashboard endpoints require authentication
router.use(protect);

// Dashboard routes are accessible to all authenticated personnel
router.use(authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.TECHNICIAN, ROLES.EMPLOYEE));

router.get('/overview', getOverview);
router.get('/assets', getAssetAnalytics);
router.get('/maintenance', getMaintenanceAnalytics);
router.get('/expirations', getExpirations);
router.get('/activity', getActivityFeed);
router.get('/financial', getFinancials);

module.exports = router;
