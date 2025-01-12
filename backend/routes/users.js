const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');
const Shop = require('../models/Shop');
const { authenticateToken } = require('../middleware/auth');
const { generateKeyPair, encryptMessage } = require('../utils/encryption');

// @route   POST api/users
// @desc    Register a user
// @access  Public
router.post(
  '/',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Generate key pair for the user
      const { publicKey, privateKey } = generateKeyPair();

      user = new User({
        username,
        email,
        password,
        publicKey,
        encryptedPrivateKey: encryptMessage(privateKey, publicKey) // Encrypt private key with public key
      });

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '24h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, privateKey }); // Send back the token and unencrypted private key
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('shops', 'name _id');
    
    const shops = await Shop.find({ owner: req.user.id });
    
    const userData = user.toObject();
    userData.shops = shops;

    console.log('User data being sent from backend:', userData);
    res.json(userData);
  } catch (err) {
    console.error('Error in /me route:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/role
// @desc    Update user role
// @access  Private
router.put('/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Catch-all route for debugging
router.all('*', (req, res) => {
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found in users.js' });
});

module.exports = router;
