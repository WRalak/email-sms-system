const Message  = require('../models/Message');
const Campaign = require('../models/Campaign');
const Contact  = require('../models/Contact');

// ── GET /api/analytics/overview ──────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query;
    const since = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

    const [
      totalContacts,
      totalMessages,
      totalCampaigns,
      recentMessages,
    ] = await Promise.all([
      Contact.countDocuments({ owner: userId, isActive: true }),
      Message.countDocuments({ owner: userId }),
      Campaign.countDocuments({ owner: userId }),
      Message.find({ owner: userId, createdAt: { $gte: since } }),
    ]);

    const agg = recentMessages.reduce(
      (acc, m) => {
        acc.sent      += m.stats.sent      || 0;
        acc.delivered += m.stats.delivered || 0;
        acc.failed    += m.stats.failed    || 0;
        acc.opened    += m.stats.opened    || 0;
        acc.clicked   += m.stats.clicked   || 0;
        return acc;
      },
      { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 }
    );

    const deliveryRate = agg.sent > 0 ? ((agg.delivered / agg.sent) * 100).toFixed(1) : 0;
    const openRate     = agg.sent > 0 ? ((agg.opened    / agg.sent) * 100).toFixed(1) : 0;
    const clickRate    = agg.sent > 0 ? ((agg.clicked   / agg.sent) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totals: { contacts: totalContacts, messages: totalMessages, campaigns: totalCampaigns },
        period: agg,
        rates: { deliveryRate, openRate, clickRate },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/analytics/messages-over-time ─────────────────────────────────────
exports.getMessagesOverTime = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const data = await Message.aggregate([
      { $match: { owner: req.user._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
          sent:  { $sum: '$stats.sent' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/analytics/campaign/:id ──────────────────────────────────────────
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const messages = await Message.find({ campaign: campaign._id });
    const stats = messages.reduce(
      (acc, m) => {
        acc.total     += m.stats.total     || 0;
        acc.sent      += m.stats.sent      || 0;
        acc.delivered += m.stats.delivered || 0;
        acc.failed    += m.stats.failed    || 0;
        acc.opened    += m.stats.opened    || 0;
        acc.clicked   += m.stats.clicked   || 0;
        return acc;
      },
      { total: 0, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 }
    );

    res.json({ success: true, data: { campaign, stats, messageCount: messages.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/analytics/top-campaigns ─────────────────────────────────────────
exports.getTopCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ owner: req.user._id, status: 'completed' })
      .sort({ 'stats.opened': -1 })
      .limit(5);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
