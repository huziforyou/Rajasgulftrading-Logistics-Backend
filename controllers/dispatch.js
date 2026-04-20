const DispatchOrder = require('../models/DispatchOrder');

// @desc    Get all dispatch orders
// @route   GET /api/dispatch
// @access  Private
exports.getDispatchOrders = async (req, res, next) => {
  try {
    let query;

    // Role & Permission based filtering
    const isAdmin = ['super-admin', 'admin'].includes(req.user.role);
    
    // Explicitly check permissions object and its properties
    const hasCreatePerm = req.user.permissions && req.user.permissions.createDispatch === true;
    const hasEditPerm = req.user.permissions && req.user.permissions.editDispatch === true;
    const hasDispatchPrivileges = hasCreatePerm || hasEditPerm;

    if (isAdmin || hasDispatchPrivileges) {
      // Admins and users with dispatch permissions see everything
      query = DispatchOrder.find();
    } else if (req.user.role === 'vendor' && req.user.vendor) {
      // Vendor users only see their own (only if they have a linked vendor ID)
      query = DispatchOrder.find({ assignedVendor: req.user.vendor });
    } else if (req.user.role === 'driver' && req.user.driverProfile) {
      // Drivers only see their own
      query = DispatchOrder.find({ assignedDriver: req.user.driverProfile });
    } else if (req.user.role === 'viewer') {
      // Viewers see everything
      query = DispatchOrder.find();
    } else {
      // If no specific conditions met, return empty query or limit strictly
      // For a "vendor" role without a linked vendor ID and no extra permissions, 
      // they shouldn't see anything.
      query = DispatchOrder.find({ _id: null }); 
    }

    const orders = await query
      .populate('assignedDriver')
      .populate('assignedVendor')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single dispatch order
// @route   GET /api/dispatch/:id
// @access  Private
exports.getDispatchOrder = async (req, res, next) => {
  try {
    const order = await DispatchOrder.findById(req.params.id)
      .populate('assignedDriver')
      .populate('assignedVendor');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create dispatch order
// @route   POST /api/dispatch
// @access  Private (Admin/Super Admin)
exports.createDispatchOrder = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const order = await DispatchOrder.create(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update dispatch order
// @route   PUT /api/dispatch/:id
// @access  Private
exports.updateDispatchOrder = async (req, res, next) => {
  try {
    req.body.updatedBy = req.user.id;
    const order = await DispatchOrder.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete dispatch order
// @route   DELETE /api/dispatch/:id
// @access  Private (Admin/Super Admin)
exports.deleteDispatchOrder = async (req, res, next) => {
  try {
    const order = await DispatchOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
