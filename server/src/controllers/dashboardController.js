const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

// ──────────────────────────────────────────────
// Pravi — Dashboard Controller
// Exposes endpoints powering high-level metrics,
// lifecycle distributions, upcoming alerts, and
// system-wide activity feeds.
// ──────────────────────────────────────────────

/**
 * GET /api/dashboard/overview
 * Master summary card metrics + status distributions + financials.
 */
const getOverview = async (req, res, next) => {
  try {
    const [
      quickCounts,
      assetStats,
      maintenanceStats,
      transferStats,
      financialSummary,
      analyticsDistribution,
    ] = await Promise.all([
      dashboardService.getQuickCounts(),
      dashboardService.getAssetStats(),
      dashboardService.getMaintenanceStats(),
      dashboardService.getTransferStats(),
      dashboardService.getFinancialSummary(),
      dashboardService.getAnalyticsDistribution(),
    ]);

    return sendSuccess(res, 200, 'Dashboard overview retrieved', {
      quickCounts,
      assetStats,
      maintenanceStats,
      transferStats,
      financialSummary,
      analyticsDistribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/assets
 * Detailed asset metrics: status, condition, category, and location distribution.
 */
const getAssetAnalytics = async (req, res, next) => {
  try {
    const [stats, distribution] = await Promise.all([
      dashboardService.getAssetStats(),
      dashboardService.getLocationDistribution(),
    ]);

    return sendSuccess(res, 200, 'Asset analytics retrieved', {
      ...stats,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/maintenance
 * Maintenance ticket metrics by status and priority.
 */
const getMaintenanceAnalytics = async (req, res, next) => {
  try {
    const stats = await dashboardService.getMaintenanceStats();
    return sendSuccess(res, 200, 'Maintenance analytics retrieved', { stats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/expirations?days=90
 * Assets with warranty or AMC expiring within the next N days.
 */
const getExpirations = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 90;
    const expirations = await dashboardService.getUpcomingExpirations(days);
    return sendSuccess(res, 200, 'Upcoming expirations retrieved', expirations);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/activity?limit=15
 * Real-time event timeline feed across all assets.
 */
const getActivityFeed = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 15;
    const activities = await dashboardService.getRecentActivity(limit);
    return sendSuccess(res, 200, 'Recent activity retrieved', { activities });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/financial
 * Total asset valuation, salvage value, and maintenance spend.
 */
const getFinancials = async (req, res, next) => {
  try {
    const financials = await dashboardService.getFinancialSummary();
    return sendSuccess(res, 200, 'Financial summary retrieved', { financials });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getAssetAnalytics,
  getMaintenanceAnalytics,
  getExpirations,
  getActivityFeed,
  getFinancials,
};
