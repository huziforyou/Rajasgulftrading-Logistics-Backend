const express = require('express');
const { 
  getDispatchOrders, 
  getDispatchOrder, 
  createDispatchOrder, 
  updateDispatchOrder, 
  deleteDispatchOrder 
} = require('../controllers/dispatch');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDispatchOrders)
  .post(authorize('admin', 'super-admin'), createDispatchOrder);

router.route('/:id')
  .get(getDispatchOrder)
  .put(updateDispatchOrder)
  .delete(authorize('admin', 'super-admin'), deleteDispatchOrder);

module.exports = router;
