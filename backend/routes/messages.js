const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/messageController');
const { protect }     = require('../middleware/auth');
const { sendLimiter } = require('../middleware/rateLimiter');
const upload  = require('../middleware/upload');

router.use(protect);

router.get('/',           ctrl.getMessages);
router.get('/:id',        ctrl.getMessage);
router.post('/send', sendLimiter, upload.array('attachments', 10), ctrl.sendMessage);
router.delete('/:id',     ctrl.deleteMessage);
router.patch('/:id/cancel', ctrl.cancelMessage);

module.exports = router;
