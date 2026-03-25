const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',              ctrl.getContacts);
router.get('/tags',          ctrl.getAllTags);
router.get('/lists',         ctrl.getAllLists);
router.get('/:id',           ctrl.getContact);
router.post('/',             ctrl.createContact);
router.post('/bulk-import',  ctrl.bulkImport);
router.put('/:id',           ctrl.updateContact);
router.delete('/:id',        ctrl.deleteContact);

module.exports = router;
