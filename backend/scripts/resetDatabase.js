const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Shop = require('../models/Shop');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function resetDatabase(adminEmail) {
  try {
    // Delete all users except the admin
    const deletedUsers = await User.deleteMany({ email: { $ne: adminEmail } });
    console.log(`Deleted ${deletedUsers.deletedCount} users`);

    // Delete all shops
    const deletedShops = await Shop.deleteMany({});
    console.log(`Deleted ${deletedShops.deletedCount} shops`);

    // Reset the admin user's shops array
    await User.findOneAndUpdate({ email: adminEmail }, { $set: { shops: [] } });
    console.log(`Reset admin user's shops array`);

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const adminEmail = process.argv[2];
if (adminEmail) {
  resetDatabase(adminEmail).then(() => process.exit(0));
} else {
  console.log('Please provide an admin email as an argument');
  process.exit(1);
}