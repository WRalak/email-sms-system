const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true, trim: true },
  type:     { type: String, enum: ['email', 'sms'], required: true },
  category: { type: String, enum: ['marketing', 'transactional', 'newsletter', 'notification', 'custom'], default: 'custom' },

  subject:  String,
  body:     { type: String, required: true },
  htmlBody: String,   // rich HTML for email templates
  thumbnail: String,  // preview image URL

  // Variable placeholders like {{firstName}}, {{company}}
  variables: [String],

  isPublic:  { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema);
