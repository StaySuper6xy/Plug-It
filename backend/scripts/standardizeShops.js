const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function standardizeShops() {
  try {
    const result = await Shop.updateMany(
      {},
      {
        $set: {
          address: { $ifNull: ['$address', ''] },
          location: {
            type: 'Point',
            coordinates: [
              { $ifNull: ['$longitude', 0] },
              { $ifNull: ['$latitude', 0] }
            ]
          },
          isPublic: { $ifNull: ['$isPublic', true] },
          products: { $ifNull: ['$products', []] },
          createdAt: { $ifNull: ['$createdAt', '$date'] },
          updatedAt: { $ifNull: ['$updatedAt', new Date()] }
        },
        $unset: {
          date: '',
          latitude: '',
          longitude: '',
          isPrivate: ''
        }
      },
      { multi: true }
    );

    console.log(`Updated ${result.modifiedCount} shops`);

    const shops = await Shop.find().lean();
    console.log('Updated shops:');
    console.log(JSON.stringify(shops, null, 2));
  } catch (error) {
    console.error('Error standardizing shops:', error);
  } finally {
    await mongoose.connection.close();
  }
}

standardizeShops().then(() => process.exit(0));