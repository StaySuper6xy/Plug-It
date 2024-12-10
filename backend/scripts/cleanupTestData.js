const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function cleanupTestData() {
  try {
    // Delete all users except for a specific email (replace with your main account email)
    const deletedUsers = await User.deleteMany({ email: { $ne: 'your-main-email@example.com' } });
    console.log(`Deleted ${deletedUsers.deletedCount} test users`);

    // Delete all shops
    const deletedShops = await Shop.deleteMany({});
    console.log(`Deleted ${deletedShops.deletedCount} shops`);

    // Delete all products
    const deletedProducts = await Product.deleteMany({});
    console.log(`Deleted ${deletedProducts.deletedCount} products`);

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupTestData();