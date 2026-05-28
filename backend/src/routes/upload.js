const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadMiddleware, uploadProfilePic } = require('../controllers/uploadController');

const router = Router();

router.post('/profile-pic', authenticate, uploadMiddleware, uploadProfilePic);

module.exports = router;
