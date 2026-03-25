const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  provider:   { type: String, enum: ['twilio', 'nodemailer', 'sendgrid', 'custom'], required: true },
  event:      { type: String, required: true },  // delivered, failed, opened, clicked, bounced
  trackingId: { type: String, index: true },
  messageId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  recipientEmail: String,
  recipientPhone: String,
  rawPayload: { type: mongoose.Schema.Types.Mixed },
  processed:  { type: Boolean, default: false },
  processedAt: Date,
  error:      String,
}, { timestamps: true });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
