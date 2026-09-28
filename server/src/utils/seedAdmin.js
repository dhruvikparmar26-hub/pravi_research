// ──────────────────────────────────────────────
// Pravi — Admin Seeder
//
// Creates the first Admin user so you can log in
// and start creating other users via the API.
//
// Usage:  node src/utils/seedAdmin.js
// ──────────────────────────────────────────────
const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
const { ROLES } = require('../config/constants');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@pravi.in';

    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('\n  ⚠  Admin user already exists:');
      console.log(`     Email: ${existing.email}`);
      console.log(`     Role:  ${existing.role}\n`);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Pravi Admin',
      email: adminEmail,
      password: 'admin123', // Change this after first login!
      role: ROLES.ADMIN,
      department: 'Administration',
      phone: '',
    });

    console.log('\n  ✓ Admin user created successfully:');
    console.log(`     Name:     ${admin.name}`);
    console.log(`     Email:    ${admin.email}`);
    console.log(`     Password: admin123`);
    console.log(`     Role:     ${admin.role}`);
    console.log('\n  ⚠  Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
