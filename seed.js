const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear ALL users to ensure a clean state
    await User.deleteMany({});
    console.log('All users cleared from database');

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@portal.com',
      password: 'admin1234',
      role: 'admin',
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@portal.com');
    console.log('Password: admin1234');

    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
