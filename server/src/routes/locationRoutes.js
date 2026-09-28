const express = require('express');
const router = express.Router();
const {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deactivateLocation,
} = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { ROLES } = require('../config/constants');

// All location routes require authentication
router.use(protect);

// Any authenticated user can view locations
router.get('/', getLocations);
router.get('/:id', getLocation);

// Only Admin and Asset Manager can manage locations
router.post('/', authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER), createLocation);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER), updateLocation);
router.delete('/:id', authorize(ROLES.ADMIN), deactivateLocation);

module.exports = router;
