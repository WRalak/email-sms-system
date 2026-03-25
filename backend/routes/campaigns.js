const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/campaignController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',             ctrl.getCampaigns);
router.get('/:id',          ctrl.getCampaign);
router.post('/',            ctrl.createCampaign);
router.put('/:id',          ctrl.updateCampaign);
router.delete('/:id',       ctrl.deleteCampaign);
router.post('/:id/launch',  ctrl.launchCampaign);
router.patch('/:id/pause',  ctrl.pauseCampaign);

module.exports = router;
