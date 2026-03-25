const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Core info
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, trim: true },
  email:     { type: String, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  company:   { type: String, trim: true },
  jobTitle:  { type: String, trim: true },
  avatar:    { type: String },

  // Grouping
  tags:   [{ type: String, trim: true }],
  lists:  [{ type: String, trim: true }],

  // Subscription / consent
  emailSubscribed: { type: Boolean, default: true },
  smsSubscribed:   { type: Boolean, default: false },
  unsubscribedAt:  { type: Date },

  // Engagement stats
  stats: {
    emailsSent:    { type: Number, default: 0 },
    emailsOpened:  { type: Number, default: 0 },
    emailsClicked: { type: Number, default: 0 },
    smsSent:       { type: Number, default: 0 },
  },

  // Custom fields (key-value pairs)
  customFields: { type: Map, of: String },

  // Source
  source:  { type: String, enum: ['manual', 'import', 'api', 'form'], default: 'manual' },
  notes:   { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Full name virtual
contactSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(' ');
});

// Text index for search
contactSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Contact', contactSchema);
