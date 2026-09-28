const AssetEvent = require('../models/AssetEvent');

// ──────────────────────────────────────────────
// Pravi — Event Service
// Creates immutable asset timeline entries.
// Called by other services/controllers whenever
// something important happens to an asset.
// ──────────────────────────────────────────────

/**
 * Log an event to the asset's timeline.
 *
 * @param {Object} params
 * @param {string} params.assetId      - Asset ObjectId
 * @param {string} params.eventType    - One of EVENT_TYPES from constants
 * @param {string} params.title        - Short human-readable title
 * @param {string} [params.description]- Optional longer description
 * @param {string} params.performedBy  - User ObjectId who performed the action
 * @param {string} [params.locationId] - Optional location ObjectId
 * @param {Object} [params.metadata]   - Optional before/after snapshot
 * @returns {Promise<Object>} Created event document
 */
const logEvent = async ({
  assetId,
  eventType,
  title,
  description = '',
  performedBy,
  locationId = null,
  metadata = {},
}) => {
  const event = await AssetEvent.create({
    asset: assetId,
    eventType,
    title,
    description,
    performedBy,
    location: locationId,
    metadata,
  });

  return event;
};

/**
 * Get the full timeline of events for an asset.
 *
 * @param {string} assetId  - Asset ObjectId
 * @param {number} [limit]  - Max events to return (default: 50)
 * @returns {Promise<Array>} Events sorted newest-first
 */
const getAssetTimeline = async (assetId, limit = 50) => {
  const events = await AssetEvent.find({ asset: assetId })
    .populate('performedBy', 'name email role')
    .populate('location', 'siteName building roomOrBay')
    .sort({ createdAt: -1 })
    .limit(limit);

  return events;
};

module.exports = {
  logEvent,
  getAssetTimeline,
};
