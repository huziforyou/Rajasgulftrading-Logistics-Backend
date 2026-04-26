// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// const path = require('path');
// const errorHandler = require('./middleware/error');
// const connectDB = require('./config/db');

// // Connect to Database
// const startConnection = async () => {
//   try {
//     await connectDB();
//   } catch (err) {
//     console.error('Initial database connection failed', err);
//   }
// };
// startConnection();

// const app = express();

// // 1. CORS Configuration (MUST BE FIRST)
// app.use(cors({
//   origin: ['https://rajasgulftrading-logistics.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Request Logger
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   next();
// });

// // Security Middleware (Disabled for now)
// // app.use(helmet(...));

// // Body Parser
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(morgan('dev'));

// // Rate Limiting (DISABLED for testing)
// // const limiter = rateLimit({ ... });

// // Serve static files from uploads
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Routes
// const authRoutes = require('./routes/auth');
// const dispatchRoutes = require('./routes/dispatch');
// const userRoutes = require('./routes/users');
// const reportRoutes = require('./routes/reports');
// const vendorRoutes = require('./routes/vendors');
// const driverRoutes = require('./routes/drivers');
// const vehicleRoutes = require('./routes/vehicles');

// app.use('/api/auth', authRoutes);
// app.use('/api/dispatch', dispatchRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/vendors', vendorRoutes);
// app.use('/api/drivers', driverRoutes);
// app.use('/api/vehicles', vehicleRoutes);

// // Root endpoint
// app.get('/', (req, res) => {
//   res.json({ message: 'Welcome to Smart Vendor Dispatch Portal API' });
// });

// // Error Handling Middleware
// app.use(errorHandler);

// module.exports = app;



const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose'); // Add this
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');

const app = express();

// 1. Vercel Database Connection Middleware
// Ye har request par check karega ke DB connected hai ya nahi
const connectToDatabase = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return next();
    }
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
};

// 2. CORS Configuration (MUST BE FIRST)
app.use(cors({
  origin: ['https://rajasgulftrading-logistics.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Apply DB connection to all routes
app.use(connectToDatabase);

// Body Parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Favicon Fix (Stop 500 error on favicon request)
app.get('/favicon.ico', (req, res) => res.status(204).end());

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