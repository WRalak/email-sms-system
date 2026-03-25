const rateLimit = require('express-rate-limit');

// ── General API rate limit ────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// ── Auth endpoints (stricter) ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' },
});

// ── Message sending (prevent abuse) ──────────────────────────────────────────
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minute
  max: 20,                       // 20 sends per minute
  message: { success: false, message: 'Sending rate limit exceeded. Slow down.' },
});

// ── Webhook endpoints (high traffic) ─────────────────────────────────────────
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: { success: false, message: 'Webhook rate limit exceeded.' },
});

module.exports = { apiLimiter, authLimiter, sendLimiter, webhookLimiter };
