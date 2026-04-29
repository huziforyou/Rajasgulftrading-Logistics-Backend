const Vendor = require('../models/Vendor');
const DispatchOrder = require('../models/DispatchOrder');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find();
    
    // Add record counts to each vendor
    const vendorsWithCounts = await Promise.all(vendors.map(async (v) => {
      const recordCount = await DispatchOrder.countDocuments({ assignedVendor: v._id });
      return { ...v.toObject(), recordCount };
    }));

    res.status(200).json({ success: true, count: vendors.length, data: vendorsWithCounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }

    // Fetch records for this vendor
    const records = await DispatchOrder.find({ assignedVendor: vendor._id })
      .populate('assignedDriver', 'name')
      .sort('-createdAt');

    res.status(200).json({ 
      success: true, 
      data: {
        ...vendor.toObject(),
        records
      } 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private/Admin
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private/Admin
exports.updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }

    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private/Admin
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Transporter not found' });
    }

    await vendor.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
