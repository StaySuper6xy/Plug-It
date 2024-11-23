const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//<CREDENTIALS>@'));

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
    // Instead of exiting, we'll throw the error to be handled in server.js
    throw err;
  }
};

module.exports = connectDB;
