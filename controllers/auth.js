const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    console.log(`Register attempt for: ${email}`);

    // Check if any user exists
    let role = 'vendor';
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      role = 'admin';
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      driverProfile: user.driverProfile,
      permissions: user.permissions,
    },
  });
};
