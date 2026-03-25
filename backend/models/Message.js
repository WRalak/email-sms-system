const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename:    String,
  originalName: String,
  mimetype:    String,
  size:        Number,
  path:        String,
}, { _id: false });

const recipientSchema = new mongoose.Schema({
  contact:  { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  email:    String,
  phone:    String,
  name:     String,
  status:   { type: String, enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'], default: 'pending' },
  sentAt:       Date,
  deliveredAt:  Date,
  openedAt:     Date,
  clickedAt:    Date,
  failedReason: String,
  trackingId:   String,
}, { _id: false });

const messageSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },

  type:     { type: String, enum: ['email', 'sms'], required: true },
  subject:  { type: String },   // email only
  body:     { type: String, required: true },
  htmlBody: { type: String },   // email only

  recipients: [recipientSchema],
  attachments: [attachmentSchema],

  // Scheduling
  scheduledAt: { type: Date },
  sentAt:      { type: Date },

  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
    default: 'draft',
    index: true,
  },

  // Aggregated stats (updated by webhook / polling)
  stats: {
    total:     { type: Number, default: 0 },
    sent:      { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed:    { type: Number, default: 0 },
    opened:    { type: Number, default: 0 },
    clicked:   { type: Number, default: 0 },
    bounced:   { type: Number, default: 0 },
  },

  // Bulk send metadata
  isBulk: { type: Boolean, default: false },
  tags:   [String],
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
