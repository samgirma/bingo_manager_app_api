require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'bingo_manager',
    user: process.env.DB_USER || 'bingo_app',
    password: process.env.DB_PASSWORD || 'bingo_pass456',
    dialect: 'postgres',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_do_not_use_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  cors: {
    origin: process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:8081'),
  },

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  },

  brevo: {
    smtp_host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    smtp_port: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtp_login: process.env.SMTP_LOGIN || '',
    smtp_password: process.env.SMTP_PASSWORD || '',
    sender_email: process.env.SENDER_EMAIL || '',
  },

  userKeySource: process.env.USER_KEY_SOURCE || 'This_secrate_key_for_encription_2026_for_user_generation',
  topupKeySource: process.env.TOPUP_KEY_SOURCE || 'This_secrate_key_for_encription_2026', 
};

module.exports = config;
