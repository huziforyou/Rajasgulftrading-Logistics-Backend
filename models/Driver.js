const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  iqamaNumber: {
    type: String,
    required: true,
    unique: true,
  },
  phone: String,
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  vehiclePlateNumber: String,
  photo: String,
  status: {
    type: String,
    enum: ['active', 'on_leave', 'suspended', 'inactive'],
    default: 'active',
  },
  licenseExpiry: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Driver', DriverSchema);