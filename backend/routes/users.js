const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');
const Shop = require('../models/Shop'); // Add this line to import the Shop model
const auth = require('../middleware/auth');

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

      user = new User({
        username,
        email,
        password,
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
          res.json({ token });
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
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('shops', 'name _id'); // Include _id in the populated shops
    
    // Fetch all shops associated with the user
    const shops = await Shop.find({ owner: req.user.id });
    
    // Combine user data with shops
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
router.put('/role', auth, async (req, res) => {
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

module.exports = router;
