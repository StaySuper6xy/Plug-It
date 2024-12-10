const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function updateUserAndStandardizeShop(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return;
    }

    const shop = await Shop.findOne({ owner: user._id });
    if (!shop) {
      console.log('Shop not found for this user');
      return;
    }

    // Update user
    user.shops = user.shops || [];
    if (!user.shops.includes(shop._id)) {
      user.shops.push(shop._id);
    }
    await user.save();
    console.log('Updated user shops:', user.shops);

    // Standardize shop
    shop.location = {
      type: 'Point',
      coordinates: [shop.longitude || 0, shop.latitude || 0]
    };
    shop.createdAt = shop.date;
    shop.updatedAt = new Date();

    // Remove old fields
    shop.latitude = undefined;
    shop.longitude = undefined;
    shop.date = undefined;

    await shop.save();

    console.log('User updated:');
    console.log(JSON.stringify(user.toObject(), null, 2));
    console.log('Shop standardized:');
    console.log(JSON.stringify(shop.toObject(), null, 2));
  } catch (error) {
    console.error('Error updating user and standardizing shop:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const userEmail = process.argv[2];
if (userEmail) {
  updateUserAndStandardizeShop(userEmail).then(() => process.exit(0));
} else {
  console.log('Please provide a user email as an argument');
  process.exit(1);
}