const assignmentService = require('../services/assignmentService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// POST /api/assignments
// Assign custody of an asset to a user.
// Body: { assetId, assignedTo, department?, purpose? }
// ──────────────────────────────────────────────
const assignAsset = async (req, res, next) => {
  try {
    const { assetId, assignedTo, department, purpose } = req.body;

    if (!assetId || !assignedTo) {
      return sendError(res, 400, 'assetId and assignedTo are required');
    }

    const assignment = await assignmentService.assignAsset({
      assetId,
      assignedTo,
      department,
      purpose,
      userId: req.user._id,
    });

    return sendSuccess(res, 201, 'Asset assigned successfully', { assignment });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/assignments/:assetId/unassign
// Return an asset — completes the active assignment.
// Body: { returnNotes? }
// ──────────────────────────────────────────────
const unassignAsset = async (req, res, next) => {
  try {
    const { returnNotes } = req.body;

    const assignment = await assignmentService.unassignAsset({
      assetId: req.params.assetId,
      returnNotes,
      userId: req.user._id,
    });

    return sendSuccess(res, 200, 'Asset custody returned', { assignment });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/assignments/:assetId
// Get assignment history for a specific asset.
// ──────────────────────────────────────────────
const getAssetAssignments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await assignmentService.getAssetAssignments(
      req.params.assetId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    return sendSuccess(res, 200, 'Assignment history retrieved', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  assignAsset,
  unassignAsset,
  getAssetAssignments,
};
