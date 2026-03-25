const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET profile
router.get('/profile', (req, res) => res.json({ success: true, data: req.user }));

// PUT profile
router.put('/profile', async (req, res) => {
  const { name, preferences } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, preferences },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
