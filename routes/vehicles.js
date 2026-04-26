const express = require('express');
const router = express.Router();
const { 
  getVehicles, 
  getVehicle, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle 
} = require('../controllers/vehicles');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getVehicles)
  .post(authorize('admin', 'super-admin'), createVehicle);

router.route('/:id')
  .get(getVehicle)
  .put(authorize('admin', 'super-admin'), updateVehicle)
  .delete(authorize('admin', 'super-admin'), deleteVehicle);

module.exports = router;
