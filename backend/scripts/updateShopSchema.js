const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.set('strictQuery', false);  // Add this line to suppress the deprecation warning

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function updateShops() {
  try {
    const result = await Shop.updateMany(
      { products: { $exists: false } },
      { 
        $set: { 
          products: [],
          location: {
            type: 'Point',
            coordinates: [0, 0]
          }
        },
        $rename: {
          latitude: 'location.coordinates.1',
          longitude: 'location.coordinates.0'
        }
      }
    );
    console.log(`Updated ${result.modifiedCount} shops`);
  } catch (error) {
    console.error('Error updating shops:', error);
  } finally {
    await mongoose.connection.close();
  }
}

updateShops().then(() => process.exit(0));