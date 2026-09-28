const mongoose = require('mongoose');
const {
  TRANSFER_STATUS_LIST,
  TRANSFER_STATUS,
  GATE_PASS_TYPE_LIST,
  GATE_PASS_TYPES,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Transfer Model
// Tracks the physical movement of an asset
// between two facilities, including the Gate Pass
// logistics (carrier, vehicle, driver) and the
// multi-step approval workflow.
//
// Workflow:
//   REQUESTED → APPROVED → DISPATCHED → DELIVERED
//                  ↓
//              REJECTED
// ──────────────────────────────────────────────

const transferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      unique: true,
      required: [true, 'Transfer number is required'],
      index: true,
    },

    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },

    // ── Locations ─────────────────────────────
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Source location is required'],
    },

    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Destination location is required'],
    },

    // ── Gate Pass & Logistics ─────────────────
    gatePassType: {
      type: String,
      enum: {
        values: GATE_PASS_TYPE_LIST,
        message: '{VALUE} is not a valid gate pass type',
      },
      default: GATE_PASS_TYPES.NON_RETURNABLE,
    },

    carrierName: {
      type: String,
      trim: true,
      default: '',
    },

    vehicleNumber: {
      type: String,
      trim: true,
      default: '',
    },

    driverName: {
      type: String,
      trim: true,
      default: '',
    },

    driverContact: {
      type: String,
      trim: true,
      default: '',
    },

    expectedDeliveryDate: {
      type: Date,
      default: null,
    },

    // ── Workflow ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: TRANSFER_STATUS_LIST,
        message: '{VALUE} is not a valid transfer status',
      },
      default: TRANSFER_STATUS.REQUESTED,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Timestamps for each stage ─────────────
    approvedAt: { type: Date, default: null },
    dispatchedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    reason: {
      type: String,
      trim: true,
      default: '',
    },

    remarks: {
      type: String,
      trim: true,
      default: '',
    },

    rejectionReason: {
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
transferSchema.index({ asset: 1, status: 1 });
transferSchema.index({ status: 1 });

module.exports = mongoose.model('Transfer', transferSchema);
