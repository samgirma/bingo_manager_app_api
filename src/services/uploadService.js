const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * Upload a buffer (from multer memory storage) to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
async function uploadImage(fileBuffer, folder = 'profile_pics') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed:', error);
          return reject(error);
        }
        resolve(result);
      },
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary by its URL.
 */
async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  try {
    const parts = imageUrl.split('/');
    const folderIdx = parts.indexOf('profile_pics');
    if (folderIdx === -1) return;
    const publicId = parts.slice(folderIdx).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    logger.error('Cloudinary delete failed:', err);
  }
}

module.exports = { uploadImage, deleteImage };
