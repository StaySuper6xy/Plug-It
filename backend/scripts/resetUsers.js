const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const resetUsers = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Environment variables:');
      console.log(process.env);
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//<CREDENTIALS>@'));

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete all existing users
    const result = await User.deleteMany({});
    console.log(`${result.deletedCount} users deleted`);

    console.log('User reset complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

resetUsers();
