const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview',              ctrl.getOverview);
router.get('/messages-over-time',    ctrl.getMessagesOverTime);
router.get('/campaign/:id',          ctrl.getCampaignAnalytics);
router.get('/top-campaigns',         ctrl.getTopCampaigns);

module.exports = router;
