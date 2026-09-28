const maintenanceService = require('../services/maintenanceService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// GET /api/maintenance
// List tickets with optional filters.
// Query: status, priority, type, assetId,
//        technicianId, page, limit
// ──────────────────────────────────────────────
const getTickets = async (req, res, next) => {
  try {
    const result = await maintenanceService.getTickets(req.query);
    return sendSuccess(res, 200, 'Maintenance tickets retrieved', result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/maintenance/:id
// Get full ticket details.
// ──────────────────────────────────────────────
const getTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.getTicketById(req.params.id);
    return sendSuccess(res, 200, 'Ticket retrieved', { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/maintenance/asset/:assetId
// Get maintenance history for a specific asset.
// ──────────────────────────────────────────────
const getAssetMaintenanceHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await maintenanceService.getAssetMaintenanceHistory(
      req.params.assetId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    return sendSuccess(res, 200, 'Asset maintenance history retrieved', result);
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/maintenance
// Create a new maintenance ticket.
// Body: { assetId, type, priority?, issueTitle,
//         issueDescription }
// ──────────────────────────────────────────────
const createTicket = async (req, res, next) => {
  try {
    const assetId = req.body.assetId || req.body.asset;
    let type = req.body.type || req.body.maintenanceType;
    if (type === 'PREVENTIVE') type = 'PREVENTIVE_SCHEDULED';
    if (type === 'BREAKDOWN') type = 'BREAKDOWN_REPAIR';
    const priority = req.body.priority || 'MEDIUM';
    const issueDescription = req.body.issueDescription || req.body.description;
    const issueTitle = req.body.issueTitle || req.body.title || (issueDescription ? issueDescription.slice(0, 60) : 'Maintenance Ticket');

    if (!assetId || !type || !issueDescription) {
      return sendError(
        res,
        400,
        'assetId, type, and issueDescription are required'
      );
    }

    const ticket = await maintenanceService.createTicket(
      { assetId, type, priority, issueTitle, issueDescription },
      req.user._id
    );
    return sendSuccess(res, 201, `Ticket ${ticket.ticketNumber} created`, { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/assign
// Assign a technician to the ticket.
// Body: { technicianId }
// ──────────────────────────────────────────────
const assignTechnician = async (req, res, next) => {
  try {
    const { technicianId } = req.body;
    if (!technicianId) {
      return sendError(res, 400, 'technicianId is required');
    }

    const ticket = await maintenanceService.assignTechnician(
      req.params.id,
      technicianId,
      req.user._id
    );
    return sendSuccess(res, 200, 'Technician assigned', { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/start
// Start work on a ticket.
// ──────────────────────────────────────────────
const startWork = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.startWork(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Work started', { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/wait-for-parts
// Mark ticket as waiting for spare parts.
// ──────────────────────────────────────────────
const waitForParts = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.waitForParts(req.params.id, req.user._id);
    return sendSuccess(res, 200, 'Ticket set to waiting for parts', { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/work-log
// Update work details — diagnosis, parts, costs.
// Body: { diagnosis?, actionTaken?, replacedParts?,
//         meterReadingAtService?, meterUnit?,
//         laborCost? }
// ──────────────────────────────────────────────
const updateWorkLog = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.updateWorkLog(
      req.params.id,
      req.body,
      req.user._id
    );
    return sendSuccess(res, 200, 'Work log updated', { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/resolve
// Resolve a ticket — work is done.
// Body: { resolutionNotes? }
// ──────────────────────────────────────────────
const resolveTicket = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;
    const ticket = await maintenanceService.resolveTicket(
      req.params.id,
      resolutionNotes,
      req.user._id
    );
    return sendSuccess(res, 200, `Ticket ${ticket.ticketNumber} resolved`, { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/maintenance/:id/close
// Close a ticket — manager sign-off.
// Body: { closingRemarks?, nextMaintenanceDueDate? }
// ──────────────────────────────────────────────
const closeTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.closeTicket(
      req.params.id,
      req.body,
      req.user._id
    );
    return sendSuccess(res, 200, `Ticket ${ticket.ticketNumber} closed`, { ticket });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/maintenance/:id/comment
// Add a comment / activity log message to a ticket.
// Body: { message }
// ──────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return sendError(res, 400, 'Comment message is required');
    }

    const Maintenance = require('../models/Maintenance');
    const ticket = await Maintenance.findById(req.params.id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    ticket.comments.push({
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      message: message.trim(),
      type: 'COMMENT',
      createdAt: new Date(),
    });
    await ticket.save();

    const updated = await Maintenance.findById(req.params.id)
      .populate('asset', 'assetTag name category')
      .populate('reportedBy', 'name role')
      .populate('assignedTechnician', 'name role phone')
      .populate('comments.author', 'name role');

    return sendSuccess(res, 200, 'Comment added', { ticket: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTickets,
  getTicket,
  getAssetMaintenanceHistory,
  createTicket,
  assignTechnician,
  startWork,
  waitForParts,
  updateWorkLog,
  resolveTicket,
  closeTicket,
  addComment,
};
