require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();

// Photo Reference
app.use(express.static('public'));

// Generate a consistent encryption key
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default-secret', 'salt', 32);
global.ENCRYPTION_KEY = ENCRYPTION_KEY;

// Connect Database
connectDB();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};

// Init Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the public/uploads directory
const uploadsPath = path.join(__dirname, 'public', 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/public/uploads', express.static(uploadsPath));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? '[REDACTED]' : 'Not set');
  console.log('JWT Secret:', process.env.JWT_SECRET ? '[REDACTED]' : 'Not set');
  console.log('Encryption Key:', ENCRYPTION_KEY ? '[GENERATED]' : 'Not set');
  console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).send('Something went wrong!');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});
