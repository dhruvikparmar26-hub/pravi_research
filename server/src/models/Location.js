const mongoose = require('mongoose');

// ──────────────────────────────────────────────
// Pravi — Location Model
// Represents a physical facility where assets
// are housed: campus, plant, building, floor,
// bay, room, shed, warehouse section, etc.
// ──────────────────────────────────────────────

const locationSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: [150, 'Site name cannot exceed 150 characters'],
    },

    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
      maxlength: [150, 'Building name cannot exceed 150 characters'],
    },

    floor: {
      type: String,
      trim: true,
      default: '',
    },

    roomOrBay: {
      type: String,
      required: [true, 'Room / Bay / Zone is required'],
      trim: true,
      maxlength: [150, 'Room/Bay name cannot exceed 150 characters'],
    },

    address: {
      street: { type: String, trim: true, default: '' },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },

    siteManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    coordinates: {
      latitude: { type: Number, default: 23.0225 },
      longitude: { type: Number, default: 72.5714 },
    },

    // How many assets are currently housed here (denormalized counter)
    assetCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────
locationSchema.index({ siteName: 1, building: 1, roomOrBay: 1 });
locationSchema.index({ 'address.city': 1 });
locationSchema.index({ isActive: 1 });

// ── Virtual: Full label for display ─────────
locationSchema.virtual('fullLabel').get(function () {
  const parts = [this.siteName, this.building];
  if (this.floor) parts.push(this.floor);
  parts.push(this.roomOrBay);
  return parts.join(' → ');
});

// Ensure virtuals appear in JSON/Object output
locationSchema.set('toJSON', { virtuals: true });
locationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Location', locationSchema);
