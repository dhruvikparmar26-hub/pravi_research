const mongoose = require('mongoose');

// ──────────────────────────────────────────────
// Pravi — Assignment Model
// Tracks custody of a physical asset — who holds
// it, when it was handed over, and when it was
// returned. Preserves full assignment history
// instead of overwriting a single field on Asset.
// ──────────────────────────────────────────────

const assignmentSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned-to user is required'],
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned-by user is required'],
    },

    department: {
      type: String,
      trim: true,
      default: '',
    },

    purpose: {
      type: String,
      trim: true,
      default: '',
    },

    startDate: {
      type: Date,
      required: [true, 'Assignment start date is required'],
      default: Date.now,
    },

    endDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },

    returnNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────
assignmentSchema.index({ asset: 1, status: 1 });
assignmentSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
