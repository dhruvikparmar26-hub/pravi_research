const Transfer = require('../models/Transfer');
const Asset = require('../models/Asset');
const Location = require('../models/Location');
const { logEvent } = require('./eventService');
const {
  EVENT_TYPES,
  ASSET_STATUS,
  TRANSFER_STATUS,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Transfer Service
// Business logic for the inter-facility asset
// transfer workflow:
//
//   REQUEST → APPROVE → DISPATCH → DELIVER
//               ↓
//            REJECT
// ──────────────────────────────────────────────

/**
 * Generate a unique transfer number: TR-YYYY-XXXX
 */
const generateTransferNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Transfer.countDocuments({
    transferNumber: { $regex: `^TR-${year}-` },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `TR-${year}-${seq}`;
};

// ──────────────────────────────────────────────
// Step 1: REQUEST a transfer
// ──────────────────────────────────────────────
const requestTransfer = async (data, userId) => {
  const { assetId, toLocationId, gatePassType, reason, expectedDeliveryDate } = data;

  // Validate asset
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  // Asset must be IN_USE to be transferred
  if (asset.status !== ASSET_STATUS.IN_USE) {
    const error = new Error(
      `Asset must be IN_USE to request a transfer. Current status: ${asset.status}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate destination location
  const toLocation = await Location.findById(toLocationId);
  if (!toLocation) {
    const error = new Error('Destination location not found');
    error.statusCode = 404;
    throw error;
  }

  // Cannot transfer to the same location
  if (asset.currentLocation.toString() === toLocationId) {
    const error = new Error('Source and destination locations cannot be the same');
    error.statusCode = 400;
    throw error;
  }

  const transferNumber = await generateTransferNumber();

  const transfer = await Transfer.create({
    transferNumber,
    asset: assetId,
    fromLocation: asset.currentLocation,
    toLocation: toLocationId,
    gatePassType: gatePassType || 'NON_RETURNABLE',
    reason: reason || '',
    expectedDeliveryDate: expectedDeliveryDate || null,
    requestedBy: userId,
    status: TRANSFER_STATUS.REQUESTED,
  });

  // Log asset event
  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.TRANSFER_REQUESTED,
    title: `Transfer requested: ${transferNumber}`,
    description: `Transfer to ${toLocation.siteName} — ${toLocation.building}`,
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      transferId: transfer._id,
      transferNumber,
      from: asset.currentLocation,
      to: toLocationId,
    },
  });

  return transfer;
};

// ──────────────────────────────────────────────
// Step 2a: APPROVE a transfer
// ──────────────────────────────────────────────
const approveTransfer = async (transferId, userId) => {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const error = new Error('Transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
    const error = new Error(
      `Cannot approve a transfer in '${transfer.status}' status. Must be REQUESTED.`
    );
    error.statusCode = 400;
    throw error;
  }

  transfer.status = TRANSFER_STATUS.APPROVED;
  transfer.approvedBy = userId;
  transfer.approvedAt = new Date();
  await transfer.save();

  return transfer;
};

// ──────────────────────────────────────────────
// Step 2b: REJECT a transfer
// ──────────────────────────────────────────────
const rejectTransfer = async (transferId, rejectionReason, userId) => {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const error = new Error('Transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== TRANSFER_STATUS.REQUESTED) {
    const error = new Error(
      `Cannot reject a transfer in '${transfer.status}' status. Must be REQUESTED.`
    );
    error.statusCode = 400;
    throw error;
  }

  transfer.status = TRANSFER_STATUS.REJECTED;
  transfer.approvedBy = userId;
  transfer.approvedAt = new Date();
  transfer.rejectionReason = rejectionReason || '';
  await transfer.save();

  return transfer;
};

// ──────────────────────────────────────────────
// Step 3: DISPATCH the asset (Gate Pass activated)
// Carrier, vehicle number, and driver info added.
// Asset transitions to IN_TRANSIT.
// ──────────────────────────────────────────────
const dispatchTransfer = async (transferId, logisticsData, userId) => {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const error = new Error('Transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status === TRANSFER_STATUS.REQUESTED) {
    transfer.approvedBy = userId;
    transfer.approvedAt = new Date();
  } else if (transfer.status !== TRANSFER_STATUS.APPROVED) {
    const error = new Error(
      `Cannot dispatch a transfer in '${transfer.status}' status. Must be APPROVED.`
    );
    error.statusCode = 400;
    throw error;
  }

  const {
    carrierName,
    vehicleNumber,
    driverName,
    driverContact,
    remarks,
  } = logisticsData;

  // Update transfer with logistics info
  transfer.status = TRANSFER_STATUS.DISPATCHED;
  transfer.carrierName = carrierName || '';
  transfer.vehicleNumber = vehicleNumber || '';
  transfer.driverName = driverName || '';
  transfer.driverContact = driverContact || '';
  transfer.remarks = remarks || '';
  transfer.dispatchedAt = new Date();
  await transfer.save();

  // Transition asset to IN_TRANSIT
  if (transfer.asset) {
    const asset = await Asset.findById(transfer.asset);
    if (asset) {
      asset.status = ASSET_STATUS.IN_TRANSIT;
      await asset.save();

      // Log event
      await logEvent({
        assetId: asset._id,
        eventType: EVENT_TYPES.TRANSFER_DISPATCHED,
        title: `Asset dispatched — ${transfer.transferNumber}`,
        description: `Via ${carrierName || 'N/A'}, Vehicle: ${vehicleNumber || 'N/A'}`,
        performedBy: userId,
        locationId: transfer.fromLocation,
        metadata: {
          transferId: transfer._id,
          carrierName,
          vehicleNumber,
          driverName,
        },
      });
    }
  }

  return transfer;
};

// ──────────────────────────────────────────────
// Step 4: RECEIVE / DELIVER at destination
// Receiving site custodian confirms physical
// delivery. Asset location is updated.
// ──────────────────────────────────────────────
const receiveTransfer = async (transferId, remarks, userId) => {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) {
    const error = new Error('Transfer not found');
    error.statusCode = 404;
    throw error;
  }

  if (transfer.status !== TRANSFER_STATUS.DISPATCHED) {
    const error = new Error(
      `Cannot receive a transfer in '${transfer.status}' status. Must be DISPATCHED.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Complete the transfer
  transfer.status = TRANSFER_STATUS.DELIVERED;
  transfer.receivedBy = userId;
  transfer.deliveredAt = new Date();
  if (remarks) transfer.remarks = remarks;
  await transfer.save();

  // Update asset — new location, back to IN_USE
  if (transfer.asset) {
    const asset = await Asset.findById(transfer.asset);
    if (asset) {
      const oldLocationId = asset.currentLocation;
      asset.currentLocation = transfer.toLocation;
      asset.status = ASSET_STATUS.IN_USE;
      await asset.save();

      // Update location asset counters
      if (oldLocationId) {
        await Location.findByIdAndUpdate(oldLocationId, { $inc: { assetCount: -1 } });
      }
      if (transfer.toLocation) {
        await Location.findByIdAndUpdate(transfer.toLocation, { $inc: { assetCount: 1 } });
      }

      // Log event
      await logEvent({
        assetId: asset._id,
        eventType: EVENT_TYPES.TRANSFER_DELIVERED,
        title: `Asset received at destination — ${transfer.transferNumber}`,
        description: `Verified by receiving custodian`,
        performedBy: userId,
        locationId: transfer.toLocation,
        metadata: {
          transferId: transfer._id,
          fromLocation: oldLocationId,
          toLocation: transfer.toLocation,
        },
      });
    }
  }

  return transfer;
};

// ──────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────

const getTransfers = async (query) => {
  const { status, assetId, page = 1, limit = 20 } = query;

  const filter = {};
  if (status) filter.status = status;
  if (assetId) filter.asset = assetId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [transfers, total] = await Promise.all([
    Transfer.find(filter)
      .populate('asset', 'assetTag name category')
      .populate('fromLocation', 'siteName building roomOrBay')
      .populate('toLocation', 'siteName building roomOrBay')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('receivedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Transfer.countDocuments(filter),
  ]);

  return {
    transfers,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

const getTransferById = async (transferId) => {
  const transfer = await Transfer.findById(transferId)
    .populate('asset', 'assetTag name category status physicalCondition')
    .populate('fromLocation')
    .populate('toLocation')
    .populate('requestedBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('receivedBy', 'name email role');

  if (!transfer) {
    const error = new Error('Transfer not found');
    error.statusCode = 404;
    throw error;
  }

  return transfer;
};

module.exports = {
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  dispatchTransfer,
  receiveTransfer,
  getTransfers,
  getTransferById,
};
