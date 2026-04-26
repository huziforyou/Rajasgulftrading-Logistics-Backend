const express = require('express');
const { 
  getDispatchOrders, 
  getDispatchOrder, 
  createDispatchOrder, 
  updateDispatchOrder, 
  deleteDispatchOrder,
  markOutForDelivery,
  markDelivered,
  downloadDispatchOrderPDF,
  bulkUploadDispatchOrders
} = require('../controllers/dispatch');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDispatchOrders)
  .post(authorize('admin', 'super-admin'), createDispatchOrder);

router.post('/bulk-upload', authorize('admin', 'super-admin'), upload.single('file'), bulkUploadDispatchOrders);

router.route('/:id')
  .get(getDispatchOrder)
  .put(updateDispatchOrder)
  .delete(authorize('admin', 'super-admin'), deleteDispatchOrder);

router.put('/:id/out-for-delivery', markOutForDelivery);
router.put('/:id/delivered', upload.single('deliveryNote'), markDelivered);
router.get('/:id/pdf', downloadDispatchOrderPDF);

module.exports = router;
