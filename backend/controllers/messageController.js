const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const User = require('../models/User');

// ── SMTP Transporter ──────────────────────────────────────────────────────────
const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

// ── Twilio client ─────────────────────────────────────────────────────────────
const getTwilioClient = () =>
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ── Helper: replace template variables ───────────────────────────────────────
const interpolate = (text, vars = {}) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);

// ── Send single email ─────────────────────────────────────────────────────────
const sendEmail = async (to, subject, htmlBody, attachments = []) => {
  const transporter = getTransporter();
  const mailOptions = {
    from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html: htmlBody,
    attachments: attachments.map((a) => ({
      filename: a.originalName,
      path: a.path,
      contentType: a.mimetype,
    })),
  };
  return transporter.sendMail(mailOptions);
};

// ── Send single SMS ───────────────────────────────────────────────────────────
const sendSMS = async (to, body) => {
  const client = getTwilioClient();
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

// ── GET /api/messages ─────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    const filter = { owner: req.user._id };
    if (type)   filter.type   = type;
    if (status) filter.status = status;

    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-recipients')
      .populate('campaign', 'name');

    res.json({ success: true, data: messages, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/messages/:id ─────────────────────────────────────────────────────
exports.getMessage = async (req, res) => {
  try {
    const msg = await Message.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('campaign', 'name');
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/messages/send ───────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const {
      type, subject, body, htmlBody, recipients,
      scheduledAt, campaignId, isBulk, tags,
    } = req.body;

    // Build recipient list
    let recipientList = [];
    if (Array.isArray(recipients)) {
      for (const r of recipients) {
        if (typeof r === 'string') {
          // Could be a contactId or direct email/phone
          const contact = await Contact.findById(r);
          if (contact) {
            recipientList.push({
              contact: contact._id,
              email: contact.email,
              phone: contact.phone,
              name: contact.fullName || contact.firstName,
              trackingId: uuidv4(),
            });
          }
        } else if (r.email || r.phone) {
          recipientList.push({ ...r, trackingId: uuidv4() });
        }
      }
    }

    const attachments = (req.files || []).map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      path: f.path,
    }));

    const message = await Message.create({
      owner: req.user._id,
      campaign: campaignId || undefined,
      type, subject, body, htmlBody,
      recipients: recipientList,
      attachments,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'sending',
      stats: { total: recipientList.length },
      isBulk: isBulk || recipientList.length > 1,
      tags,
    });

    // Fire immediately if not scheduled
    if (!scheduledAt) {
      processMessage(message, req.user);
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Internal: process and dispatch message ────────────────────────────────────
const processMessage = async (message, user) => {
  let sent = 0, failed = 0;

  for (const recipient of message.recipients) {
    try {
      if (message.type === 'email' && recipient.email) {
        const vars = { firstName: recipient.name?.split(' ')[0], email: recipient.email };
        const personalizedHtml = interpolate(message.htmlBody || message.body, vars);
        const personalizedSubject = interpolate(message.subject || '', vars);
        await sendEmail(recipient.email, personalizedSubject, personalizedHtml, message.attachments);
        recipient.status = 'sent';
        recipient.sentAt = new Date();
        sent++;
      } else if (message.type === 'sms' && recipient.phone) {
        const vars = { firstName: recipient.name?.split(' ')[0], phone: recipient.phone };
        const personalizedBody = interpolate(message.body, vars);
        await sendSMS(recipient.phone, personalizedBody);
        recipient.status = 'sent';
        recipient.sentAt = new Date();
        sent++;
      } else {
        recipient.status = 'failed';
        recipient.failedReason = 'Missing email/phone';
        failed++;
      }
    } catch (err) {
      recipient.status = 'failed';
      recipient.failedReason = err.message;
      failed++;
    }
  }

  message.status = 'sent';
  message.sentAt = new Date();
  message.stats.sent = sent;
  message.stats.failed = failed;
  await message.save();

  // Update user stats
  if (message.type === 'email') {
    await User.findByIdAndUpdate(message.owner, { $inc: { 'stats.emailsSent': sent } });
  } else {
    await User.findByIdAndUpdate(message.owner, { $inc: { 'stats.smsSent': sent } });
  }
};

exports.processMessage = processMessage;

// ── DELETE /api/messages/:id ──────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/messages/:id/cancel ────────────────────────────────────────────
exports.cancelMessage = async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, status: 'scheduled' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Scheduled message not found' });
    res.json({ success: true, data: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
