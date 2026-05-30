const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User, Session } = require('../models');
const logger = require('../utils/logger');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (user.is_banned) {
      return res.status(403).json({ success: false, error: 'Your account has been banned' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Persist session for invalidation on logout / ban
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Session.create({ user_id: user.id, token, expires_at: expiresAt });

    logger.info(`User logged in: ${user.username}`, { role: user.role });

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile_pic_url: user.profile_pic_url,
        isBanned: user.is_banned,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.session) {
      await req.session.update({ is_valid: false });
      logger.info(`Session invalidated for user ${req.user?.username}`);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  const u = req.userRecord;
  res.json({
    success: true,
    data: {
      username: u.username,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      profile_pic_url: u.profile_pic_url,
      isBanned: u.is_banned,
      createdAt: u.created_at,
    },
  });
};
