const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
