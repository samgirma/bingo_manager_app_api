const cloudinary = require('cloudinary').v2;
const config = require('./config');

// Support CLOUDINARY_URL (cloudinary://key:secret@cloud_name) or individual vars
if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL !== 'cloudinary://<your_api_key>:<your_api_secret>@dk3iqdf6b') {
  cloudinary.config(); // auto-configures from CLOUDINARY_URL env var
} else if (config.cloudinary.cloud_name) {
  cloudinary.config(config.cloudinary);
}

module.exports = cloudinary;
