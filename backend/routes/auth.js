const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl    = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], ctrl.register);

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], ctrl.login);

router.get('/me', protect, ctrl.getMe);
router.post('/2fa/setup',   protect, ctrl.setup2FA);
router.post('/2fa/verify',  protect, ctrl.verify2FA);
router.post('/2fa/disable', protect, ctrl.disable2FA);
router.put('/change-password', protect, ctrl.changePassword);

module.exports = router;
