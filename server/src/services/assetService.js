const Asset = require('../models/Asset');
const Location = require('../models/Location');
const Maintenance = require('../models/Maintenance');
const { generateAssetTag } = require('../utils/generateAssetTag');
const { logEvent } = require('./eventService');
const {
  EVENT_TYPES,
  ASSET_STATUS,
  ASSET_STATUS_TRANSITIONS,
} = require('../config/constants');

// ──────────────────────────────────────────────
// Pravi — Asset Service
// Core business logic for asset operations.
// Controllers call these; they should never
// contain HTTP-level concerns.
// ──────────────────────────────────────────────

/**
 * Compute real-time Risk Assessment, Maintenance Cost, and Warnings
 */
const computeAssetRiskAndCosts = (asset, stats = {}) => {
  const purchaseCost = asset.procurement?.purchaseCost || 0;
  const totalMaintenanceCost = stats.totalCost || 0;
  const ticketCount = stats.ticketCount || 0;
  const activeTickets = stats.activeTickets || 0;

  const costRatioPercent = purchaseCost > 0 
    ? Math.round((totalMaintenanceCost / purchaseCost) * 100) 
    : 0;

  const warnings = [];
  const riskFactors = [];
  let riskScore = 15; // baseline low risk

  // 1. Condition Risk
  const condition = asset.physicalCondition || 'GOOD';
  if (['DAMAGED', 'CONDEMNED', 'NEEDS_REPAIR'].includes(condition)) {
    riskScore += 45;
    riskFactors.push(`Critical Physical Condition: ${condition.replace('_', ' ')}`);
    warnings.push({
      type: 'CONDITION_ALERT',
      severity: 'critical',
      message: `Equipment condition flagged as ${condition.replace('_', ' ')}`
    });
  } else if (condition === 'FAIR') {
    riskScore += 20;
    riskFactors.push('Moderate mechanical wear (Condition: FAIR)');
  }

  // 2. Lifecycle Status
  if (asset.status === 'UNDER_MAINTENANCE' || activeTickets > 0) {
    riskScore += 25;
    riskFactors.push('Asset currently under breakdown or active maintenance order');
    warnings.push({
      type: 'ACTIVE_BREAKDOWN',
      severity: 'warning',
      message: 'Active service work order in progress'
    });
  }

  // 3. Maintenance Cost Ratio
  if (costRatioPercent >= 40) {
    riskScore += 35;
    riskFactors.push(`High Maintenance Ratio (${costRatioPercent}% of capital cost spent on repairs)`);
    warnings.push({
      type: 'HIGH_MAINTENANCE_COST',
      severity: 'warning',
      message: `Maintenance spend represents ${costRatioPercent}% of purchase value`
    });
  } else if (costRatioPercent >= 20) {
    riskScore += 15;
    riskFactors.push(`Moderate Maintenance Spend (${costRatioPercent}% of purchase value)`);
  }

  // 4. Warranty & AMC Warnings
  const now = new Date();
  if (asset.procurement?.warrantyExpiryDate) {
    const warrantyDate = new Date(asset.procurement.warrantyExpiryDate);
    const daysUntilWarranty = Math.ceil((warrantyDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilWarranty < 0) {
      riskScore += 15;
      riskFactors.push('OEM manufacturer warranty expired');
      warnings.push({
        type: 'WARRANTY_EXPIRED',
        severity: 'info',
        message: `Warranty expired on ${warrantyDate.toISOString().split('T')[0]}`
      });
    } else if (daysUntilWarranty <= 60) {
      warnings.push({
        type: 'WARRANTY_EXPIRING_SOON',
        severity: 'info',
        message: `Warranty expires in ${daysUntilWarranty} days`
      });
    }
  }

  if (asset.procurement?.amcExpiryDate) {
    const amcDate = new Date(asset.procurement.amcExpiryDate);
    const daysUntilAmc = Math.ceil((amcDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilAmc < 0) {
      riskScore += 10;
      riskFactors.push('Annual Maintenance Contract (AMC) expired');
      warnings.push({
        type: 'AMC_EXPIRED',
        severity: 'warning',
        message: 'Annual Maintenance Contract expired'
      });
    } else if (daysUntilAmc <= 30) {
      warnings.push({
        type: 'AMC_EXPIRING_SOON',
        severity: 'info',
        message: `AMC renewal due in ${daysUntilAmc} days`
      });
    }
  }

  // Determine Level from Score
  riskScore = Math.min(100, riskScore);
  let riskLevel = 'LOW';
  if (riskScore >= 70) riskLevel = 'HIGH';
  else if (riskScore >= 40) riskLevel = 'MEDIUM';

  return {
    totalMaintenanceCost,
    maintenanceCostRatio: costRatioPercent,
    ticketCount,
    activeTickets,
    risk: {
      score: riskScore,
      level: riskLevel,
      factors: riskFactors
    },
    warnings
  };
};

/**
 * Create a new asset with auto-generated tag and initial event.
 */
const createAsset = async (data, userId) => {
  // 1. Auto-generate the asset tag
  //    Count existing assets in the same category this year to build the sequence.
  const year = new Date().getFullYear();
  const prefix = `AST-`;
  const count = await Asset.countDocuments({
    category: data.category,
    assetTag: { $regex: `^AST-.*-${year}-` },
  });
  const assetTag = generateAssetTag(data.category, count + 1);

  // 2. Validate that the location exists or fallback to first available
  let locationId = data.currentLocation;
  if (!locationId) {
    const defaultLocation = await Location.findOne({ isActive: true });
    if (defaultLocation) {
      locationId = defaultLocation._id;
    }
  }

  const location = await Location.findById(locationId);
  if (!location) {
    const error = new Error('No valid location found. Please create a location first.');
    error.statusCode = 404;
    throw error;
  }

  // 3. Create asset
  const asset = await Asset.create({
    ...data,
    currentLocation: locationId,
    assetTag,
    status: ASSET_STATUS.IN_USE,
  });

  // 4. Increment the location's asset counter
  await Location.findByIdAndUpdate(locationId, {
    $inc: { assetCount: 1 },
  });

  // 5. Log the creation event
  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.CREATED,
    title: 'Asset registered in Pravi',
    description: `${asset.name} (${asset.assetTag}) registered under ${asset.category}`,
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      assetTag: asset.assetTag,
      category: asset.category,
      status: asset.status,
    },
  });

  return asset;
};

/**
 * Get paginated, filtered, searchable asset list.
 */
const getAssets = async (query) => {
  const {
    search,
    category,
    status,
    physicalCondition,
    location,
    department,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter = { isArchived: false };

  // Filters
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (physicalCondition) filter.physicalCondition = physicalCondition;
  if (location) filter.currentLocation = location;
  if (department) filter.department = { $regex: department, $options: 'i' };

  // Search across multiple fields
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { assetTag: { $regex: search, $options: 'i' } },
      { serialNumber: { $regex: search, $options: 'i' } },
      { make: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .populate('currentLocation', 'siteName building roomOrBay')
      .populate('currentCustodian', 'name email department')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10)),
    Asset.countDocuments(filter),
  ]);

  // Aggregate maintenance costs & tickets for all returned assets
  const assetIds = assets.map((a) => a._id);
  const maintenanceAgg = await Maintenance.aggregate([
    { $match: { asset: { $in: assetIds } } },
    {
      $group: {
        _id: '$asset',
        totalCost: { $sum: '$totalCost' },
        ticketCount: { $sum: 1 },
        activeTickets: {
          $sum: {
            $cond: [
              { $in: ['$status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS']] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const statsMap = {};
  maintenanceAgg.forEach(m => {
    statsMap[m._id.toString()] = m;
  });

  const enrichedAssets = assets.map(a => {
    const obj = a.toObject({ virtuals: true });
    const computed = computeAssetRiskAndCosts(obj, statsMap[a._id.toString()] || {});
    return { ...obj, ...computed };
  });

  return {
    assets: enrichedAssets,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
};

/**
 * Get a single asset by ID with populated references.
 */
const getAssetById = async (assetId) => {
  const asset = await Asset.findById(assetId)
    .populate('currentLocation')
    .populate('currentCustodian', 'name email role department phone');

  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  const ticketStats = await Maintenance.aggregate([
    { $match: { asset: asset._id } },
    {
      $group: {
        _id: '$asset',
        totalCost: { $sum: '$totalCost' },
        ticketCount: { $sum: 1 },
        activeTickets: {
          $sum: {
            $cond: [
              { $in: ['$status', ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS']] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const obj = asset.toObject({ virtuals: true });
  const computed = computeAssetRiskAndCosts(obj, ticketStats[0] || {});
  return { ...obj, ...computed };
};

/**
 * Update asset basic details (not status — use lifecycle service for that).
 */
const updateAsset = async (assetId, data, userId) => {
  // Fields that should NOT be updated directly through this function
  const restricted = ['assetTag', 'status', 'currentLocation', 'currentCustodian'];
  restricted.forEach((field) => delete data[field]);

  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  // Capture old values for the event log
  const oldValues = {};
  const newValues = {};
  Object.keys(data).forEach((key) => {
    const oldVal = asset.get(key);
    const newVal = data[key];
    // Only track actual changes
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      oldValues[key] = oldVal;
      newValues[key] = newVal;
    }
  });

  // Apply updates
  Object.assign(asset, data);
  await asset.save();

  // Log the update event if anything actually changed
  if (Object.keys(newValues).length > 0) {
    await logEvent({
      assetId: asset._id,
      eventType: EVENT_TYPES.STATUS_CHANGED,
      title: 'Asset details updated',
      description: `Updated fields: ${Object.keys(newValues).join(', ')}`,
      performedBy: userId,
      locationId: asset.currentLocation,
      metadata: { before: oldValues, after: newValues },
    });
  }

  return asset;
};

/**
 * Validate and execute a lifecycle status transition.
 */
const changeStatus = async (assetId, newStatus, userId, reason = '') => {
  const asset = await Asset.findById(assetId);
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }

  const currentStatus = asset.status;
  const allowed = ASSET_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    const error = new Error(
      `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
    );
    error.statusCode = 400;
    throw error;
  }

  asset.status = newStatus;
  await asset.save();

  await logEvent({
    assetId: asset._id,
    eventType: EVENT_TYPES.STATUS_CHANGED,
    title: `Status changed: ${currentStatus} → ${newStatus}`,
    description: reason || `Lifecycle transition from ${currentStatus} to ${newStatus}`,
    performedBy: userId,
    locationId: asset.currentLocation,
    metadata: {
      before: { status: currentStatus },
      after: { status: newStatus },
    },
  });

  return asset;
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  changeStatus,
};
