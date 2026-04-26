const Driver = require('../models/Driver');
const DispatchOrder = require('../models/DispatchOrder');
const User = require('../models/User');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find().populate('vendor', 'name');
    
    // Add task counts to each driver
    const driversWithCounts = await Promise.all(drivers.map(async (d) => {
      const taskCount = await DispatchOrder.countDocuments({ assignedDriver: d._id });
      return { ...d.toObject(), taskCount };
    }));

    res.status(200).json({ success: true, count: drivers.length, data: driversWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
exports.getDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id).populate('vendor', 'name');
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Fetch records/tasks for this driver
    const tasks = await DispatchOrder.find({ assignedDriver: driver._id })
      .populate('assignedVendor', 'name')
      .sort('-createdAt');

    res.status(200).json({ 
      success: true, 
      data: {
        ...driver.toObject(),
        tasks
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create driver
// @route   POST /api/drivers
// @access  Private/Admin
exports.createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private/Admin
exports.updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    res.status(200).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
exports.deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await driver.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
