const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const errorHandler = require('../middleware/error');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const app = express();

// 1. Basic Routes (Favicon fix)
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 2. CORS
app.use(cors({
  origin: ['https://rajasgulftrading-logistics.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. DB Middleware
const connectToDatabase = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB Error:', err.message);
    next();
  }
};
app.use(connectToDatabase);

// 4. Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// 5. Routes
const authRoutes = require('../routes/auth');
const dispatchRoutes = require('../routes/dispatch');
const userRoutes = require('../routes/users');
const reportRoutes = require('../routes/reports');
const vendorRoutes = require('../routes/vendors');
const driverRoutes = require('../routes/drivers');
const vehicleRoutes = require('../routes/vehicles');

app.use('/api/auth', authRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Rajas Gulf Trading API is running' });
});

app.use(errorHandler);

module.exports = app;
