const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * Middleware to authenticate requests using JWT
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_dev';
    const decoded = jwt.verify(token, jwtSecret);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Authentication token has expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid authentication token.' });
  }
}

/**
 * Optional token extraction middleware (does not reject unauthenticated requests)
 */
async function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_dev';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await UserModel.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid optional tokens
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalToken
};
