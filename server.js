// const dotenv = require('dotenv');
// const connectDB = require('./config/db');
// const app = require('./app');

// // Load env vars
// dotenv.config();

// // Connect to database
// connectDB();

// const PORT = process.env.PORT || 5000;

// const server = app.listen(PORT, () => {
//   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//   console.log(`Error: ${err.message}`);
//   // Close server & exit process
//   server.close(() => process.exit(1));
// });



const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');

dotenv.config();
connectDB();

// Sirf local development ke liye listen karein, Vercel ke liye nahi
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; // Ye line sab se zaroori hai Vercel ke liye