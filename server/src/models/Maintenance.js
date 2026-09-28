const mongoose = require('mongoose');
const {
  MAINTENANCE_TYPE_LIST,
  MAINTENANCE_PRIORITY_LIST,
  MAINTENANCE_PRIORITY,
  MAINTENANCE_STATUS_LIST,
  MAINTENANCE_STATUS,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Maintenance Model
// Tracks maintenance tickets for physical assets:
// scheduled servicing, breakdown repairs,
// inspections, and calibrations.
//
// Ticket lifecycle:
//   OPEN → ASSIGNED → IN_PROGRESS
//                        ↓
//                  WAITING_FOR_PARTS → IN_PROGRESS
//                        ↓
//                    RESOLVED → CLOSED
// ──────────────────────────────────────────────

const replacedPartSchema = new mongoose.Schema(
  {
    partName: {
      type: String,
      required: [true, 'Part name is required'],
      trim: true,
    },
    partNumber: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    totalCost: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

// Auto-calculate totalCost before save
replacedPartSchema.pre('validate', function () {
  this.totalCost = this.quantity * this.unitCost;
});

const maintenanceSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: [true, 'Ticket number is required'],
      index: true,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
      index: true,
    },

    // ── Ticket Classification ─────────────────
    type: {
      type: String,
      required: [true, 'Maintenance type is required'],
      enum: {
        values: MAINTENANCE_TYPE_LIST,
        message: '{VALUE} is not a valid maintenance type',
      },
    },

    priority: {
      type: String,
      enum: {
        values: MAINTENANCE_PRIORITY_LIST,
        message: '{VALUE} is not a valid priority',
      },
      default: MAINTENANCE_PRIORITY.MEDIUM,
    },

    status: {
      type: String,
      enum: {
        values: MAINTENANCE_STATUS_LIST,
        message: '{VALUE} is not a valid maintenance status',
      },
      default: MAINTENANCE_STATUS.OPEN,
    },

    // ── Issue Description ─────────────────────
    issueTitle: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
      maxlength: [200, 'Issue title cannot exceed 200 characters'],
    },

    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },

    // ── People ────────────────────────────────
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },

    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Work Details ──────────────────────────
    diagnosis: {
      type: String,
      trim: true,
      default: '',
    },

    actionTaken: {
      type: String,
      trim: true,
      default: '',
    },

    replacedParts: [replacedPartSchema],

    // ── Meter / Usage Reading ─────────────────
    // e.g., generator running hours, vehicle odometer
    meterReadingAtService: {
      type: Number,
      default: null,
    },

    meterUnit: {
      type: String,
      trim: true,
      default: '', // "hours", "km", "cycles"
    },

    // ── Costs ─────────────────────────────────
    laborCost: {
      type: Number,
      default: 0,
      min: [0, 'Labor cost cannot be negative'],
    },

    partsCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Timeline ──────────────────────────────
    assignedAt: { type: Date, default: null },
    workStartedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    // ── Resolution ────────────────────────────
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },

    closingRemarks: {
      type: String,
      trim: true,
      default: '',
    },

    // ── Activity Log / Comments ───────────────
    // Real communication thread between employee, technician, manager
    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        authorRole: { type: String, required: true },
        message: { type: String, required: true, trim: true },
        type: {
          type: String,
          enum: ['COMMENT', 'STATUS_CHANGE', 'ASSIGNMENT', 'PARTS_UPDATE', 'RESOLUTION'],
          default: 'COMMENT',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────
maintenanceSchema.index({ status: 1, priority: 1 });
maintenanceSchema.index({ assignedTechnician: 1, status: 1 });
maintenanceSchema.index({ asset: 1, createdAt: -1 });

// ── Pre-save: recalculate costs ─────────────
maintenanceSchema.pre('save', function () {
  this.partsCost = this.replacedParts.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  this.totalCost = this.laborCost + this.partsCost;
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
