const bcrypt = require('bcryptjs');
const { User, Session } = require('../models');
const logger = require('../utils/logger');

exports.list = async (req, res, next) => {
  try {
    const operators = await User.findAll({
      where: { role: 'OPERATOR' },
      attributes: ['username', 'full_name', 'email', 'role', 'profile_pic_url', 'is_banned', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    res.json({
      success: true,
      data: operators.map((op) => ({
        username: op.username,
        full_name: op.full_name,
        email: op.email,
        role: op.role,
        profile_pic_url: op.profile_pic_url,
        isBanned: op.is_banned,
        createdAt: op.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { username, full_name, email, password, profile_pic_url } = req.body;

    if (!username || !full_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All required fields must be provided' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const operator = await User.create({
      username,
      full_name,
      email,
      password: hash,
      role: 'OPERATOR',
      profile_pic_url: profile_pic_url || null,
      is_banned: false,
    });

    logger.info(`Operator created: ${operator.username}`);

    res.status(201).json({
      success: true,
      data: {
        username: operator.username,
        full_name: operator.full_name,
        email: operator.email,
        role: operator.role,
        profile_pic_url: operator.profile_pic_url,
        isBanned: operator.is_banned,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleBan = async (req, res, next) => {
  try {
    const { username } = req.params;
    const operator = await User.findOne({ where: { username, role: 'OPERATOR' } });
    if (!operator) {
      return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    operator.is_banned = !operator.is_banned;
    await operator.save();

    // Invalidate all active sessions for the banned operator
    if (operator.is_banned) {
      await Session.update(
        { is_valid: false },
        { where: { user_id: operator.id, is_valid: true } },
      );
      logger.info(`Operator ${operator.username} banned – sessions invalidated`);
    } else {
      logger.info(`Operator ${operator.username} unbanned`);
    }

    res.json({
      success: true,
      data: {
        username: operator.username,
        full_name: operator.full_name,
        email: operator.email,
        role: operator.role,
        isBanned: operator.is_banned,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { username } = req.params;
    const operator = await User.findOne({ where: { username, role: 'OPERATOR' } });
    if (!operator) {
      return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    // Invalidate all active sessions before deletion
    await Session.update(
      { is_valid: false },
      { where: { user_id: operator.id, is_valid: true } },
    );

    await operator.destroy();
    logger.info(`Operator removed: ${username}`);

    res.json({ success: true, data: true });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const operator = await User.findOne({ where: { username, role: 'OPERATOR' } });
    if (!operator) {
      return res.status(404).json({ success: false, error: 'Operator not found' });
    }

    operator.password = await bcrypt.hash(newPassword, 10);
    await operator.save();

    logger.info(`Password reset for operator ${operator.username}`);
    res.json({ success: true, data: true });
  } catch (err) {
    next(err);
  }
};
