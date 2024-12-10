const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function updateUserRole(email) {
  try {
    const result = await User.findOneAndUpdate(
      { email: email },
      { $set: { role: 'vendor' } },
      { new: true }
    );
    if (result) {
      console.log('User role updated successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await mongoose.connection.close();
  }
}

const userEmail = process.argv[2];
if (userEmail) {
  updateUserRole(userEmail).then(() => process.exit(0));
} else {
  console.log('Please provide a user email as an argument');
  process.exit(1);
}