const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.split(' ')[1];

  console.log('Received token:', token); // Add this line

  // Check if no token
  if (!token) {
    console.log('No token provided'); // Add this line
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('Token verified, user:', req.user); // Add this line
    next();
  } catch (err) {
    console.error('Token verification failed:', err); // Add this line
    res.status(401).json({ msg: 'Token is not valid' });
  }
};