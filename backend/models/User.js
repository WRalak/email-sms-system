const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role:     { type: String, enum: ['admin', 'user'], default: 'user' },
  avatar:   { type: String },

  // Two-Factor Auth
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String, select: false },

  // Account status
  isActive:    { type: Boolean, default: true },
  isVerified:  { type: Boolean, default: false },
  verifyToken: { type: String, select: false },

  // Password reset
  resetPasswordToken:   { type: String, select: false },
  resetPasswordExpire:  { type: Date,   select: false },

  // Preferences
  preferences: {
    timezone:       { type: String, default: 'UTC' },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications:   { type: Boolean, default: false },
  },

  // Usage stats
  stats: {
    emailsSent:  { type: Number, default: 0 },
    smsSent:     { type: Number, default: 0 },
    lastLogin:   { type: Date },
  },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
