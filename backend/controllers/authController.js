const { validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password } = req.body;
  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password, twoFactorCode } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated' });

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!twoFactorCode)
        return res.status(200).json({ success: false, requiresTwoFactor: true });

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2,
      });
      if (!verified)
        return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }

    // Update last login
    user.stats.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── Setup 2FA ─────────────────────────────────────────────────────────────────
exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `MessageHub (${req.user.email})`,
      length: 20,
    });
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Temporarily store (not enabled yet until verified)
    await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret.base32 });

    res.json({ success: true, qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify & enable 2FA ───────────────────────────────────────────────────────
exports.verify2FA = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });

    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Disable 2FA ───────────────────────────────────────────────────────────────
exports.disable2FA = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret, encoding: 'base32', token, window: 2,
    });
    if (!verified) return res.status(400).json({ success: false, message: 'Invalid code' });

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false, twoFactorSecret: null,
    });
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Change password ────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
