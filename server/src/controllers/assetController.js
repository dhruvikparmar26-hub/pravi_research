const assetService = require('../services/assetService');
const eventService = require('../services/eventService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// POST /api/assets
// Register a new physical asset.
// ──────────────────────────────────────────────
const createAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user._id);

    return sendSuccess(res, 201, 'Asset registered successfully', { asset });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/assets
// List assets with search, filter, and pagination.
//
// Query params:
//   search, category, status, physicalCondition,
//   location, department, page, limit,
//   sortBy, sortOrder
// ──────────────────────────────────────────────
const getAssets = async (req, res, next) => {
  try {
    const result = await assetService.getAssets(req.query);

    return sendSuccess(res, 200, 'Assets retrieved', result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/assets/:id
// Get full details of a single asset.
// ──────────────────────────────────────────────
const getAsset = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);

    return sendSuccess(res, 200, 'Asset retrieved', { asset });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/assets/:id
// Update asset details (not status or location).
// ──────────────────────────────────────────────
const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(
      req.params.id,
      req.body,
      req.user._id
    );

    return sendSuccess(res, 200, 'Asset updated', { asset });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/assets/:id/status
// Transition asset lifecycle status.
// Body: { status: "RECEIVED", reason: "Goods verified at dock" }
// ──────────────────────────────────────────────
const changeAssetStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    if (!status) {
      return sendError(res, 400, 'New status is required');
    }

    const asset = await assetService.changeStatus(
      req.params.id,
      status,
      req.user._id,
      reason
    );

    return sendSuccess(res, 200, `Asset status changed to ${status}`, { asset });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/assets/:id/timeline
// Get the event timeline of an asset.
// ──────────────────────────────────────────────
const getAssetTimeline = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const events = await eventService.getAssetTimeline(
      req.params.id,
      parseInt(limit, 10)
    );

    return sendSuccess(res, 200, 'Asset timeline retrieved', { events });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  changeAssetStatus,
  getAssetTimeline,
};
