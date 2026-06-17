const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Session } = require('../models');

/**
 * Verifies the JWT from the Authorization header and attaches
 * `req.user` (decoded payload) and `req.userRecord` (DB row).
 * If the user is banned the request is rejected immediately.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Validate token structure
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check session is still valid (not logged out / invalidated)
    const session = await Session.findOne({
      where: { token, is_valid: true },
    });
    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expired or invalidated' });
    }

    // Fetch user from DB
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    // Ban enforcement – kills session immediately
    if (user.is_banned) {
      await session.update({ is_valid: false });
      return res.status(403).json({ success: false, error: 'Your account has been banned' });
    }

    req.user = decoded;
    req.userRecord = user;
    req.session = session;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    next(err);
  }
}

/** Require the authenticated user to have one of the given roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
