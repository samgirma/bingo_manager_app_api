const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, PasswordResetToken } = require('../models');
const { sendOtpEmail } = require('../services/emailService');
const logger = require('../utils/logger');

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email' });
    }

    // Invalidate any previous OTPs for this email
    await PasswordResetToken.update(
      { used: true },
      { where: { email, used: false } },
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      email,
      otp,
      expires_at: expiresAt,
    });

    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
    }

    logger.info(`Password reset OTP sent to ${email}`);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const token = await PasswordResetToken.findOne({
      where: {
        email,
        otp,
        used: false,
      },
      order: [['created_at', 'DESC']],
    });

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date() > new Date(token.expires_at)) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const token = await PasswordResetToken.findOne({
      where: { email, otp, used: false },
      order: [['created_at', 'DESC']],
    });

    if (!token) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    if (new Date() > new Date(token.expires_at)) {
      return res.status(400).json({ success: false, error: 'OTP has expired' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mark OTP as used and update password
    await token.update({ used: true });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    logger.info(`Password reset successfully for ${email}`);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};
