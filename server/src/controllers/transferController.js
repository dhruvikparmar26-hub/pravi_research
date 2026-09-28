const transferService = require('../services/transferService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// GET /api/transfers
// List transfers with optional filters.
// Query: status, assetId, page, limit
// ──────────────────────────────────────────────
const getTransfers = async (req, res, next) => {
  try {
    const result = await transferService.getTransfers(req.query);
    return sendSuccess(res, 200, 'Transfers retrieved', result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/transfers/:id
// Get full details of a single transfer.
// ──────────────────────────────────────────────
const getTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.getTransferById(req.params.id);
    return sendSuccess(res, 200, 'Transfer retrieved', { transfer });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/transfers
// Request a new inter-facility transfer.
// Body: { assetId, toLocationId, gatePassType?,
//         reason?, expectedDeliveryDate? }
// ──────────────────────────────────────────────
const requestTransfer = async (req, res, next) => {
  try {
    const assetId = req.body.assetId || req.body.asset;
    const toLocationId = req.body.toLocationId || req.body.toLocation;
    const reason = req.body.reason || req.body.purpose || 'Inter-site infrastructure deployment';

    if (!assetId || !toLocationId) {
      return sendError(res, 400, 'assetId and toLocationId are required');
    }

    const payload = {
      ...req.body,
      assetId,
      toLocationId,
      reason,
    };

    const transfer = await transferService.requestTransfer(payload, req.user._id);
    return sendSuccess(res, 201, `Transfer ${transfer.transferNumber} requested`, { transfer });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transfers/:id/approve
// Approve a pending transfer request.
// ──────────────────────────────────────────────
const approveTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.approveTransfer(req.params.id, req.user._id);
    return sendSuccess(res, 200, `Transfer ${transfer.transferNumber} approved`, { transfer });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transfers/:id/reject
// Reject a pending transfer request.
// Body: { rejectionReason? }
// ──────────────────────────────────────────────
const rejectTransfer = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const transfer = await transferService.rejectTransfer(
      req.params.id,
      rejectionReason,
      req.user._id
    );
    return sendSuccess(res, 200, `Transfer ${transfer.transferNumber} rejected`, { transfer });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transfers/:id/dispatch
// Dispatch the asset with logistics/gate pass info.
// Body: { carrierName?, vehicleNumber?, driverName?,
//         driverContact?, remarks? }
// ──────────────────────────────────────────────
const dispatchTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.dispatchTransfer(
      req.params.id,
      req.body,
      req.user._id
    );
    return sendSuccess(res, 200, `Transfer ${transfer.transferNumber} dispatched`, { transfer });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transfers/:id/receive
// Destination site confirms physical delivery.
// Body: { remarks? }
// ──────────────────────────────────────────────
const receiveTransfer = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const transfer = await transferService.receiveTransfer(
      req.params.id,
      remarks,
      req.user._id
    );
    return sendSuccess(res, 200, `Transfer ${transfer.transferNumber} delivered`, { transfer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransfers,
  getTransfer,
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
};
