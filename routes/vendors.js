const express = require('express');
const router = express.Router();
const { 
  getVendors, 
  getVendor, 
  createVendor, 
  updateVendor, 
  deleteVendor 
} = require('../controllers/vendors');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getVendors)
  .post(authorize('admin', 'super-admin'), createVendor);

router.route('/:id')
  .get(getVendor)
  .put(authorize('admin', 'super-admin'), updateVendor)
  .delete(authorize('admin', 'super-admin'), deleteVendor);

module.exports = router;
