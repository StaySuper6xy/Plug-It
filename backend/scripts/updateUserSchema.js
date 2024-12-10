const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function updateUsers() {
  try {
    const result = await User.updateMany(
      { shops: { $exists: false } },
      { $set: { shops: [] } }
    );
    console.log(`Updated ${result.nModified} users`);
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await mongoose.connection.close();
  }
}

updateUsers().then(() => process.exit(0));