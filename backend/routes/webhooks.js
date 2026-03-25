const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const Message = require('../models/Message');
const WebhookEvent = require('../models/WebhookEvent');
const { webhookLimiter } = require('../middleware/rateLimiter');

router.use(webhookLimiter);

// ── Verify Twilio webhook signature ──────────────────────────────────────────
const verifyTwilioSignature = (req) => {
  if (process.env.NODE_ENV === 'development') return true;
  // In production: validate X-Twilio-Signature header
  return true; // placeholder – use twilio.validateRequest() in production
};

// ── POST /api/webhooks/twilio ─────────────────────────────────────────────────
router.post('/twilio', async (req, res) => {
  if (!verifyTwilioSignature(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const { MessageSid, MessageStatus, To, ErrorCode } = req.body;
  try {
    const event = await WebhookEvent.create({
      provider: 'twilio',
      event: MessageStatus,
      recipientPhone: To,
      rawPayload: req.body,
    });

    // Find matching message and update recipient status
    const message = await Message.findOne({ 'recipients.phone': To, type: 'sms' });
    if (message) {
      const recipient = message.recipients.find((r) => r.phone === To);
      if (recipient) {
        recipient.status = MessageStatus === 'delivered' ? 'delivered'
          : MessageStatus === 'failed'    ? 'failed'
          : 'sent';
        if (MessageStatus === 'delivered') {
          recipient.deliveredAt = new Date();
          message.stats.delivered = (message.stats.delivered || 0) + 1;
        } else if (MessageStatus === 'failed') {
          recipient.failedReason = ErrorCode;
          message.stats.failed = (message.stats.failed || 0) + 1;
        }
        await message.save();
      }
      event.messageId = message._id;
    }

    event.processed = true;
    event.processedAt = new Date();
    await event.save();

    res.status(200).send('<Response/>');
  } catch (err) {
    console.error('Twilio webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/webhooks/email ──────────────────────────────────────────────────
router.post('/email', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const expected  = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'secret')
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (process.env.NODE_ENV !== 'development' && signature !== expected) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const events = Array.isArray(req.body) ? req.body : [req.body];

  for (const ev of events) {
    try {
      const { event, trackingId, email, timestamp } = ev;
      const webhookEvent = await WebhookEvent.create({
        provider: 'nodemailer',
        event,
        trackingId,
        recipientEmail: email,
        rawPayload: ev,
      });

      // Update message recipient by trackingId
      const message = await Message.findOne({ 'recipients.trackingId': trackingId });
      if (message) {
        const recipient = message.recipients.find((r) => r.trackingId === trackingId);
        if (recipient) {
          if (event === 'opened')    { recipient.status = 'opened';    recipient.openedAt    = new Date(timestamp); message.stats.opened    += 1; }
          if (event === 'clicked')   { recipient.status = 'clicked';   recipient.clickedAt   = new Date(timestamp); message.stats.clicked   += 1; }
          if (event === 'delivered') { recipient.status = 'delivered'; recipient.deliveredAt = new Date(timestamp); message.stats.delivered += 1; }
          if (event === 'bounced')   { recipient.status = 'bounced';                                                message.stats.bounced   += 1; }
          await message.save();
        }
        webhookEvent.messageId = message._id;
      }

      webhookEvent.processed = true;
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
    } catch (err) {
      console.error('Email webhook error:', err.message);
    }
  }

  res.status(200).json({ received: events.length });
});

module.exports = router;
