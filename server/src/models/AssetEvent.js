const mongoose = require('mongoose');
const { EVENT_TYPE_LIST } = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Asset Event Model
// Immutable, append-only chronological timeline
// of everything that happens to an asset.
//
// This is NOT the same as the audit log.
// Asset Events answer: "What happened to THIS asset?"
// Audit Logs answer:   "Who did what in the system?"
// ──────────────────────────────────────────────

const assetEventSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
      index: true,
    },

    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: EVENT_TYPE_LIST,
        message: '{VALUE} is not a valid event type',
      },
    },

    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed-by user reference is required'],
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },

    // Snapshot of before/after values for traceability
    // e.g. { before: { status: "IN_USE" }, after: { status: "UNDER_MAINTENANCE" } }
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // createdAt serves as the event timestamp
  }
);

// ── Indexes ─────────────────────────────────
assetEventSchema.index({ asset: 1, createdAt: -1 }); // Timeline queries
assetEventSchema.index({ eventType: 1 });

module.exports = mongoose.model('AssetEvent', assetEventSchema);
