require('dotenv').config();
console.log('Email configuration:', {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  user: process.env.EMAIL_USER,
  from: process.env.EMAIL_FROM
});
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const helmet = require('helmet');

const app = express();

// Generate a consistent encryption key
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default-secret', 'salt', 32);
global.ENCRYPTION_KEY = ENCRYPTION_KEY;

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
app.use(helmet());

const uploadsPath = path.join(__dirname, 'public', 'uploads');
// Serve static files from the uploads directory
app.use('/public/uploads', express.static(uploadsPath, { maxAge: '1d' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), { maxAge: '1d' }));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? '[REDACTED]' : 'Not set');
  console.log('JWT Secret:', process.env.JWT_SECRET ? '[REDACTED]' : 'Not set');
  console.log('Encryption Key:', ENCRYPTION_KEY ? '[GENERATED]' : 'Not set');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});
