// ──────────────────────────────────────────────
// Pravi — Roads & Buildings Full Data Seeder
// Seeds demo accounts, divisions/depots, heavy machinery,
// gate passes, and work orders.
// ──────────────────────────────────────────────
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Location = require('../models/Location');
const Asset = require('../models/Asset');
const AssetEvent = require('../models/AssetEvent');
const Transfer = require('../models/Transfer');
const Maintenance = require('../models/Maintenance');
const connectDB = require('../config/db');
const { ROLES, ASSET_CATEGORIES, ASSET_STATUS, PHYSICAL_CONDITIONS, TRANSFER_STATUS, GATE_PASS_TYPES } = require('../config/constants');

const seedRnBData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Seeding Roads & Buildings Data...');

    // 1. Users
    const password = 'Admin@123456';
    const users = [
      { name: 'Super Admin R&B', email: 'admin@pravi.gov.in', password, role: ROLES.ADMIN, department: 'State Secretariat', phone: '+91 79 2325 0001' },
      { name: 'Er. V. K. Patel (Executive Engr)', email: 'manager@pravi.gov.in', password, role: ROLES.ASSET_MANAGER, department: 'Roads & Highways Division', phone: '+91 98250 14820' },
      { name: 'M. S. Solanki (Technician)', email: 'tech@pravi.gov.in', password, role: ROLES.TECHNICIAN, department: 'Mechanical Workshop Depot', phone: '+91 94260 77112' },
      { name: 'D. M. Joshi (Field Custodian)', email: 'employee@pravi.gov.in', password, role: ROLES.EMPLOYEE, department: 'Field Quality Control', phone: '+91 98980 33451' },
    ];

    const createdUsers = {};
    for (const u of users) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc) {
        userDoc = await User.create(u);
      }
      createdUsers[u.email] = userDoc;
    }
    console.log('✓ Users verified/created');

    // 2. Locations (Real Gujarat Roads & Buildings Dept Circles, Depots & Highway Camps)
    const locationsData = [
      {
        siteName: 'Ahmedabad R&B Circle Headquarters',
        building: 'Nirman Bhavan Administrative Wing',
        roomOrBay: 'Divisional Materials & Soil Testing Laboratory',
        address: { street: 'Drive-In Road, Vastrapur', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380015' },
        coordinates: { latitude: 23.0360, longitude: 72.5293 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 3,
      },
      {
        siteName: 'Rajkot Mechanical Division & Central Workshop',
        building: 'Heavy Equipment Maintenance Workshop',
        roomOrBay: 'Earthmover Service Bay 1 & 2',
        address: { street: 'Phase II, Aji GIDC Industrial Estate', city: 'Rajkot', state: 'Gujarat', postalCode: '360003' },
        coordinates: { latitude: 22.2735, longitude: 70.8213 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 1,
      },
      {
        siteName: 'NH-48 Highway Widening Project Camp',
        building: 'Field Engineering Staging Base',
        roomOrBay: 'Bitumen Batching & Asphalt Staging Yard',
        address: { street: 'Bharuch-Ankleshwar Bypass, NH-48', city: 'Bharuch', state: 'Gujarat', postalCode: '392001' },
        coordinates: { latitude: 21.7051, longitude: 72.9959 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 2,
      },
      {
        siteName: 'Gandhinagar Capital Project Division',
        building: 'Sachivalaya Complex Block 4',
        roomOrBay: 'Substation & HVAC Plant Staging',
        address: { street: 'Sector 10', city: 'Gandhinagar', state: 'Gujarat', postalCode: '382010' },
        coordinates: { latitude: 23.2230, longitude: 72.6492 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 2,
      },
      {
        siteName: 'Vadodara Highway Division Machinery Depot',
        building: 'Plant & Equipment Yard',
        roomOrBay: 'Asphalt Paver & Roller Staging Bay',
        address: { street: 'Gorwa Industrial Area', city: 'Vadodara', state: 'Gujarat', postalCode: '390016' },
        coordinates: { latitude: 22.3325, longitude: 73.1610 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 0,
      },
      {
        siteName: 'Surat Circle Heavy Equipment Depot',
        building: 'Regional Mechanical Store & Workshop',
        roomOrBay: 'Fleet Maintenance Shed B',
        address: { street: 'Majura Gate, Ring Road', city: 'Surat', state: 'Gujarat', postalCode: '395001' },
        coordinates: { latitude: 21.1764, longitude: 72.8223 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 0,
      },
      {
        siteName: 'Mehsana State Highway Division Depot',
        building: 'Regional Equipment Yard',
        roomOrBay: 'Road Maintenance Fleet Section',
        address: { street: 'Radhanpur Cross Road', city: 'Mehsana', state: 'Gujarat', postalCode: '384002' },
        coordinates: { latitude: 23.6000, longitude: 72.3900 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 0,
      },
      {
        siteName: 'Bhavnagar Coastal Infrastructure Depot',
        building: 'Project Engineering Yard',
        roomOrBay: 'Heavy Crane & Piling Staging Yard',
        address: { street: 'Chitra GIDC', city: 'Bhavnagar', state: 'Gujarat', postalCode: '364004' },
        coordinates: { latitude: 21.7645, longitude: 72.1519 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 0,
      },
      {
        siteName: 'Patan Regional Highway Division Yard',
        building: 'Regional Equipment Depot Wing',
        roomOrBay: 'Plant Shed Bay 1',
        address: { street: 'Chanasma Highway', city: 'Patan', state: 'Gujarat', postalCode: '384265' },
        coordinates: { latitude: 23.8493, longitude: 72.1266 },
        siteManager: createdUsers['manager@pravi.gov.in']._id,
        assetCount: 0,
      },
    ];

    const createdLocations = [];
    for (const loc of locationsData) {
      let locDoc = await Location.findOne({ siteName: loc.siteName });
      if (!locDoc) {
        locDoc = await Location.create(loc);
      } else {
        // Update details if needed
        locDoc.building = loc.building;
        locDoc.roomOrBay = loc.roomOrBay;
        locDoc.address = loc.address;
        locDoc.siteManager = loc.siteManager;
        await locDoc.save();
      }
      createdLocations.push(locDoc);
    }
    console.log(`✓ ${createdLocations.length} Real Roads & Buildings Locations verified/seeded in MongoDB`);

    // 3. Assets (Simple, clear equipment names & clean serial numbers)
    const assetsData = [
      {
        assetTag: 'AST-HM-2026-0001',
        name: 'Road Roller',
        category: ASSET_CATEGORIES.HEAVY_MACHINERY,
        make: 'Wirtgen Hamm',
        model: '311 Compactor',
        serialNumber: 'SN-ROL-101',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[2]._id,
        department: 'Highways & Pavements',
        procurement: {
          purchaseCost: 4850000,
          purchaseDate: new Date('2024-03-15'),
          vendor: 'Wirtgen India',
          warrantyExpiryDate: new Date('2026-11-15'),
        },
        specifications: { capacityOrRating: '11 Ton Drum', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[2]._id,
        department: 'Highways & Pavements',
        procurement: {
          purchaseCost: 12500000,
          purchaseDate: new Date('2023-08-20'),
          vendor: 'Vogele India',
          warrantyExpiryDate: new Date('2026-10-20'),
        },
        specifications: { capacityOrRating: '10m Paving Width', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[1]._id,
        department: 'Mechanical Depot',
        procurement: {
          purchaseCost: 3450000,
          purchaseDate: new Date('2022-05-10'),
          vendor: 'JCB India',
        },
        specifications: { capacityOrRating: '1.0 CUM Shovel', powerOrFuelType: 'DIESEL', manufacturingYear: 2022 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[0]._id,
        department: 'Highways & Pavements',
        procurement: {
          purchaseCost: 8500000,
          purchaseDate: new Date('2023-04-18'),
          vendor: 'Caterpillar India',
          warrantyExpiryDate: new Date('2027-04-18'),
        },
        specifications: { capacityOrRating: '14 Ft Moldboard Blade', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[0]._id,
        department: 'Materials Transport',
        procurement: {
          purchaseCost: 3850000,
          purchaseDate: new Date('2024-01-10'),
          vendor: 'Tata Commercial Vehicles',
        },
        specifications: { capacityOrRating: '16 CUM Box Body', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[0]._id,
        department: 'Quality Control & Survey',
        procurement: {
          purchaseCost: 820000,
          purchaseDate: new Date('2025-06-01'),
          vendor: 'Leica India',
          warrantyExpiryDate: new Date('2026-11-05'),
        },
        specifications: { capacityOrRating: '1" Angular Accuracy', powerOrFuelType: 'BATTERY', manufacturingYear: 2025 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[3]._id,
        department: 'Electrical Division',
        procurement: {
          purchaseCost: 1650000,
          purchaseDate: new Date('2023-11-12'),
          vendor: 'Kirloskar Electric',
          amcProvider: 'Kirloskar Care',
          amcExpiryDate: new Date('2026-10-28'),
        },
        specifications: { capacityOrRating: '250 kVA / 200 kW', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
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
        currentLocation: createdLocations[0]._id,
        department: 'Heavy Equipment Depot',
        procurement: {
          purchaseCost: 5200000,
          purchaseDate: new Date('2024-02-14'),
          vendor: 'ACE Heavy Equipment',
          warrantyExpiryDate: new Date('2027-02-14'),
        },
        specifications: { capacityOrRating: '25 Metric Ton Boom', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-HM-2026-0009',
        name: 'Hydraulic Crawler Excavator',
        category: ASSET_CATEGORIES.HEAVY_MACHINERY,
        make: 'Tata Hitachi',
        model: 'EX 200LC Super',
        serialNumber: 'SN-EXC-901',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[2]._id,
        department: 'Earthmoving & Trenching',
        procurement: {
          purchaseCost: 6800000,
          purchaseDate: new Date('2023-09-12'),
          vendor: 'Tata Hitachi Construction Machinery',
          warrantyExpiryDate: new Date('2026-09-12'),
        },
        specifications: { capacityOrRating: '1.2 CUM Heavy Duty Bucket', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-HM-2026-0010',
        name: 'Heavy Wheel Loader',
        category: ASSET_CATEGORIES.HEAVY_MACHINERY,
        make: 'Komatsu',
        model: 'WA200-6',
        serialNumber: 'SN-WLD-1001',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.EXCELLENT,
        currentLocation: createdLocations[1]._id,
        department: 'Materials & Aggregate Depot',
        procurement: {
          purchaseCost: 7400000,
          purchaseDate: new Date('2024-05-20'),
          vendor: 'L&T Construction Equipment',
          warrantyExpiryDate: new Date('2027-05-20'),
        },
        specifications: { capacityOrRating: '2.0 CUM Bucket Capacity', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-HM-2026-0011',
        name: 'Concrete Transit Mixer',
        category: ASSET_CATEGORIES.HEAVY_MACHINERY,
        make: 'Schwing Stetter',
        model: 'AM 7 FHC',
        serialNumber: 'SN-MIX-1101',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[3]._id,
        department: 'Concrete Batching & Pavements',
        procurement: {
          purchaseCost: 4600000,
          purchaseDate: new Date('2023-10-05'),
          vendor: 'Schwing Stetter India',
          warrantyExpiryDate: new Date('2026-10-05'),
        },
        specifications: { capacityOrRating: '7 CUM Mixing Drum', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-FV-2026-0012',
        name: 'Water Tanker Truck',
        category: ASSET_CATEGORIES.FLEET_VEHICLE,
        make: 'Ashok Leyland',
        model: 'Ecomet 1615',
        serialNumber: 'SN-TNK-1201',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[2]._id,
        department: 'Environmental & Dust Control',
        procurement: {
          purchaseCost: 2900000,
          purchaseDate: new Date('2024-04-10'),
          vendor: 'Ashok Leyland Commercial',
          warrantyExpiryDate: new Date('2027-04-10'),
        },
        specifications: { capacityOrRating: '12,000 Litres Sprinkler Tank', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-FV-2026-0013',
        name: 'Highway Patrol & Inspection SUV',
        category: ASSET_CATEGORIES.FLEET_VEHICLE,
        make: 'Mahindra',
        model: 'Scorpio-N 4x4',
        serialNumber: 'SN-SUV-1301',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.EXCELLENT,
        currentLocation: createdLocations[0]._id,
        department: 'Executive Engineering Wing',
        procurement: {
          purchaseCost: 2150000,
          purchaseDate: new Date('2024-08-01'),
          vendor: 'Mahindra Automotive',
          warrantyExpiryDate: new Date('2027-08-01'),
        },
        specifications: { capacityOrRating: '2.2L mHawk Diesel 4x4', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-TA-2026-0014',
        name: 'Asphalt Pavement Core Drill Rig',
        category: ASSET_CATEGORIES.TOOLS_AND_APPARATUS,
        make: 'Hilti',
        model: 'DD 250 Heavy Core',
        serialNumber: 'SN-DRL-1401',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[0]._id,
        department: 'Quality Control Laboratory',
        procurement: {
          purchaseCost: 450000,
          purchaseDate: new Date('2023-11-28'),
          vendor: 'Hilti India',
          warrantyExpiryDate: new Date('2025-11-28'),
        },
        specifications: { capacityOrRating: '12-450mm Core Diameter', powerOrFuelType: 'ELECTRIC', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-TA-2026-0015',
        name: 'Digital Nuclear Moisture & Density Gauge',
        category: ASSET_CATEGORIES.TOOLS_AND_APPARATUS,
        make: 'Troxler',
        model: '3440 Plus RoadReader',
        serialNumber: 'SN-DNT-1501',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[0]._id,
        department: 'Quality Control Laboratory',
        procurement: {
          purchaseCost: 980000,
          purchaseDate: new Date('2024-01-15'),
          vendor: 'Troxler Electronic Labs',
          warrantyExpiryDate: new Date('2026-01-15'),
        },
        specifications: { capacityOrRating: 'AERB Certified Gamma Sensor', powerOrFuelType: 'BATTERY', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-EL-2026-0016',
        name: 'Mobile High-Mast Floodlight Tower',
        category: ASSET_CATEGORIES.ELECTRICAL_EQUIPMENT,
        make: 'Doosan Portable Power',
        model: 'LSC 9M Light Tower',
        serialNumber: 'SN-LGT-1601',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[2]._id,
        department: 'Night Paving Operations',
        procurement: {
          purchaseCost: 850000,
          purchaseDate: new Date('2023-12-05'),
          vendor: 'Doosan India',
          warrantyExpiryDate: new Date('2025-12-05'),
        },
        specifications: { capacityOrRating: '4 x 1000W Metal Halide, 9m Mast', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-EL-2026-0017',
        name: 'Industrial Rotary Screw Air Compressor',
        category: ASSET_CATEGORIES.ELECTRICAL_EQUIPMENT,
        make: 'Atlas Copco',
        model: 'XAS 186 Dd',
        serialNumber: 'SN-CMP-1701',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[1]._id,
        department: 'Mechanical Depot & Jackhammers',
        procurement: {
          purchaseCost: 1450000,
          purchaseDate: new Date('2022-08-15'),
          vendor: 'Atlas Copco Mining & Construction',
          warrantyExpiryDate: new Date('2024-08-15'),
        },
        specifications: { capacityOrRating: '400 CFM / 100 PSI', powerOrFuelType: 'DIESEL', manufacturingYear: 2022 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-HV-2026-0018',
        name: 'Central VRF Air Conditioning Plant',
        category: ASSET_CATEGORIES.HVAC_AND_FACILITIES,
        make: 'Daikin',
        model: 'VRV IV 40HP Multi-Split',
        serialNumber: 'SN-HVAC-1801',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[0]._id,
        department: 'Nirman Bhavan Facility Engineering',
        procurement: {
          purchaseCost: 3200000,
          purchaseDate: new Date('2022-03-20'),
          vendor: 'Daikin Airconditioning India',
          amcProvider: 'Daikin Authorized Service',
          amcExpiryDate: new Date('2026-03-20'),
        },
        specifications: { capacityOrRating: '40 HP / 112 kW Cooling', powerOrFuelType: 'ELECTRIC', manufacturingYear: 2022 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-HV-2026-0019',
        name: 'Emergency Main Fire Hydrant Pump Set',
        category: ASSET_CATEGORIES.HVAC_AND_FACILITIES,
        make: 'Kirloskar Brothers',
        model: 'FirePak 1800 GPM',
        serialNumber: 'SN-FIR-1901',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.EXCELLENT,
        currentLocation: createdLocations[0]._id,
        department: 'Fire & Life Safety Wing',
        procurement: {
          purchaseCost: 1850000,
          purchaseDate: new Date('2024-06-18'),
          vendor: 'Kirloskar Brothers Limited',
          warrantyExpiryDate: new Date('2027-06-18'),
        },
        specifications: { capacityOrRating: '1800 GPM @ 10.5 Bar', powerOrFuelType: 'DIESEL', manufacturingYear: 2024 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
      {
        assetTag: 'AST-WH-2026-0020',
        name: 'Heavy Diesel Forklift Truck',
        category: ASSET_CATEGORIES.WAREHOUSE_EQUIPMENT,
        make: 'Godrej Material Handling',
        model: 'GX 500 Diesel Forklift',
        serialNumber: 'SN-FLT-2001',
        status: ASSET_STATUS.IN_USE,
        physicalCondition: PHYSICAL_CONDITIONS.GOOD,
        currentLocation: createdLocations[1]._id,
        department: 'Central Spares Warehouse & Storage',
        procurement: {
          purchaseCost: 1950000,
          purchaseDate: new Date('2023-11-10'),
          vendor: 'Godrej & Boyce Mfg',
          warrantyExpiryDate: new Date('2025-11-10'),
        },
        specifications: { capacityOrRating: '5.0 Ton Rated Capacity @ 500mm LC', powerOrFuelType: 'DIESEL', manufacturingYear: 2023 },
        createdBy: createdUsers['admin@pravi.gov.in']._id,
      },
    ];

    const seededAssets = {};
    for (const a of assetsData) {
      let assetDoc = await Asset.findOne({ assetTag: a.assetTag });
      if (!assetDoc) {
        assetDoc = await Asset.create(a);
      } else {
        assetDoc.name = a.name;
        assetDoc.make = a.make;
        assetDoc.model = a.model;
        assetDoc.serialNumber = a.serialNumber;
        await assetDoc.save();
      }
      seededAssets[a.assetTag] = assetDoc;
    }
    console.log('✓ Physical assets verified/created');

    // 4. Real Inter-Facility Transfer (Gate Pass)
    const existingTransfer = await Transfer.findOne({ transferNumber: 'TR-2026-0001' });
    if (!existingTransfer && seededAssets['AST-FV-2026-0005']) {
      await Transfer.create({
        transferNumber: 'TR-2026-0001',
        asset: seededAssets['AST-FV-2026-0005']._id,
        fromLocation: createdLocations[0]._id, // Ahmedabad
        toLocation: createdLocations[2]._id,   // NH-48 Project Camp
        gatePassType: 'RETURNABLE',
        carrierName: 'Gujarat Road Infrastructure Logistics',
        vehicleNumber: 'GJ-01-CZ-8819',
        driverName: 'Rameshwar Yadav',
        driverContact: '+91 98250 11234',
        reason: 'Hauling road sub-base aggregate for NH-48 widening work order #882',
        status: 'DISPATCHED',
        requestedBy: createdUsers['manager@pravi.gov.in']._id,
        approvedBy: createdUsers['admin@pravi.gov.in']._id,
        approvedAt: new Date(Date.now() - 3600000 * 6),
        dispatchedAt: new Date(Date.now() - 3600000 * 2),
      });
      console.log('✓ Real Gate Pass Transfer verified/created');
    }

    // 5. Real Maintenance Work Orders with realistic activity logs
    const adminUser = createdUsers['admin@pravi.gov.in'];
    const managerUser = createdUsers['manager@pravi.gov.in'];
    const techUser = createdUsers['tech@pravi.gov.in'];
    const empUser = createdUsers['employee@pravi.gov.in'];

    const sampleTickets = [
      // ── OPEN Status (2 tickets) ─────────────────
      {
        ticketNumber: 'MNT-2026-0003',
        assetTag: 'AST-EL-2026-0007',
        type: 'PREVENTIVE_SCHEDULED',
        priority: 'MEDIUM',
        status: 'OPEN',
        issueTitle: 'Quarterly 500-Hour Scheduled Service',
        issueDescription: 'Quarterly scheduled preventive service: coolant flush, radiator fin cleaning, alternator check and lube filter replacement.',
        meterReadingAtService: 1840,
        laborCost: 0, partsCost: 0, totalCost: 0, replacedParts: [],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Raising this preventive service ticket as per our Q3 scheduled maintenance calendar. Generator at 1840 operating hours — due for 500-hr service.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 6) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Acknowledged. Please schedule this with M. S. Solanki for this Friday. Generator should not be taken offline on a project day — coordinate with site office first.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 4) },
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Confirmed with Solanki Sir. Friday 8:00 AM service slot booked. Site standby DG will cover outage window.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 2) },
        ],
      },
      {
        ticketNumber: 'MNT-2026-0007',
        assetTag: 'AST-HM-2026-0001',
        type: 'INSPECTION',
        priority: 'HIGH',
        status: 'OPEN',
        issueTitle: 'Pre-Monsoon Structural Integrity Inspection',
        issueDescription: 'Mandatory pre-monsoon inspection of road roller drum welds, vibration bearing housing and compaction ring clearances before NH-48 wet season stoppage.',
        meterReadingAtService: 5640,
        laborCost: 0, partsCost: 0, totalCost: 0, replacedParts: [],
        comments: [
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Pre-monsoon inspection is mandatory as per MORTH guidelines. All compaction equipment must be cleared before June 15. Please raise this for Road Roller AST-HM-2026-0001.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 2) },
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Ticket raised Sir. Roller is currently at NH-48 site. Solanki sir says he can inspect on-site this Thursday.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 1) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'I will need the structural inspection checklist from the Quality Control section before I arrive on site. Joshi sahib please send on WhatsApp.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 12) },
        ],
      },

      // ── IN_PROGRESS Status (2 tickets) ──────────
      {
        ticketNumber: 'MNT-2026-0001',
        assetTag: 'AST-HM-2026-0003',
        type: 'BREAKDOWN_REPAIR',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        issueTitle: 'Hydraulic Boom Cylinder Rupture & Seal Leakage',
        issueDescription: 'High-pressure hydraulic boom hose ruptured during subgrade excavation on NH-48 widening sector. Machine is completely non-operational.',
        diagnosis: 'Main cylinder piston seal degradation and high-pressure hose burst under continuous heavy digging load.',
        actionTaken: 'Disassembled boom cylinder assembly, replaced seals, fitted reinforced hydraulic hose and replenished fluid.',
        meterReadingAtService: 3420,
        laborCost: 5500, partsCost: 23000, totalCost: 28500,
        replacedParts: [
          { partName: 'Boom Cylinder Seal Kit', partNumber: 'JCB-SK-991', quantity: 1, unitCost: 14500, totalCost: 14500 },
          { partName: 'Hydraulic Return Hose (4-wire)', partNumber: 'HYD-H400', quantity: 1, unitCost: 8500, totalCost: 8500 },
        ],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'URGENT: JCB 3DX completely stopped working at NH-48 site Km 24. Hydraulic oil spraying from boom. Raised emergency ticket. Operator has parked machine safely off road.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 3) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'CRITICAL — This machine was scheduled for pile boring today. Solanki, drop everything and go to site immediately. I am calling JCB dealer as well for spare parts.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 3 + 3600000) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Reached site. Boom hose has burst completely at the elbow joint. Cylinder seals also gone. Worst case. Will need JCB-SK-991 seal kit and 4-wire hose assembly. Cannot repair on-site — towing to workshop.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 2) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Arranged towing. Parts have been ordered from Jayendra JCB, Rajkot — should arrive tomorrow morning. Keep me updated every 4 hours Solanki.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 2 + 3600000) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Parts received this morning. Workshop repair started at 7:30 AM. Cylinder disassembled, new seals fitted. Awaiting hydraulic pressure test before returning to field.', type: 'PARTS_UPDATE', createdAt: new Date(Date.now() - 86400000 * 1) },
        ],
      },
      {
        ticketNumber: 'MNT-2026-0008',
        assetTag: 'AST-HM-2026-0005',
        type: 'BREAKDOWN_REPAIR',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        issueTitle: 'Motor Grader Blade Angle Cylinder Not Responding',
        issueDescription: 'Left moldboard blade angle cylinder has seized during grading operations on MDR-85 road. Blade is locked at fixed angle, making grading impossible.',
        diagnosis: 'Cylinder piston rod corroded due to water ingress in boot seal. Internal rust causing piston to seize.',
        actionTaken: 'Cylinder removed. Cleaning and honing of piston bore in progress. New boot seal and O-ring set ordered.',
        meterReadingAtService: 7120,
        laborCost: 4200, partsCost: 0, totalCost: 4200, replacedParts: [],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Motor Grader operator Bharat Bhai is reporting that left blade cylinder is not moving. The machine is stuck in fixed blade position. Grading work stopped at MDR-85.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 2) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Inspected. Piston rod is seized — looks like the boot seal was torn and rainwater got into the cylinder bore. Rod has surface rust. Need to hone the bore and replace boot seal set.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 1) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'OK Solanki. MDR-85 contractor needs the grader urgently — he has 3 km of sub-grade pending. Can we get a quick fix done or arrange a hire grader from Vadodara circle?', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 20) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Boot seal set ordered from Bharat Equipment, Ahmedabad. Will arrive in 2 days. Honing of bore is complete. Machine should be ready in 2.5 days Sir.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 8) },
        ],
      },

      // ── WAITING_FOR_PARTS Status (2 tickets) ────
      {
        ticketNumber: 'MNT-2026-0002',
        assetTag: 'AST-HM-2026-0002',
        type: 'BREAKDOWN_REPAIR',
        priority: 'HIGH',
        status: 'WAITING_FOR_PARTS',
        issueTitle: 'Screed Heating Element Voltage Trip',
        issueDescription: 'Left-side screed heating circuit trips during bituminous surface layering. Temperature below paving spec (>140°C required).',
        diagnosis: 'Heating element internal resistance burned out due to field generator voltage fluctuation.',
        actionTaken: 'Isolated left heating rail. Requisitioned OEM replacement heating rods from authorized Vogele dealer.',
        meterReadingAtService: 2150,
        laborCost: 3500, partsCost: 18000, totalCost: 21500,
        replacedParts: [
          { partName: 'Electric Screed Heating Rod (24V)', partNumber: 'VOG-HT-24', quantity: 2, unitCost: 9000, totalCost: 18000 },
        ],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Asphalt paver screed is not heating on the left side. Paving temperature is only reaching 115°C instead of 145°C. Laying quality is getting affected. Raising ticket urgently.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 5) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'The 24V heating rods on left screed bank have blown due to voltage spike from site generator. I need 2 units of VOG-HT-24 from Vogele authorized dealer. These are specialty items — not in local market.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 4) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'I have contacted M/s Wirtgen India (Vogele dealer), Mumbai. They have the parts in stock and are shipping via overnight courier. PO raised — arrival expected Thursday.', type: 'PARTS_UPDATE', createdAt: new Date(Date.now() - 86400000 * 3) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Sir, courier tracking shows shipment is at Mumbai hub. Estimated delivery Friday morning. I am ready to install as soon as parts arrive — 4 hour job max.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 1) },
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Sir we are losing 200 square meters of paving per day. Can we use right-side screed only at reduced width meanwhile?', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 10) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Yes Joshi, proceed with 2.5m single-pass for 500m stretch only. Document reduced paving width in field book. Once parts arrive, we resume full 5m width.', type: 'COMMENT', createdAt: new Date(Date.now() - 3600000 * 8) },
        ],
      },
      {
        ticketNumber: 'MNT-2026-0006',
        assetTag: 'AST-FV-2026-0005',
        type: 'BREAKDOWN_REPAIR',
        priority: 'HIGH',
        status: 'WAITING_FOR_PARTS',
        issueTitle: 'Water Tanker Rear Axle Leaf Spring Breakage',
        issueDescription: 'Rear axle main leaf spring has snapped on left side while tanker was driving to water spraying point. Vehicle is parked at site. Water supply to dust suppression has stopped.',
        diagnosis: 'Main parabolic leaf spring second leaf fractured at center bolt due to overload on rough terrain.',
        actionTaken: 'Vehicle towed to Rajkot workshop. Spring assembly removed. Ashok Leyland OEM spring ordered.',
        meterReadingAtService: 89420,
        laborCost: 3800, partsCost: 0, totalCost: 3800, replacedParts: [],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Water tanker GJ-05-BB-2341 has broken down on site road. Rear of vehicle is sitting very low — driver says leaf spring has snapped. Vehicle cannot move. Urgently need help.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 6) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'This tanker is critical for dust suppression on active excavation areas. Arrange towing immediately and raise breakdown ticket. Also arrange bowser hire from Rajkot depot as temporary measure.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 6 + 3600000) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Vehicle towed to workshop. Third leaf of rear parabolic spring has snapped clean. Need Ashok Leyland part number AL-LS-1612 multi-leaf spring assembly. Checking with AL dealer Rajkot.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 5) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'AL dealer does not have the part. They say it has to come from Pune warehouse — 5 to 7 working days. Sir please consider alternate — Janta Auto Spares has a second-quality spring for ₹8,500 if approved.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 4) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'No second-quality parts on government vehicles. Use only OEM. I am escalating to SE office for emergency purchase approval. Parts will come from Pune — Solanki, check every day.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 3) },
        ],
      },

      // ── RESOLVED Status (2 tickets) ─────────────
      {
        ticketNumber: 'MNT-2026-0004',
        assetTag: 'AST-TA-2026-0006',
        type: 'CALIBRATION',
        priority: 'HIGH',
        status: 'RESOLVED',
        issueTitle: 'Annual NABL Optical Collimation Calibration',
        issueDescription: 'Annual NABL accredited optical prism collimation test and horizontal angle accuracy recalibration.',
        diagnosis: 'Horizontal circle collimation error exceeded 3 arc seconds due to transport vibration.',
        actionTaken: 'Recalibrated electronic theodolite sensor and realigned optical plummet to within ±1mm accuracy.',
        meterReadingAtService: 890,
        laborCost: 6000, partsCost: 12000, totalCost: 18000,
        resolutionNotes: 'NABL certificate issued. Realigned optical plummet and prism tracking successfully.',
        replacedParts: [
          { partName: 'Tribrach Optical Plummet Unit', partNumber: 'LCA-PL-02', quantity: 1, unitCost: 12000, totalCost: 12000 },
        ],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'The Digital Survey Station is showing angular discrepancy of about 4-5 arc seconds during road alignment checks on NH-48. Survey results are unreliable. Requesting NABL calibration.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 15) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'This instrument must not be used until NABL calibrated. I will contact Leica India Service Centre, Ahmedabad. Do not use this equipment on any live survey until then — issue written standstill notice to site engineer.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 14) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Calibration appointment confirmed with Leica India, Satellite office. Equipment sent to their lab. Expected return in 7 working days with NABL certificate.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 12) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Equipment returned from Leica lab today. NABL Certificate No. NABL/CAL/2026/1183 issued. Angular error corrected to ±1 arc second. Equipment is fully serviceable.', type: 'RESOLUTION', createdAt: new Date(Date.now() - 86400000 * 5) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Excellent. Update the instrument register and file the NABL certificate in Quality Records file. Instrument can resume field service from tomorrow. Well done Solanki.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 5 + 3600000) },
        ],
      },
      {
        ticketNumber: 'MNT-2026-0009',
        assetTag: 'AST-HM-2026-0004',
        type: 'PREVENTIVE_SCHEDULED',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        issueTitle: '250-Hour Engine Oil & Filter Service',
        issueDescription: '250-hour periodic service for Caterpillar 140M Motor Grader: engine oil change, fuel filter, air cleaner element, and hydraulic oil sample.',
        diagnosis: 'Oil sample analysis showed iron content slightly elevated (42 ppm vs 35 ppm normal). Possible early gear wear.',
        actionTaken: 'All fluids and filters replaced as per CAT SOS schedule. Oil sample sent to CAT dealer for spectrometer analysis.',
        meterReadingAtService: 7250,
        laborCost: 4500, partsCost: 11200, totalCost: 15700,
        resolutionNotes: 'Service completed. CAT oil analysis report pending. Schedule re-oil sample at next 50 hours to monitor iron trend.',
        replacedParts: [
          { partName: 'Engine Oil 15W-40 (20L)', partNumber: 'CAT-EO-15W', quantity: 2, unitCost: 2800, totalCost: 5600 },
          { partName: 'Fuel Filter Primary/Secondary Kit', partNumber: 'CAT-FF-140', quantity: 1, unitCost: 3200, totalCost: 3200 },
          { partName: 'Air Cleaner Element', partNumber: 'CAT-AC-140', quantity: 1, unitCost: 2400, totalCost: 2400 },
        ],
        comments: [
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Motor Grader AST-HM-2026-0004 is approaching 250 hours. Raising scheduled service ticket as per OEM service schedule.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 10) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Approved. Schedule for weekend so it does not affect MDR-85 grading progress. Make sure you take an oil sample for SOS analysis — last reading showed slight iron trend.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 9) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Service completed Saturday. All filters replaced. Oil sample bottled and labeled — sending to CAT dealer Monday by courier. Iron level in used oil looks normal color-wise.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 3) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Marking as RESOLVED. Machine returned to site Sunday evening. SOS report will come in 2 weeks — will update machine history when received.', type: 'RESOLUTION', createdAt: new Date(Date.now() - 86400000 * 2) },
        ],
      },

      // ── CLOSED Status (3 tickets) ────────────────
      {
        ticketNumber: 'MNT-2026-0005',
        assetTag: 'AST-TA-2026-0006',
        type: 'BREAKDOWN_REPAIR',
        priority: 'MEDIUM',
        status: 'CLOSED',
        issueTitle: 'Digital Survey Station Display Unit Failure',
        issueDescription: 'The EDM (Electronic Distance Measurement) display showing garbled characters and random resets during field survey operations.',
        diagnosis: 'Display controller board failed due to moisture ingress through cracked rear housing gasket.',
        actionTaken: 'Replaced display PCB and re-sealed housing with new silicone gasket. Field tested in humid conditions.',
        meterReadingAtService: 740,
        laborCost: 2500, partsCost: 8500, totalCost: 11000,
        resolutionNotes: 'Display fully functional. Humidity seal tested. No further issues.',
        closingRemarks: 'AE Patel inspected and signed off. Equipment returned to QC lab with updated service sticker.',
        replacedParts: [
          { partName: 'Display Controller PCB (Leica TC407)', partNumber: 'LCA-PCB-407D', quantity: 1, unitCost: 8500, totalCost: 8500 },
        ],
        comments: [
          { author: empUser._id, authorName: empUser.name, authorRole: empUser.role, message: 'Survey instrument screen is showing garbage text. Cannot read measurements. Survey work stopped. This is the second issue in 2 months. Very urgent.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 25) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Display PCB has failed. Moisture damage visible on board. Replacement PCB available at Leica India, Ahmedabad for ₹8,500. Service + gasket kit ₹2,500 extra. Total: ₹11,000.', type: 'STATUS_CHANGE', createdAt: new Date(Date.now() - 86400000 * 24) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Within financial powers — approved. Solanki proceed with repair.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 24 + 3600000) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'Repair completed. New PCB fitted and housing re-sealed. Display working perfectly. Ready for field return.', type: 'RESOLUTION', createdAt: new Date(Date.now() - 86400000 * 20) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'I have physically inspected the instrument. All measurements verified against bench reference. Signing off and closing this ticket. Good work team.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 19) },
        ],
      },
      {
        ticketNumber: 'MNT-2026-0010',
        assetTag: 'AST-HM-2026-0003',
        type: 'PREVENTIVE_SCHEDULED',
        priority: 'LOW',
        status: 'CLOSED',
        issueTitle: 'JCB 3DX 100-Hour A-Service',
        issueDescription: 'Routine 100-hour A-service for JCB backhoe loader: greasing all joints, checking hydraulic fluid levels, torque check of boom pins.',
        diagnosis: 'Boom pin retainer clip on dipper arm slightly loose. All other items within spec.',
        actionTaken: 'All grease points lubricated, retainer clip replaced, hydraulic fluid topped up.',
        meterReadingAtService: 3100,
        laborCost: 1800, partsCost: 600, totalCost: 2400,
        resolutionNotes: 'A-service complete. All items OK. Next 250-hr service due at 3250 hours.',
        closingRemarks: 'Executive Engineer reviewed service log. Ticket closed. Service sticker updated on machine.',
        replacedParts: [
          { partName: 'JCB 3CX Boom Pin Retainer Clip', partNumber: 'JCB-PC-3CX', quantity: 2, unitCost: 300, totalCost: 600 },
        ],
        comments: [
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'JCB 3DX reached 3100 hours — due for 100-hour A-service. Raising ticket as per monthly service schedule.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 20) },
          { author: techUser._id, authorName: techUser.name, authorRole: techUser.role, message: 'A-service completed. Found boom pin retainer clip loose on dipper — replaced 2 clips (₹600). All grease points done. Ready for duty.', type: 'RESOLUTION', createdAt: new Date(Date.now() - 86400000 * 18) },
          { author: managerUser._id, authorName: managerUser.name, authorRole: managerUser.role, message: 'Service log reviewed. Closing ticket. Good catch on the retainer clip — if that had failed, boom pin could have damaged the structure. Proactive work Solanki.', type: 'COMMENT', createdAt: new Date(Date.now() - 86400000 * 17) },
        ],
      },
    ];

    for (const st of sampleTickets) {
      const asset = seededAssets[st.assetTag];
      if (!asset) continue;
      const existing = await Maintenance.findOne({ ticketNumber: st.ticketNumber });
      if (!existing) {
        await Maintenance.create({
          ...st,
          asset: asset._id,
          reportedBy: createdUsers['employee@pravi.gov.in']._id,
          assignedTechnician: createdUsers['tech@pravi.gov.in']._id,
        });
      } else {
        // Add comments if missing
        if ((!existing.comments || existing.comments.length === 0) && st.comments) {
          existing.comments = st.comments;
          await existing.save();
        }
      }
    }
    console.log('✓ Real Maintenance Work Orders verified/created');

    console.log('\n🎉 Roads & Buildings Demo Dataset successfully seeded with real locations & logistics!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedRnBData();
