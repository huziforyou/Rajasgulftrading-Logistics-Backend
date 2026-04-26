const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv'); // Add this
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// 1. Basic Routes (DB se pehle taake check ho sake ke app chal rahi hai)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 2. CORS Configuration (MUST BE FIRST)
app.use(cors({
  origin: ['https://rajasgulftrading-logistics.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Vercel Database Connection Middleware
const connectToDatabase = async (req, res, next) => {
  if (!process.env.MONGO_URI) {
    console.error('CRITICAL: MONGO_URI is not defined');
    return next(); // Don't crash, but DB calls will fail later
  }

  try {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connection successful');
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    // Don't block the request if it's not a DB-dependent route
    next();
  }
};

// Apply DB connection to all subsequent routes
app.use(connectToDatabase);

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Favicon Fix (Stop 500 error on favicon request) - Already handled above
// app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes
const authRoutes = require('./routes/auth');
const dispatchRoutes = require('./routes/dispatch');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const vendorRoutes = require('./routes/vendors');
const driverRoutes = require('./routes/drivers');
const vehicleRoutes = require('./routes/vehicles');

app.use('/api/auth', authRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'success',
    message: 'Welcome to Rajas Gulf Trading API',
    db_status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;