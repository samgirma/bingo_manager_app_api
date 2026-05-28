const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = Router();

router.put('/profile', authenticate, userController.updateProfile);

module.exports = router;
