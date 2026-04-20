const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['super-admin', 'admin', 'viewer', 'vendor', 'driver'],
    default: 'vendor',
  },
  driverProfile: {
    type: mongoose.Schema.ObjectId,
    ref: 'Driver'
  },
  permissions: {
    viewVendors: { type: Boolean, default: true },
    viewDrivers: { type: Boolean, default: true },
    createDispatch: { type: Boolean, default: false },
    editDispatch: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false }
  },
  active: { type: Boolean, default: true, select: false },
}, {
  timestamps: true,
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords...');
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  console.log('Match result:', isMatch);
  return isMatch;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
