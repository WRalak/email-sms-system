const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',                   ctrl.getTemplates);
router.get('/:id',                ctrl.getTemplate);
router.post('/',                  ctrl.createTemplate);
router.put('/:id',                ctrl.updateTemplate);
router.delete('/:id',             ctrl.deleteTemplate);
router.post('/:id/duplicate',     ctrl.duplicateTemplate);

module.exports = router;
