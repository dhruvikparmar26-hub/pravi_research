const Location = require('../models/Location');
const Asset = require('../models/Asset');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const CITY_COORDINATES = {
  ahmedabad: { latitude: 23.0360, longitude: 72.5293 },
  rajkot: { latitude: 22.2735, longitude: 70.8213 },
  gandhinagar: { latitude: 23.2230, longitude: 72.6492 },
  vadodara: { latitude: 22.3325, longitude: 73.1610 },
  surat: { latitude: 21.1764, longitude: 72.8223 },
  bharuch: { latitude: 21.7051, longitude: 72.9959 },
  mehsana: { latitude: 23.6000, longitude: 72.3900 },
  bhavnagar: { latitude: 21.7645, longitude: 72.1519 },
  patan: { latitude: 23.8493, longitude: 72.1266 },
  jamnagar: { latitude: 22.4707, longitude: 70.0577 },
  junagadh: { latitude: 21.5222, longitude: 70.4579 },
  bhuj: { latitude: 23.2420, longitude: 69.6669 },
  anand: { latitude: 22.5645, longitude: 72.9289 },
};

// ──────────────────────────────────────────────
// POST /api/locations
// Create a new physical location.
// ──────────────────────────────────────────────
const createLocation = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (!payload.building) payload.building = 'Main Administrative Wing';
    if (!payload.roomOrBay) payload.roomOrBay = 'Central Depot / Machinery Yard';
    if (!payload.address) payload.address = {};
    if (!payload.address.state) payload.address.state = 'Gujarat';
    if (!payload.address.city) payload.address.city = 'Ahmedabad';

    if (!payload.coordinates || !payload.coordinates.latitude) {
      const cityKey = payload.address.city.toLowerCase().trim();
      const coords = CITY_COORDINATES[cityKey] || { latitude: 23.0225, longitude: 72.5714 };
      payload.coordinates = coords;
    }

    const location = await Location.create(payload);

    return sendSuccess(res, 201, 'Location created successfully', { location });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/locations
// List all locations with optional search/filter and live asset counts.
// ──────────────────────────────────────────────
const getLocations = async (req, res, next) => {
  try {
    const { search, city, isActive, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['address.city'] = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { siteName: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { roomOrBay: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [locations, total, assetCounts] = await Promise.all([
      Location.find(filter)
        .populate('siteManager', 'name email phone department')
        .sort({ siteName: 1, building: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Location.countDocuments(filter),
      Asset.aggregate([
        { $match: { isArchived: false, status: { $ne: 'DISPOSED' } } },
        { $group: { _id: '$currentLocation', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = {};
    assetCounts.forEach((c) => {
      if (c._id) countMap[c._id.toString()] = c.count;
    });

    const populatedLocations = locations.map((loc) => {
      const obj = loc.toObject({ virtuals: true });
      obj.assetCount = countMap[loc._id.toString()] || 0;
      return obj;
    });

    return sendSuccess(res, 200, 'Locations retrieved', {
      locations: populatedLocations,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/locations/:id
// Get a single location with details and live asset count.
// ──────────────────────────────────────────────
const getLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('siteManager', 'name email phone department');

    if (!location) {
      return sendError(res, 404, 'Location not found');
    }

    const realCount = await Asset.countDocuments({
      currentLocation: location._id,
      isArchived: false,
      status: { $ne: 'DISPOSED' },
    });

    const obj = location.toObject({ virtuals: true });
    obj.assetCount = realCount;

    return sendSuccess(res, 200, 'Location retrieved', { location: obj });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/locations/:id
// Update a location.
// ──────────────────────────────────────────────
const updateLocation = async (req, res, next) => {
  try {
    // Don't allow direct manipulation of the asset count
    delete req.body.assetCount;

    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!location) {
      return sendError(res, 404, 'Location not found');
    }

    return sendSuccess(res, 200, 'Location updated', { location });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// DELETE /api/locations/:id
// Soft-deactivate a location (only if no active
// assets are housed there).
// ──────────────────────────────────────────────
const deactivateLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return sendError(res, 404, 'Location not found');
    }

    if (location.assetCount > 0) {
      return sendError(
        res,
        400,
        `Cannot deactivate — ${location.assetCount} asset(s) are still housed at this location. Transfer or dispose them first.`
      );
    }

    location.isActive = false;
    await location.save();

    return sendSuccess(res, 200, 'Location deactivated', { location });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  deactivateLocation,
};
