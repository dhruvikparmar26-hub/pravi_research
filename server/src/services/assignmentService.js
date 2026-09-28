const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');
const { logEvent } = require('./eventService');
const { EVENT_TYPES, ASSET_STATUS } = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Assignment Service
// Business logic for assigning/unassigning
// physical custody of an asset to a user or team.
// ──────────────────────────────────────────────

/**
 * Assign an asset to a user.
 * - Asset must be in a state that allows assignment (IN_STOCK, IN_USE, ASSIGNED).
 * - Any existing active assignment on this asset is completed first.
 */
const assignAsset = async ({ assetId, assignedTo, department, purpose, userId }) => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  // Only allow assignment from certain statuses
  const assignableStatuses = [
    ASSET_STATUS.IN_STOCK,
    ASSET_STATUS.ASSIGNED,
    ASSET_STATUS.IN_USE,
  ];
  if (!assignableStatuses.includes(asset.status)) {
    const error = new Error(
      `Cannot assign asset in '${asset.status}' status. Asset must be IN_STOCK, ASSIGNED, or IN_USE.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Complete any existing active assignment on this asset
  await Assignment.updateMany(
    { asset: assetId, status: 'ACTIVE' },
    {
      status: 'COMPLETED',
      endDate: new Date(),
      returnNotes: 'Auto-completed due to reassignment',
    }
  );

  // Create the new assignment record
  const assignment = await Assignment.create({
    asset: assetId,
    assignedTo,
    assignedBy: userId,
    department: department || asset.department,
    purpose: purpose || '',
    startDate: new Date(),
  });

  // Update asset's current custodian and status
  asset.currentCustodian = assignedTo;
  asset.status = ASSET_STATUS.ASSIGNED;
  await asset.save();

  // Log the event
  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.ASSIGNED,
    title: 'Asset custody assigned',
    description: purpose || 'Asset assigned to new custodian',
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      assignmentId: assignment._id,
      assignedTo,
      department: assignment.department,
    },
  });

  return assignment;
};

/**
 * Unassign (return) an asset — completes the active assignment.
 */
const unassignAsset = async ({ assetId, returnNotes, userId }) => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  // Find the active assignment
  const activeAssignment = await Assignment.findOne({
    asset: assetId,
    status: 'ACTIVE',
  });

  if (!activeAssignment) {
    const error = new Error('No active assignment found for this asset');
    error.statusCode = 400;
    throw error;
  }

  // Complete the assignment
  activeAssignment.status = 'COMPLETED';
  activeAssignment.endDate = new Date();
  activeAssignment.returnNotes = returnNotes || '';
  await activeAssignment.save();

  // Clear custodian and set asset back to IN_USE
  asset.currentCustodian = null;
  asset.status = ASSET_STATUS.IN_USE;
  await asset.save();

  // Log the event
  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.UNASSIGNED,
    title: 'Asset custody returned',
    description: returnNotes || 'Asset unassigned from custodian',
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      assignmentId: activeAssignment._id,
      previousCustodian: activeAssignment.assignedTo,
    },
  });

  return activeAssignment;
};

/**
 * Get assignment history for an asset.
 */
const getAssetAssignments = async (assetId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [assignments, total] = await Promise.all([
    Assignment.find({ asset: assetId })
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Assignment.countDocuments({ asset: assetId }),
  ]);

  return {
    assignments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

module.exports = {
  assignAsset,
  unassignAsset,
  getAssetAssignments,
};
