const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Asset = require('../models/Asset');
const Location = require('../models/Location');
const Transfer = require('../models/Transfer');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const { ASSET_CATEGORIES, ASSET_STATUS, PHYSICAL_CONDITIONS } = require('../config/constants');

async function cleanAndStandardizeAssets() {
  await connectDB();
  console.log('Connected to MongoDB. Standardizing asset names & serial numbers...');

  const admin = await User.findOne({ email: 'admin@pravi.gov.in' });
  const locations = await Location.find().sort({ createdAt: 1 });

  if (!admin || locations.length < 4) {
    console.error('Missing admin or locations in DB');
    process.exit(1);
  }

  // 1. Delete test/scratch assets
  const deleteResult = await Asset.deleteMany({
    $or: [
      { name: 'NEW_asset' },
      { name: 'TATA' },
      { serialNumber: { $regex: '^SN-VOG-' } },
      { serialNumber: '1234' },
      { serialNumber: 'GJ-01-AB-0101' },
      { assetTag: { $in: ['AST-HM-2026-0007', 'AST-HM-2026-0008'] } },
    ]
  });
  console.log(`Deleted ${deleteResult.deletedCount} scratch/test/duplicate assets.`);

  // 2. Canonical Clean Assets
  const cleanCatalog = [
    {
      assetTag: 'AST-HM-2026-0001',
      name: 'Road Roller',
      category: ASSET_CATEGORIES.HEAVY_MACHINERY,
      make: 'Wirtgen Hamm',
      model: '311 Compactor',
      serialNumber: 'SN-ROL-101',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[2]._id, // Gandhinagar
      department: 'Highways & Pavements',
      procurement: {
        purchaseCost: 4850000,
        purchaseDate: new Date('2024-03-15'),
        vendor: 'Wirtgen India',
        warrantyExpiryDate: new Date('2026-11-15'),
      },
      specifications: { capacityOrRating: '11 Ton Drum', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-HM-2026-0002',
      name: 'Asphalt Paver Machine',
      category: ASSET_CATEGORIES.HEAVY_MACHINERY,
      make: 'Vogele',
      model: 'Super 1800',
      serialNumber: 'SN-PAV-201',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[2]._id, // Gandhinagar
      department: 'Highways & Pavements',
      procurement: {
        purchaseCost: 12500000,
        purchaseDate: new Date('2023-08-20'),
        vendor: 'Vogele India',
        warrantyExpiryDate: new Date('2026-10-20'),
      },
      specifications: { capacityOrRating: '10m Paving Width', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-HM-2026-0003',
      name: 'JCB Backhoe Loader',
      category: ASSET_CATEGORIES.HEAVY_MACHINERY,
      make: 'JCB',
      model: '3DX Super',
      serialNumber: 'SN-JCB-301',
      status: ASSET_STATUS.UNDER_MAINTENANCE,
      physicalCondition: PHYSICAL_CONDITIONS.NEEDS_REPAIR,
      currentLocation: locations[1]._id, // Rajkot
      department: 'Mechanical Workshop',
      procurement: {
        purchaseCost: 3450000,
        purchaseDate: new Date('2022-05-10'),
        vendor: 'JCB India',
      },
      specifications: { capacityOrRating: '1.0 CUM Shovel', powerOrFuelType: 'DIESEL', manufacturingYear: 2022 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-HM-2026-0004',
      name: 'Motor Grader',
      category: ASSET_CATEGORIES.HEAVY_MACHINERY,
      make: 'Caterpillar',
      model: '120 GC',
      serialNumber: 'SN-GRD-401',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[0]._id, // Ahmedabad
      department: 'Highways & Pavements',
      procurement: {
        purchaseCost: 8500000,
        purchaseDate: new Date('2023-04-18'),
        vendor: 'Caterpillar India',
        warrantyExpiryDate: new Date('2027-04-18'),
      },
      specifications: { capacityOrRating: '14 Ft Moldboard Blade', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-FV-2026-0005',
      name: 'Heavy Dump Truck',
      category: ASSET_CATEGORIES.FLEET_VEHICLE,
      make: 'Tata Motors',
      model: 'Signa 2823',
      serialNumber: 'SN-TRK-501',
      status: ASSET_STATUS.IN_TRANSIT,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[0]._id, // Ahmedabad
      department: 'Materials Transport',
      procurement: {
        purchaseCost: 3850000,
        purchaseDate: new Date('2024-01-10'),
        vendor: 'Tata Commercial Vehicles',
      },
      specifications: { capacityOrRating: '16 CUM Box Body', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-TA-2026-0006',
      name: 'Digital Survey Station',
      category: ASSET_CATEGORIES.TOOLS_AND_APPARATUS,
      make: 'Leica',
      model: 'TS07 Total Station',
      serialNumber: 'SN-SRV-601',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.BRAND_NEW,
      currentLocation: locations[0]._id, // Ahmedabad
      department: 'Quality Control & Survey',
      procurement: {
        purchaseCost: 820000,
        purchaseDate: new Date('2025-06-01'),
        vendor: 'Leica India',
        warrantyExpiryDate: new Date('2026-11-05'),
      },
      specifications: { capacityOrRating: '1" Angular Accuracy', powerOrFuelType: 'BATTERY', manufacturingYear: 2025 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-EL-2026-0007',
      name: 'Diesel Power Generator',
      category: ASSET_CATEGORIES.ELECTRICAL_EQUIPMENT,
      make: 'Kirloskar',
      model: '250 kVA Silent',
      serialNumber: 'SN-GEN-701',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[3]._id, // Bharuch
      department: 'Electrical Division',
      procurement: {
        purchaseCost: 1650000,
        purchaseDate: new Date('2023-11-12'),
        vendor: 'Kirloskar Electric',
        amcProvider: 'Kirloskar Care',
        amcExpiryDate: new Date('2026-10-28'),
      },
      specifications: { capacityOrRating: '250 kVA / 200 kW', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
      createdBy: admin._id,
    },
    {
      assetTag: 'AST-HM-2026-0008',
      name: 'Mobile Hydraulic Crane',
      category: ASSET_CATEGORIES.HEAVY_MACHINERY,
      make: 'ACE Machinery',
      model: '25 Ton Mobile',
      serialNumber: 'SN-CRN-801',
      status: ASSET_STATUS.IN_USE,
      physicalCondition: PHYSICAL_CONDITIONS.GOOD,
      currentLocation: locations[0]._id, // Ahmedabad
      department: 'Heavy Equipment Depot',
      procurement: {
        purchaseCost: 5200000,
        purchaseDate: new Date('2024-02-14'),
        vendor: 'ACE Heavy Equipment',
        warrantyExpiryDate: new Date('2027-02-14'),
      },
      specifications: { capacityOrRating: '25 Metric Ton Boom', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
      createdBy: admin._id,
    },
  ];

  for (const item of cleanCatalog) {
    const existing = await Asset.findOne({ assetTag: item.assetTag });
    if (existing) {
      existing.name = item.name;
      existing.make = item.make;
      existing.model = item.model;
      existing.serialNumber = item.serialNumber;
      existing.category = item.category;
      existing.currentLocation = item.currentLocation;
      existing.status = item.status;
      existing.physicalCondition = item.physicalCondition;
      existing.procurement = item.procurement;
      existing.specifications = item.specifications;
      await existing.save();
      console.log(`✓ Updated ${item.assetTag} -> ${item.name} (${item.serialNumber})`);
    } else {
      await Asset.create(item);
      console.log(`✓ Created ${item.assetTag} -> ${item.name} (${item.serialNumber})`);
    }
  }

  // Delete any lingering asset tags outside 0001..0008
  const validTags = cleanCatalog.map(c => c.assetTag);
  await Asset.deleteMany({ assetTag: { $nin: validTags } });

  const allCurrent = await Asset.find({}, 'assetTag name make model serialNumber').sort({ assetTag: 1 }).lean();
  console.log('\n--- FINAL STANDARDIZED ASSET INVENTORY ---');
  allCurrent.forEach((a) => {
    console.log(`[${a.assetTag}] ${a.name} | Make: ${a.make} (${a.model}) | S/N: ${a.serialNumber}`);
  });

  console.log('\n✓ Asset standardization finished!');
  process.exit(0);
}

cleanAndStandardizeAssets().catch((err) => {
  console.error('Error standardizing assets:', err);
  process.exit(1);
});
