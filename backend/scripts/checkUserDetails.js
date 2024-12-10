const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function checkUserDetails(email) {
  try {
    const user = await User.findOne({ email }).lean();
    if (user) {
      console.log('User details:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking user details:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const userEmail = process.argv[2];
if (userEmail) {
  checkUserDetails(userEmail).then(() => process.exit(0));
} else {
  console.log('Please provide a user email as an argument');
  process.exit(1);
}