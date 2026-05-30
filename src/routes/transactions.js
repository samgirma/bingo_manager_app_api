const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

const router = Router();

router.get('/', authenticate, transactionController.list);

module.exports = router;
