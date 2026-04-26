const DispatchOrder = require('../models/DispatchOrder');
const Vendor = require('../models/Vendor');
const Driver = require('../models/Driver');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalDispatches = await DispatchOrder.countDocuments();
    const activeJobs = await DispatchOrder.countDocuments({ status: { $in: ['Picked Up', 'In Transit'] } });
    const completedDeliveries = await DispatchOrder.countDocuments({ status: 'Delivered' });
    const pendingDispatches = await DispatchOrder.countDocuments({ status: 'Pending' });
    const totalVendors = await Vendor.countDocuments();
    const totalDrivers = await Driver.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalDispatches,
        activeJobs,
        completedDeliveries,
        pendingDispatches,
        totalVendors,
        totalDrivers,
        trends: {
          growth: '+15%',
          efficiency: '+12%'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor reports
// @route   GET /api/reports/vendors
// @access  Private/Admin
exports.getVendorReports = async (req, res, next) => {
  try {
    const vendorStats = await DispatchOrder.aggregate([
      {
        $group: {
          _id: '$assignedVendor',
          count: { $sum: 1 },
          lastDispatch: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      { $unwind: '$vendorInfo' },
      {
        $project: {
          name: '$vendorInfo.name',
          count: 1,
          lastDispatch: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ success: true, data: vendorStats });
  } catch (error) {
    next(error);
  }
};

// @desc    Get driver reports
// @route   GET /api/reports/drivers
// @access  Private/Admin
exports.getDriverReports = async (req, res, next) => {
  try {
    const driverStats = await DispatchOrder.aggregate([
      {
        $group: {
          _id: '$assignedDriver',
          count: { $sum: 1 },
          lastVehicle: { $first: '$vehiclePlateNumber' }
        }
      },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: '_id',
          as: 'driverInfo'
        }
      },
      { $unwind: '$driverInfo' },
      {
        $project: {
          name: '$driverInfo.name',
          count: 1,
          lastVehicle: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({ success: true, data: driverStats });
  } catch (error) {
    next(error);
  }
};
