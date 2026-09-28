const mongoose = require('mongoose');
const {
  ASSET_CATEGORY_LIST,
  ASSET_STATUS_LIST,
  ASSET_STATUS,
  PHYSICAL_CONDITION_LIST,
  PHYSICAL_CONDITIONS,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Asset Model
// The central entity of the system. Represents a
// physical infrastructure asset tracked across
// its entire lifecycle.
// ──────────────────────────────────────────────

const assetSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────
    assetTag: {
      type: String,
      unique: true,
      required: [true, 'Asset tag is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [200, 'Asset name cannot exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: String,
      required: [true, 'Asset category is required'],
      enum: {
        values: ASSET_CATEGORY_LIST,
        message: '{VALUE} is not a valid asset category',
      },
    },

    // ── Manufacturer / Model ──────────────────
    make: {
      type: String,
      required: [true, 'Manufacturer / Make is required'],
      trim: true,
    },

    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },

    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },

    // ── Condition & Lifecycle ─────────────────
    physicalCondition: {
      type: String,
      enum: {
        values: PHYSICAL_CONDITION_LIST,
        message: '{VALUE} is not a valid condition',
      },
      default: PHYSICAL_CONDITIONS.BRAND_NEW,
    },

    status: {
      type: String,
      enum: {
        values: ASSET_STATUS_LIST,
        message: '{VALUE} is not a valid status',
      },
      default: ASSET_STATUS.PROCURED,
      index: true,
    },

    // ── Physical Location & Custody ───────────
    currentLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Asset must have a location'],
    },

    currentCustodian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    department: {
      type: String,
      default: 'Roads & Buildings',
      trim: true,
    },

    // ── Procurement & Financial ───────────────
    procurement: {
      vendor: {
        type: String,
        default: 'Authorized Supplier',
        trim: true,
      },
      purchaseOrderNo: {
        type: String,
        trim: true,
        default: '',
      },
      purchaseInvoiceNo: {
        type: String,
        trim: true,
        default: '',
      },
      purchaseDate: {
        type: Date,
        default: Date.now,
      },
      purchaseCost: {
        type: Number,
        default: 0,
        min: [0, 'Purchase cost cannot be negative'],
      },
      salvageValue: {
        type: Number,
        default: 0,
        min: [0, 'Salvage value cannot be negative'],
      },
      depreciationRatePercent: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      warrantyExpiryDate: {
        type: Date,
        default: null,
      },
      amcProvider: {
        type: String,
        trim: true,
        default: '',
      },
      amcExpiryDate: {
        type: Date,
        default: null,
      },
    },

    // ── Physical Specifications ───────────────
    specifications: {
      powerRating: { type: String, trim: true, default: '' },
      dimensions: { type: String, trim: true, default: '' },
      weightKg: { type: Number, default: null },
      fuelOrPowerSource: { type: String, trim: true, default: '' },
    },

    // ── Operational Tracking ──────────────────
    qrCodeUrl: {
      type: String,
      default: '',
    },

    lastInspectionDate: {
      type: Date,
      default: null,
    },

    nextMaintenanceDueDate: {
      type: Date,
      default: null,
    },

    // ── Soft Delete ───────────────────────────
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────
// Note: serialNumber and assetTag already have unique indexes from field options
assetSchema.index({ category: 1, status: 1 });
assetSchema.index({ currentLocation: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ 'procurement.warrantyExpiryDate': 1 });
assetSchema.index({ 'procurement.amcExpiryDate': 1 });
assetSchema.index({
  name: 'text',
  assetTag: 'text',
  serialNumber: 'text',
  make: 'text',
  model: 'text',
});

module.exports = mongoose.model('Asset', assetSchema);
