const { Router } = require('express');
const controller = require('../controllers/passwordResetController');

const router = Router();

router.post('/forgot-password', controller.forgotPassword);
router.post('/verify-otp', controller.verifyOtp);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
