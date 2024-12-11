const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  console.log('Received Authorization header:', authHeader);

  // Extract token (remove 'Bearer ' if present)
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  console.log('Extracted token:', token);

  // Check if no token
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('Token verified successfully');
    console.log('Decoded user:', req.user);
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};