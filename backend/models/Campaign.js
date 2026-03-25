const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:     { type: String, required: true, trim: true },
  description: { type: String },
  type:     { type: String, enum: ['email', 'sms', 'mixed'], required: true },

  // Targeting
  targetLists: [String],
  targetTags:  [String],
  contactCount: { type: Number, default: 0 },

  // Content
  template:  { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  subject:   String,
  body:      String,
  htmlBody:  String,

  // Scheduling
  scheduledAt: Date,
  startedAt:   Date,
  completedAt: Date,

  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },

  // Aggregated analytics
  stats: {
    total:       { type: Number, default: 0 },
    sent:        { type: Number, default: 0 },
    delivered:   { type: Number, default: 0 },
    failed:      { type: Number, default: 0 },
    opened:      { type: Number, default: 0 },
    clicked:     { type: Number, default: 0 },
    bounced:     { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
  },

  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
