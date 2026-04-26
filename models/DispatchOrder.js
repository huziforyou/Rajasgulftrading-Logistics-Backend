const mongoose = require('mongoose');

const dispatchOrderSchema = new mongoose.Schema({
  loadingDate: {
    type: String,
    required: [true, 'Please provide loading date'],
  },
  loadingDateTime: {
    type: Date,
  },
  loadingFrom: {
    type: String,
    required: [true, 'Please provide loading location'],
  },
  offloadingTo: {
    type: String,
    required: [true, 'Please provide offloading location'],
  },
  materialDescription: String,
  deliveryNoteNumber: {
    type: String,
    required: [true, 'Please provide delivery note number'],
  },
  customerName: String,
  customerVAT: String,
  materialQuantity: String,
  assignedDriver: {
    type: mongoose.Schema.ObjectId,
    ref: 'Driver',
    required: [true, 'Please assign a driver'],
  },
  assignedVendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor',
    required: [true, 'Please assign a vendor'],
  },
  vehiclePlateNumber: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: String,
  status: {
    type: String,
    enum: ['Pending', 'Picked Up', 'Out for Delivery', 'In Transit', 'Pending Approval', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  outForDeliveryTime: {
    type: Date
  },
  deliveredDate: {
    type: Date
  },
  deliveredTime: {
    type: String
  },
  deliveryNoteUrl: {
    type: String
  },
  deliveryNoteData: {
    type: String // Store as Base64 string
  },
  deliveryNoteType: {
    type: String // MIME type (e.g., application/pdf)
  },
  receivedQuantity: {
    type: String
  },
  quantityStatus: {
    type: String,
    enum: ['Exact', 'Shortage', 'Excess'],
    default: 'Exact'
  },
  quantityDifference: {
    type: String
  },
  deliveryNotes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

const DispatchOrder = mongoose.model('DispatchOrder', dispatchOrderSchema);

// Drop leftover unique indexes if they exist
DispatchOrder.collection.dropIndex('deliveryNoteNumber_1').catch(err => {});

module.exports = DispatchOrder;
