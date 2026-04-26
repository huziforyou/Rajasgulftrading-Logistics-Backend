const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
// exports.createUser = async (req, res, next) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Check if user already exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ success: false, error: 'User with this email already exists' });
//     }

//     const user = await User.create({
//       name,
//       email,
//       password,
//       role
//     });

//     // Remove password from response
//     user.password = undefined;

//     res.status(201).json({ success: true, data: user });
//   } catch (error) {
//     next(error);
//   }
// };


exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, permissions } = req.body; // permissions add kiya

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      permissions // Database mein save hoga
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};
// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
// exports.updateUser = async (req, res, next) => {
//   try {
//     const { name, email, role } = req.body;
    
//     const user = await User.findByIdAndUpdate(req.params.id, {
//       name,
//       email,
//       role
//     }, {
//       new: true,
//       runValidators: true
//     }).select('-password');

//     if (!user) {
//       return res.status(404).json({ success: false, error: 'User not found' });
//     }

//     res.status(200).json({ success: true, data: user });
//   } catch (error) {
//     next(error);
//   }
// };

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, permissions } = req.body; // permissions add kiya
    
    const user = await User.findByIdAndUpdate(req.params.id, {
      name,
      email,
      role,
      permissions // Update query mein add kiya
    }, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) { next(error); }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};