const express = require('express');
const router = express.Router();
const { 
  getDrivers, 
  getDriver, 
  createDriver, 
  updateDriver, 
  deleteDriver 
} = require('../controllers/drivers');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getDrivers)
  .post(authorize('admin', 'super-admin'), createDriver);

router.route('/:id')
  .get(getDriver)
  .put(authorize('admin', 'super-admin'), updateDriver)
  .delete(authorize('admin', 'super-admin'), deleteDriver);

module.exports = router;
