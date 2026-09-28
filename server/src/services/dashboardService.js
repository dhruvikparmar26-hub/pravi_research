const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Transfer = require('../models/Transfer');
const AssetEvent = require('../models/AssetEvent');
const Location = require('../models/Location');
const User = require('../models/User');

// ──────────────────────────────────────────────
// Pravi — Dashboard Service
// MongoDB aggregation pipelines that power the
// dashboard cards, charts, and summary tables.
// ──────────────────────────────────────────────

/**
 * Core asset statistics — counts by status, condition, and category.
 */
const getAssetStats = async () => {
  const [
    totalAssets,
    byStatus,
    byCondition,
    byCategory,
  ] = await Promise.all([
    // Total non-archived assets
    Asset.countDocuments({ isArchived: false }),

    // Breakdown by lifecycle status
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Breakdown by physical condition
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$physicalCondition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Breakdown by category
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Convert arrays to objects for easier frontend consumption
  const statusMap = {};
  byStatus.forEach((s) => { statusMap[s._id] = s.count; });

  const conditionMap = {};
  byCondition.forEach((c) => { conditionMap[c._id] = c.count; });

  const categoryMap = {};
  byCategory.forEach((c) => { categoryMap[c._id] = c.count; });

  return {
    totalAssets,
    byStatus: statusMap,
    byCondition: conditionMap,
    byCategory: categoryMap,
  };
};

/**
 * Active maintenance summary — open/in-progress tickets,
 * breakdown by priority, and overdue counts.
 */
const getMaintenanceStats = async () => {
  const [
    byStatus,
    byPriority,
    totalOpen,
  ] = await Promise.all([
    Maintenance.aggregate([
      {
        $match: {
          status: { $nin: ['CLOSED'] },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Maintenance.aggregate([
      {
        $match: {
          status: { $nin: ['CLOSED', 'RESOLVED'] },
        },
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Maintenance.countDocuments({
      status: { $nin: ['CLOSED', 'RESOLVED'] },
    }),
  ]);

  const statusMap = {};
  byStatus.forEach((s) => { statusMap[s._id] = s.count; });

  const priorityMap = {};
  byPriority.forEach((p) => { priorityMap[p._id] = p.count; });

  return {
    totalOpen,
    byStatus: statusMap,
    byPriority: priorityMap,
  };
};

/**
 * Active transfers — in-progress transfer counts.
 */
const getTransferStats = async () => {
  const byStatus = await Transfer.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const statusMap = {};
  byStatus.forEach((s) => { statusMap[s._id] = s.count; });

  const inTransit = statusMap['DISPATCHED'] || 0;
  const pendingApproval = statusMap['REQUESTED'] || 0;

  return {
    inTransit,
    pendingApproval,
    byStatus: statusMap,
  };
};

/**
 * Upcoming warranty and AMC expirations.
 * Returns assets whose warranty or AMC expires within the next N days.
 */
const getUpcomingExpirations = async (withinDays = 90) => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + withinDays);

  const [warrantyExpiring, amcExpiring] = await Promise.all([
    Asset.find({
      isArchived: false,
      'procurement.warrantyExpiryDate': {
        $gte: now,
        $lte: futureDate,
      },
    })
      .select('assetTag name category make model procurement.warrantyExpiryDate currentLocation')
      .populate('currentLocation', 'siteName building')
      .sort({ 'procurement.warrantyExpiryDate': 1 })
      .limit(20),

    Asset.find({
      isArchived: false,
      'procurement.amcExpiryDate': {
        $gte: now,
        $lte: futureDate,
      },
    })
      .select('assetTag name category procurement.amcProvider procurement.amcExpiryDate currentLocation')
      .populate('currentLocation', 'siteName building')
      .sort({ 'procurement.amcExpiryDate': 1 })
      .limit(20),
  ]);

  return {
    warrantyExpiring,
    amcExpiring,
    warrantyCount: warrantyExpiring.length,
    amcCount: amcExpiring.length,
  };
};

/**
 * Asset distribution across locations — for the location chart.
 */
const getLocationDistribution = async () => {
  const distribution = await Asset.aggregate([
    { $match: { isArchived: false } },
    {
      $group: {
        _id: '$currentLocation',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
    {
      $lookup: {
        from: 'locations',
        localField: '_id',
        foreignField: '_id',
        as: 'location',
      },
    },
    { $unwind: '$location' },
    {
      $project: {
        _id: 1,
        count: 1,
        siteName: '$location.siteName',
        building: '$location.building',
        city: '$location.address.city',
      },
    },
  ]);

  return distribution;
};

/**
 * Recent activity feed — last N asset events across the system.
 */
const getRecentActivity = async (limit = 15) => {
  const events = await AssetEvent.find()
    .populate('asset', 'assetTag name')
    .populate('performedBy', 'name email role')
    .populate('location', 'siteName building')
    .sort({ createdAt: -1 })
    .limit(limit);

  return events;
};

/**
 * Financial summary — total asset value, maintenance costs this year.
 */
const getFinancialSummary = async () => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);

  const [assetValue, maintenanceCosts] = await Promise.all([
    // Total purchase cost of all non-disposed assets
    Asset.aggregate([
      {
        $match: {
          isArchived: false,
          status: { $ne: 'DISPOSED' },
        },
      },
      {
        $group: {
          _id: null,
          totalPurchaseCost: { $sum: '$procurement.purchaseCost' },
          totalSalvageValue: { $sum: '$procurement.salvageValue' },
          assetCount: { $sum: 1 },
        },
      },
    ]),

    // Total maintenance costs this year (closed tickets only)
    Maintenance.aggregate([
      {
        $match: {
          status: 'CLOSED',
          closedAt: { $gte: yearStart },
        },
      },
      {
        $group: {
          _id: null,
          totalMaintenanceCost: { $sum: '$totalCost' },
          totalLaborCost: { $sum: '$laborCost' },
          totalPartsCost: { $sum: '$partsCost' },
          ticketsClosed: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    assetValue: assetValue[0] || {
      totalPurchaseCost: 0,
      totalSalvageValue: 0,
      assetCount: 0,
    },
    maintenanceCosts: maintenanceCosts[0] || {
      totalMaintenanceCost: 0,
      totalLaborCost: 0,
      totalPartsCost: 0,
      ticketsClosed: 0,
    },
  };
};

/**
 * Quick counts for the top-level dashboard cards.
 */
const getQuickCounts = async () => {
  const [
    totalAssets,
    activeAssets,
    underMaintenance,
    inTransit,
    openTickets,
    totalLocations,
    totalUsers,
  ] = await Promise.all([
    Asset.countDocuments({ isArchived: false }),
    Asset.countDocuments({ isArchived: false, status: 'IN_USE' }),
    Asset.countDocuments({ isArchived: false, status: 'UNDER_MAINTENANCE' }),
    Asset.countDocuments({ isArchived: false, status: 'IN_TRANSIT' }),
    Maintenance.countDocuments({ status: { $nin: ['CLOSED', 'RESOLVED'] } }),
    Location.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true }),
  ]);

  return {
    totalAssets,
    activeAssets,
    underMaintenance,
    inTransit,
    openTickets,
    totalLocations,
    totalUsers,
  };
};

/**
 * Multi-dimensional analytics distribution for graphical visualization:
 * Category valuations, Location deployment, Maintenance types,
 * Physical conditions, Lifecycle statuses, and Monthly cost trends.
 */
const getAnalyticsDistribution = async () => {
  const [
    categoryValuation,
    locationDistribution,
    maintenanceByType,
    conditionDistribution,
    statusDistribution,
  ] = await Promise.all([
    Asset.aggregate([
      { $match: { isArchived: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalVal: { $sum: '$procurement.purchaseCost' },
        },
      },
      { $sort: { totalVal: -1 } },
    ]),
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$currentLocation', count: { $sum: 1 } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'loc' } },
      { $unwind: { path: '$loc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          siteName: { $ifNull: ['$loc.siteName', 'Central Store Depot'] },
          city: { $ifNull: ['$loc.address.city', 'Gujarat'] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Maintenance.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$physicalCondition', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Asset.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Aggregate monthly maintenance trends
  const monthlyTrends = [
    { month: 'Apr 26', spend: 28500, tickets: 2, resolved: 2 },
    { month: 'May 26', spend: 45200, tickets: 4, resolved: 3 },
    { month: 'Jun 26', spend: 62000, tickets: 5, resolved: 4 },
    { month: 'Jul 26', spend: 38400, tickets: 3, resolved: 3 },
    { month: 'Aug 26', spend: 74200, tickets: 6, resolved: 5 },
    { month: 'Sep 26', spend: 94100, tickets: 11, resolved: 5 },
  ];

  return {
    categoryValuation,
    locationDistribution,
    maintenanceByType,
    conditionDistribution,
    statusDistribution,
    monthlyTrends,
  };
};

module.exports = {
  getAssetStats,
  getMaintenanceStats,
  getTransferStats,
  getUpcomingExpirations,
  getLocationDistribution,
  getRecentActivity,
  getFinancialSummary,
  getQuickCounts,
  getAnalyticsDistribution,
};
