const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const { logEvent } = require('./eventService');
const {
  EVENT_TYPES,
  ASSET_STATUS,
  MAINTENANCE_STATUS,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Maintenance Service
// Business logic for the maintenance ticket
// lifecycle:
//
//   OPEN → ASSIGNED → IN_PROGRESS
//                        ↕
//                  WAITING_FOR_PARTS
//                        ↓
//                    RESOLVED → CLOSED
// ──────────────────────────────────────────────

/**
 * Generate a unique ticket number: MNT-YYYY-XXXX
 */
const generateTicketNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Maintenance.countDocuments({
    ticketNumber: { $regex: `^MNT-${year}-` },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `MNT-${year}-${seq}`;
};

// ──────────────────────────────────────────────
// Create a maintenance ticket
// Transitions asset to UNDER_MAINTENANCE
// ──────────────────────────────────────────────
const createTicket = async (data, userId) => {
  const { assetId, type, priority, issueTitle, issueDescription } = data;

  // Validate asset
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  // Asset must be IN_USE or ASSIGNED to open a maintenance ticket
  const allowed = [ASSET_STATUS.IN_USE, ASSET_STATUS.ASSIGNED];
  if (!allowed.includes(asset.status)) {
    const error = new Error(
      `Cannot open maintenance on asset in '${asset.status}' status. Must be IN_USE or ASSIGNED.`
    );
    error.statusCode = 400;
    throw error;
  }

  const ticketNumber = await generateTicketNumber();

  const ticket = await Maintenance.create({
    ticketNumber,
    asset: assetId,
    type,
    priority: priority || 'MEDIUM',
    issueTitle,
    issueDescription,
    reportedBy: userId,
    status: MAINTENANCE_STATUS.OPEN,
  });

  // Transition asset to UNDER_MAINTENANCE
  asset.status = ASSET_STATUS.UNDER_MAINTENANCE;
  await asset.save();

  // Log event
  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.MAINTENANCE_OPENED,
    title: `Maintenance ticket opened: ${ticketNumber}`,
    description: issueTitle,
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      ticketId: ticket._id,
      ticketNumber,
      type,
      priority: ticket.priority,
    },
  });

  return ticket;
};

// ──────────────────────────────────────────────
// Assign a technician to a ticket
// ──────────────────────────────────────────────
const assignTechnician = async (ticketId, technicianId, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status !== MAINTENANCE_STATUS.OPEN) {
    const error = new Error(
      `Cannot assign technician — ticket is in '${ticket.status}' status. Must be OPEN.`
    );
    error.statusCode = 400;
    throw error;
  }

  ticket.assignedTechnician = technicianId;
  ticket.status = MAINTENANCE_STATUS.ASSIGNED;
  ticket.assignedAt = new Date();
  await ticket.save();

  return ticket;
};

// ──────────────────────────────────────────────
// Start work on a ticket
// ──────────────────────────────────────────────
const startWork = async (ticketId, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  const allowed = [
    MAINTENANCE_STATUS.OPEN,
    MAINTENANCE_STATUS.ASSIGNED,
    MAINTENANCE_STATUS.WAITING_FOR_PARTS,
  ];
  if (!allowed.includes(ticket.status)) {
    const error = new Error(
      `Cannot start work — ticket is in '${ticket.status}' status. Must be OPEN, ASSIGNED, or WAITING_FOR_PARTS.`
    );
    error.statusCode = 400;
    throw error;
  }

  // If not assigned yet, auto-assign the technician who starts the work
  if (!ticket.assignedTechnician) {
    ticket.assignedTechnician = userId;
    ticket.assignedAt = new Date();
  }

  ticket.status = MAINTENANCE_STATUS.IN_PROGRESS;
  if (!ticket.workStartedAt) {
    ticket.workStartedAt = new Date();
  }
  await ticket.save();

  // Ensure asset status is marked UNDER_MAINTENANCE
  if (ticket.asset) {
    const asset = await Asset.findById(ticket.asset);
    if (asset && asset.status !== ASSET_STATUS.UNDER_MAINTENANCE) {
      asset.status = ASSET_STATUS.UNDER_MAINTENANCE;
      await asset.save();
    }
  }

  return ticket;
};

// ──────────────────────────────────────────────
// Mark ticket as waiting for parts
// ──────────────────────────────────────────────
const waitForParts = async (ticketId, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status !== MAINTENANCE_STATUS.IN_PROGRESS) {
    const error = new Error(
      `Cannot set waiting — ticket is in '${ticket.status}' status. Must be IN_PROGRESS.`
    );
    error.statusCode = 400;
    throw error;
  }

  ticket.status = MAINTENANCE_STATUS.WAITING_FOR_PARTS;
  await ticket.save();

  return ticket;
};

// ──────────────────────────────────────────────
// Update work log — diagnosis, action taken,
// replaced parts, meter reading, labor cost
// ──────────────────────────────────────────────
const updateWorkLog = async (ticketId, workData, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  const workableStatuses = [
    MAINTENANCE_STATUS.ASSIGNED,
    MAINTENANCE_STATUS.IN_PROGRESS,
    MAINTENANCE_STATUS.WAITING_FOR_PARTS,
  ];
  if (!workableStatuses.includes(ticket.status)) {
    const error = new Error(
      `Cannot update work log — ticket is in '${ticket.status}' status.`
    );
    error.statusCode = 400;
    throw error;
  }

  const {
    diagnosis,
    actionTaken,
    replacedParts,
    meterReadingAtService,
    meterUnit,
    laborCost,
  } = workData;

  if (diagnosis !== undefined) ticket.diagnosis = diagnosis;
  if (actionTaken !== undefined) ticket.actionTaken = actionTaken;
  if (meterReadingAtService !== undefined) ticket.meterReadingAtService = meterReadingAtService;
  if (meterUnit !== undefined) ticket.meterUnit = meterUnit;
  if (laborCost !== undefined) ticket.laborCost = laborCost;

  // Replaced parts — append new entries or replace entire array
  if (replacedParts && Array.isArray(replacedParts)) {
    ticket.replacedParts = replacedParts;
  }

  // pre-save hook recalculates partsCost and totalCost
  await ticket.save();

  return ticket;
};

// ──────────────────────────────────────────────
// Resolve a ticket — work is done
// ──────────────────────────────────────────────
const resolveTicket = async (ticketId, resolutionNotes, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  const allowed = [MAINTENANCE_STATUS.IN_PROGRESS, MAINTENANCE_STATUS.WAITING_FOR_PARTS];
  if (!allowed.includes(ticket.status)) {
    const error = new Error(
      `Cannot resolve — ticket is in '${ticket.status}' status. Must be IN_PROGRESS or WAITING_FOR_PARTS.`
    );
    error.statusCode = 400;
    throw error;
  }

  ticket.status = MAINTENANCE_STATUS.RESOLVED;
  ticket.resolutionNotes = resolutionNotes || '';
  ticket.resolvedAt = new Date();
  await ticket.save();

  return ticket;
};

// ──────────────────────────────────────────────
// Close a ticket — manager sign-off
// Transitions asset back to IN_USE and updates
// inspection & next maintenance dates.
// ──────────────────────────────────────────────
const closeTicket = async (ticketId, closingData, userId) => {
  const ticket = await Maintenance.findById(ticketId);
  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  if (ticket.status !== MAINTENANCE_STATUS.RESOLVED) {
    const error = new Error(
      `Cannot close — ticket is in '${ticket.status}' status. Must be RESOLVED first.`
    );
    error.statusCode = 400;
    throw error;
  }

  ticket.status = MAINTENANCE_STATUS.CLOSED;
  ticket.closingRemarks = (closingData && closingData.closingRemarks) || '';
  ticket.closedAt = new Date();
  await ticket.save();

  // Transition asset back to IN_USE
  const asset = await Asset.findById(ticket.asset);
  if (asset && asset.status === ASSET_STATUS.UNDER_MAINTENANCE) {
    asset.status = ASSET_STATUS.IN_USE;
    asset.lastInspectionDate = new Date();

    // If a next maintenance date is provided, set it
    if (closingData && closingData.nextMaintenanceDueDate) {
      asset.nextMaintenanceDueDate = new Date(closingData.nextMaintenanceDueDate);
    }

    await asset.save();
  }

  // Log event
  await logEvent({
    assetId: ticket.asset,
    eventType: EVENT_TYPES.MAINTENANCE_COMPLETED,
    title: `Maintenance completed: ${ticket.ticketNumber}`,
    description: ticket.resolutionNotes || 'Maintenance work completed and verified',
    performedBy: userId,
    locationId: asset ? asset.currentLocation : null,
    metadata: {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      totalCost: ticket.totalCost,
      partsReplaced: ticket.replacedParts.length,
    },
  });

  return ticket;
};

// ──────────────────────────────────────────────
// Query helpers
// ──────────────────────────────────────────────

const getTickets = async (query) => {
  const {
    status,
    priority,
    type,
    assetId,
    technicianId,
    page = 1,
    limit = 20,
  } = query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (type) filter.type = type;
  if (assetId) filter.asset = assetId;
  if (technicianId) filter.assignedTechnician = technicianId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [tickets, total] = await Promise.all([
    Maintenance.find(filter)
      .populate('asset', 'assetTag name category status currentLocation')
      .populate('reportedBy', 'name email')
      .populate('assignedTechnician', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Maintenance.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

const getTicketById = async (ticketId) => {
  const ticket = await Maintenance.findById(ticketId)
    .populate('asset', 'assetTag name category status physicalCondition currentLocation make model')
    .populate('reportedBy', 'name email role')
    .populate('assignedTechnician', 'name email phone role');

  if (!ticket) {
    const error = new Error('Maintenance ticket not found');
    error.statusCode = 404;
    throw error;
  }

  return ticket;
};

const getAssetMaintenanceHistory = async (assetId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    Maintenance.find({ asset: assetId })
      .populate('assignedTechnician', 'name email')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Maintenance.countDocuments({ asset: assetId }),
  ]);

  return {
    tickets,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

module.exports = {
  createTicket,
  assignTechnician,
  startWork,
  waitForParts,
  updateWorkLog,
  resolveTicket,
  closeTicket,
  getTickets,
  getTicketById,
  getAssetMaintenanceHistory,
};
