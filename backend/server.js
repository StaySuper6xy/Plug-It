require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();

// Generate a consistent encryption key
const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default-secret', 'salt', 32);
global.ENCRYPTION_KEY = ENCRYPTION_KEY;

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Serve static files
const uploadsPath = path.join(__dirname, 'public', 'uploads');
app.use('/public/uploads', express.static(uploadsPath, { maxAge: '1d' }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), { maxAge: '1d' }));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? '[REDACTED]' : 'Not set');
  console.log('JWT Secret:', process.env.JWT_SECRET ? '[REDACTED]' : 'Not set');
  console.log('Encryption Key:', ENCRYPTION_KEY ? '[GENERATED]' : 'Not set');
  console.log('Email configuration:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM
  });
});

module.exports = app;
