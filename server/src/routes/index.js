const express = require('express');
const router = express.Router();

// ── Mount all sub-routers ───────────────────
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const locationRoutes = require('./locationRoutes');
const assetRoutes = require('./assetRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const transferRoutes = require('./transferRoutes');
const maintenanceRoutes = require('./maintenanceRoutes');
const dashboardRoutes = require('./dashboardRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/assets', assetRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/transfers', transferRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
