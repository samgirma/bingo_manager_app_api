const { User } = require('../models');
const logger = require('../utils/logger');

exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, email, password, profile_pic_url } = req.body;
    const user = req.userRecord;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (profile_pic_url !== undefined) updates.profile_pic_url = profile_pic_url || null;
    if (password !== undefined) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(password, 10);
    }

    await user.update(updates);
    logger.info(`Profile updated for ${user.username}`);

    res.json({
      success: true,
      data: {
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile_pic_url: user.profile_pic_url,
        isBanned: user.is_banned,
      },
    });
  } catch (err) {
    next(err);
  }
};
