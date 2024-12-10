const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function listShops() {
  try {
    const shops = await Shop.find().lean();
    console.log('Shops found:');
    console.log(JSON.stringify(shops, null, 2));
    console.log(`Total shops: ${shops.length}`);
  } catch (error) {
    console.error('Error listing shops:', error);
  } finally {
    await mongoose.connection.close();
  }
}

listShops().then(() => process.exit(0));