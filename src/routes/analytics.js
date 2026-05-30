const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = Router();

router.get('/', authenticate, analyticsController.getSystemAnalytics);

module.exports = router;
