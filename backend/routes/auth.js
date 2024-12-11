const express = require('express');
const router = express.Router();
const { register, login, getUser, forgotPassword, resetPassword } = require('../controllers/AuthController');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get user data
router.get('/user', auth, getUser);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;