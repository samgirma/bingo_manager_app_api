const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const bingoCenterController = require('../controllers/bingoCenterController');

const router = Router();

router.get('/', authenticate, bingoCenterController.list);
router.post('/', authenticate, requireRole('OPERATOR', 'ADMIN'), bingoCenterController.create);
router.post('/recharge', authenticate, requireRole('OPERATOR', 'ADMIN'), bingoCenterController.recharge);

module.exports = router;
