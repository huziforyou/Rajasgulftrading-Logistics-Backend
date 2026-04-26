const DispatchOrder = require('../models/DispatchOrder');
const Driver = require('../models/Driver');
const Vendor = require('../models/Vendor');
const fs = require('fs-extra');
const path = require('path');
const XLSX = require('xlsx');
const pdf = require('pdf-parse');
const { generateDispatchOrderPDF } = require('../utils/pdfHelper');

// @desc    Get dispatch order PDF
// @route   GET /api/dispatch/:id/pdf
// @access  Private
exports.downloadDispatchOrderPDF = async (req, res, next) => {
  try {
    const order = await DispatchOrder.findById(req.params.id)
      .populate('assignedDriver')
      .populate('assignedVendor');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    const pdfBytes = await generateDispatchOrderPDF(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Order_${order.deliveryNoteNumber}.pdf`,
      'Content-Length': pdfBytes.length,
    });

    res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    next(error);
  }
};

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

// @desc    Bulk upload dispatch orders from Excel or PDF
// @route   POST /api/dispatch/bulk-upload
// @access  Private (Admin/Super Admin)
exports.bulkUploadDispatchOrders = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    if (fileExt === '.pdf') {
      // PDF Parsing Logic
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text;

      // Basic heuristic: split by "DN" or "Delivery Note" if it appears multiple times
      // For now, let's try to find patterns in the text
      const dnMatches = text.match(/DN[- ]?Number[: ]*([A-Z0-9-]+)/gi) || [];
      
      if (dnMatches.length > 0) {
        // Try to extract multiple orders if DNs are found
        // This is a simple implementation; real PDF parsing needs more structure
        for (const [index, match] of dnMatches.entries()) {
          const dnNumber = match.split(/[: ]+/).pop();
          data.push({
            deliveryNoteNumber: dnNumber,
            isPDF: true,
            rawText: text // We'll try to extract more from rawText per order if possible
          });
        }
      } else {
        // Just one order or unknown format
        data.push({
          isPDF: true,
          rawText: text
        });
      }
    } else {
      // Excel/CSV Parsing Logic
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    const ordersToCreate = [];

    for (const [index, row] of data.entries()) {
      try {
        let orderData = {};

        if (row.isPDF) {
          // Extract data from PDF text using regex
          const text = row.rawText;
          
          const findField = (patterns) => {
            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match && match[1]) return match[1].trim();
            }
            return null;
          };

          const vendorName = findField([
            /Vendor[: ]*([^\n\r]+)/i, 
            /Supplier[: ]*([^\n\r]+)/i,
            /Vendor Name[: ]*([^\n\r]+)/i,
            /Transport[: ]*([^\n\r]+)/i
          ]);
          
          const driverName = findField([
            /Driver[: ]*([^\n\r]+)/i, 
            /Driver Name[: ]*([^\n\r]+)/i,
            /Driver Details[: ]*([^\n\r]+)/i
          ]);
          
          let vendorId = null;
          if (vendorName) {
            const vendor = await Vendor.findOne({ name: new RegExp(`^${vendorName.toString().trim()}$`, 'i') });
            if (vendor) vendorId = vendor._id;
          }

          let driverId = null;
          if (driverName) {
            const driver = await Driver.findOne({ name: new RegExp(`^${driverName.toString().trim()}$`, 'i') });
            if (driver) driverId = driver._id;
          }

          const loadingDateRaw = findField([
            /Date[: ]*([0-9\-\/]+)/i, 
            /Loading Date[: ]*([0-9\-\/]+)/i,
            /DN Date[: ]*([0-9\-\/]+)/i
          ]);
          
          let loadingDate = new Date().toISOString().split('T')[0];
          if (loadingDateRaw) {
            // Basic date parsing attempt
            const parts = loadingDateRaw.split(/[\-\/]/);
            if (parts.length === 3) {
              // Try to normalize to YYYY-MM-DD
              if (parts[0].length === 4) loadingDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              else if (parts[2].length === 4) loadingDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }

          orderData = {
            loadingDate,
            loadingFrom: findField([/From[: ]*([^\n\r]+)/i, /Loading From[: ]*([^\n\r]+)/i, /Origin[: ]*([^\n\r]+)/i]) || 'N/A',
            offloadingTo: findField([/To[: ]*([^\n\r]+)/i, /Offloading To[: ]*([^\n\r]+)/i, /Destination[: ]*([^\n\r]+)/i]) || 'N/A',
            materialDescription: findField([/Material[: ]*([^\n\r]+)/i, /Description[: ]*([^\n\r]+)/i, /Items[: ]*([^\n\r]+)/i]) || '',
            deliveryNoteNumber: row.deliveryNoteNumber || findField([/DN[: ]*([A-Z0-9-]+)/i, /Delivery Note[: ]*([A-Z0-9-]+)/i, /DN Number[: ]*([A-Z0-9-]+)/i]) || `OLD-PDF-${Date.now()}-${index}`,
            customerName: findField([/Customer[: ]*([^\n\r]+)/i, /Customer Name[: ]*([^\n\r]+)/i, /Client[: ]*([^\n\r]+)/i]) || '',
            customerVAT: findField([/VAT[: ]*([0-9]+)/i, /Customer VAT[: ]*([0-9]+)/i, /VAT Number[: ]*([0-9]+)/i]) || '',
            materialQuantity: findField([/Qty[: ]*([0-9.]+)/i, /Quantity[: ]*([0-9.]+)/i, /Total Qty[: ]*([0-9.]+)/i]) || '0',
            assignedVendor: vendorId,
            assignedDriver: driverId,
            vehiclePlateNumber: findField([/Plate[: ]*([^\n\r]+)/i, /Vehicle[: ]*([^\n\r]+)/i, /Truck[: ]*([^\n\r]+)/i]) || '',
            priority: 'medium',
            notes: 'Bulk uploaded from PDF',
            status: 'Delivered',
            deliveredDate: new Date(loadingDate),
            deliveredTime: '12:00',
            receivedQuantity: findField([/Qty[: ]*([0-9.]+)/i, /Quantity[: ]*([0-9.]+)/i]) || '0',
            quantityStatus: 'Exact',
            quantityDifference: '0',
            createdBy: req.user.id
          };
        } else {
          // Excel Row Parsing (existing logic)
          let vendorId = null;
          const vendorName = row.Vendor || row['Vendor Name'] || row.vendorName;
          if (vendorName) {
            const vendor = await Vendor.findOne({ name: new RegExp(`^${vendorName.toString().trim()}$`, 'i') });
            if (vendor) vendorId = vendor._id;
          }

          let driverId = null;
          const driverName = row.Driver || row['Driver Name'] || row.driverName;
          if (driverName) {
            const driver = await Driver.findOne({ name: new RegExp(`^${driverName.toString().trim()}$`, 'i') });
            if (driver) driverId = driver._id;
          }

          orderData = {
            loadingDate: row['Loading Date'] || row.Date || row.loadingDate || new Date().toISOString().split('T')[0],
            loadingFrom: row['Loading From'] || row.From || row.loadingFrom || 'N/A',
            offloadingTo: row['Offloading To'] || row.To || row.offloadingTo || 'N/A',
            materialDescription: row.Material || row.Description || row.materialDescription || '',
            deliveryNoteNumber: row['DN Number'] || row.DN || row.deliveryNoteNumber || `OLD-${Date.now()}-${index}`,
            customerName: row['Customer Name'] || row.Customer || row.customerName || '',
            customerVAT: row['Customer VAT'] || row.customerVAT || '',
            materialQuantity: row.Quantity || row.Qty || row.materialQuantity || '0',
            assignedVendor: vendorId,
            assignedDriver: driverId,
            vehiclePlateNumber: row['Vehicle Plate'] || row.Plate || row.vehiclePlateNumber || '',
            priority: (row.Priority || row.priority || 'medium').toString().toLowerCase(),
            notes: row.Notes || row.notes || 'Bulk uploaded old data',
            status: 'Delivered',
            deliveredDate: row['Delivered Date'] || row.deliveredDate ? new Date(row['Delivered Date'] || row.deliveredDate) : new Date(),
            deliveredTime: row['Delivered Time'] || row.deliveredTime || '12:00',
            receivedQuantity: row['Received Qty'] || row.receivedQuantity || row.Quantity || row.Qty || row.materialQuantity || '0',
            quantityStatus: row['Qty Status'] || row.quantityStatus || 'Exact',
            quantityDifference: row['Qty Difference'] || row.quantityDifference || '0',
            createdBy: req.user.id
          };
        }

        // Validate required fields
        if (!orderData.assignedVendor || !orderData.assignedDriver) {
          results.failed++;
          results.errors.push(`Row ${index + 1}: Vendor or Driver not found (${(row.Vendor || row['Vendor Name']) || 'N/A'}, ${(row.Driver || row['Driver Name']) || 'N/A'})`);
          continue;
        }

        ordersToCreate.push(orderData);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${err.message}`);
      }
    }

    if (ordersToCreate.length > 0) {
      await DispatchOrder.insertMany(ordersToCreate);
    }

    // Clean up file
    await fs.remove(filePath);

    res.status(200).json({
      success: true,
      data: {
        count: results.success,
        failed: results.failed,
        errors: results.errors
      }
    });
  } catch (error) {
    if (req.file && await fs.pathExists(req.file.path)) {
      await fs.remove(req.file.path);
    }
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

// @desc    Mark dispatch order as Out for Delivery
// @route   PUT /api/dispatch/:id/out-for-delivery
// @access  Private
exports.markOutForDelivery = async (req, res, next) => {
  try {
    const { outForDeliveryDate, outForDeliveryTime } = req.body;
    const order = await DispatchOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    order.status = 'Out for Delivery';
    
    if (outForDeliveryDate && outForDeliveryTime) {
      // Use local date string instead of T separator which might cause issues with different timezones
      const [year, month, day] = outForDeliveryDate.split('-');
      const [hour, min] = outForDeliveryTime.split(':');
      order.outForDeliveryTime = new Date(year, month - 1, day, hour, min);
    } else {
      order.outForDeliveryTime = new Date();
    }
    
    order.updatedBy = req.user.id;

    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark dispatch order as Delivered
// @route   PUT /api/dispatch/:id/delivered
// @access  Private
exports.markDelivered = async (req, res, next) => {
  try {
    const { 
      deliveredDate, 
      deliveredTime, 
      receivedQuantity, 
      quantityStatus, 
      quantityDifference,
      deliveryNotes 
    } = req.body;
    
    const order = await DispatchOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Dispatch order not found' });
    }

    order.status = 'Delivered';
    order.deliveredDate = deliveredDate;
    order.deliveredTime = deliveredTime;
    order.receivedQuantity = receivedQuantity;
    order.quantityStatus = quantityStatus;
    order.quantityDifference = quantityDifference;
    order.deliveryNotes = deliveryNotes;
    order.updatedBy = req.user.id;

    if (req.file) {
      // 1. Convert to Base64 for database storage
      const fileBuffer = await fs.readFile(req.file.path);
      const base64Data = fileBuffer.toString('base64');
      
      order.deliveryNoteData = base64Data;
      order.deliveryNoteType = req.file.mimetype;
      order.deliveryNoteUrl = `/uploads/${req.file.filename}`; // Still keep URL for reference if needed

      // 2. Remove the temporary file from disk (Vercel/Serverless friendly)
      await fs.remove(req.file.path);
    }

    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
