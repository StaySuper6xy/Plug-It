const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function checkUserShops(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return;
    }

    const shops = await Shop.find({ owner: user._id }).lean();
    console.log(`Shops found for user ${email}:`);
    console.log(JSON.stringify(shops, null, 2));
    console.log(`Total shops: ${shops.length}`);
  } catch (error) {
    console.error('Error checking user shops:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const userEmail = process.argv[2];
if (userEmail) {
  checkUserShops(userEmail).then(() => process.exit(0));
} else {
  console.log('Please provide a user email as an argument');
  process.exit(1);
}