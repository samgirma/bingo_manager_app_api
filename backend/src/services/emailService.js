const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: `"Bingo Manager" <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: 'Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3498db; text-align: center;">Password Reset</h2>
        <p style="color: #333; font-size: 14px;">You requested a password reset. Use the OTP below to reset your password:</p>
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #3498db; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 12px;">This OTP expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
    return true;
  } catch (err) {
    logger.error('Failed to send OTP email:', err);
    return false;
  }
}

module.exports = { sendOtpEmail };
