const express = require('express');
const router = express.Router();
const { getDashboardStats, getVendorReports, getDriverReports } = require('../controllers/reports');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/vendors', authorize('admin', 'super-admin'), getVendorReports);
router.get('/drivers', authorize('admin', 'super-admin'), getDriverReports);

module.exports = router;