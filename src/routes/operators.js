const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const operatorController = require('../controllers/operatorController');

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), operatorController.list);
router.post('/', authenticate, requireRole('ADMIN'), operatorController.create);
router.put('/:username/ban', authenticate, requireRole('ADMIN'), operatorController.toggleBan);
router.put('/:username/reset-password', authenticate, requireRole('ADMIN'), operatorController.resetPassword);
router.delete('/:username', authenticate, requireRole('ADMIN'), operatorController.remove);

module.exports = router;
