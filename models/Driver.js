const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  iqamaNumber: {
    type: String,
    required: true,
  },
  phone: String,
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  vehiclePlateNumber: String,
  photo: String,
  iqamaPdf: String,
  iqamaPdfType: String,
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

const Driver = mongoose.model('Driver', DriverSchema);

// Drop leftover indexes that might be causing duplicate errors (like email: null)
Driver.collection.dropIndex('email_1').catch(err => {});
Driver.collection.dropIndex('iqamaNumber_1').catch(err => {});

module.exports = Driver;