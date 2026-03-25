const Campaign = require('../models/Campaign');
const Contact  = require('../models/Contact');
const Message  = require('../models/Message');
const { processMessage } = require('./messageController');

// ── GET /api/campaigns ────────────────────────────────────────────────────────
exports.getCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('template', 'name');

    res.json({ success: true, data: campaigns, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/campaigns/:id ────────────────────────────────────────────────────
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('template').populate('messages', 'status stats sentAt');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/campaigns ───────────────────────────────────────────────────────
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/campaigns/:id ────────────────────────────────────────────────────
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: { $in: ['draft', 'scheduled', 'paused'] } },
      req.body,
      { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found or cannot be edited' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/campaigns/:id ─────────────────────────────────────────────────
exports.deleteCampaign = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, owner: req.user._id, status: { $in: ['draft', 'cancelled'] } });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/campaigns/:id/launch ───────────────────────────────────────────
exports.launchCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    if (!['draft', 'scheduled', 'paused'].includes(campaign.status))
      return res.status(400).json({ success: false, message: 'Campaign cannot be launched in its current state' });

    // Fetch target contacts
    const contactFilter = { owner: req.user._id, isActive: true, emailSubscribed: true };
    if (campaign.targetLists.length) contactFilter.lists = { $in: campaign.targetLists };
    if (campaign.targetTags.length)  contactFilter.tags  = { $in: campaign.targetTags };

    const contacts = await Contact.find(contactFilter);
    if (!contacts.length)
      return res.status(400).json({ success: false, message: 'No contacts match campaign targeting' });

    const recipients = contacts.map((c) => ({
      contact: c._id,
      email: c.email,
      phone: c.phone,
      name: [c.firstName, c.lastName].filter(Boolean).join(' '),
    }));

    const message = await Message.create({
      owner: req.user._id,
      campaign: campaign._id,
      type: campaign.type === 'mixed' ? 'email' : campaign.type,
      subject: campaign.subject,
      body: campaign.body,
      htmlBody: campaign.htmlBody,
      recipients,
      status: campaign.scheduledAt ? 'scheduled' : 'sending',
      scheduledAt: campaign.scheduledAt,
      stats: { total: recipients.length },
      isBulk: true,
    });

    campaign.messages.push(message._id);
    campaign.contactCount = contacts.length;
    campaign.status = campaign.scheduledAt ? 'scheduled' : 'active';
    campaign.startedAt = new Date();
    await campaign.save();

    if (!campaign.scheduledAt) processMessage(message, req.user);

    res.json({ success: true, data: campaign, message: `Campaign launched to ${contacts.length} contacts` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/campaigns/:id/pause ───────────────────────────────────────────
exports.pauseCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: 'active' },
      { status: 'paused' }, { new: true }
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Active campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
