const mongoose = require('mongoose');

const dispatchOrderSchema = new mongoose.Schema({
  loadingDateTime: {
    type: Date,
    required: [true, 'Please provide loading date and time'],
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
    unique: true
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
    enum: ['Pending', 'Picked Up', 'In Transit', 'Pending Approval', 'Delivered', 'Cancelled'],
    default: 'Pending',
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

module.exports = mongoose.model('DispatchOrder', dispatchOrderSchema);
