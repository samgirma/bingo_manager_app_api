const multer = require('multer');
const { uploadImage, deleteImage } = require('../services/uploadService');
const { User } = require('../models');
const logger = require('../utils/logger');

/** Accept only images, max 5 MB */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

exports.uploadMiddleware = upload.single('image');

exports.uploadProfilePic = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const user = req.userRecord;
    const oldUrl = user.profile_pic_url;

    const result = await uploadImage(req.file.buffer);
    const newUrl = result.secure_url;

    await user.update({ profile_pic_url: newUrl });

    if (oldUrl) await deleteImage(oldUrl);

    logger.info(`Profile picture updated for ${user.username}`);
    res.json({
      success: true,
      data: {
        profile_pic_url: newUrl,
        width: result.width,
        height: result.height,
      },
    });
  } catch (err) {
    next(err);
  }
};
