// Pre-designed HTML email templates

const templates = {
  welcome: (vars = {}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:48px 40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700">Welcome to MessageHub</h1>
          <p style="color:rgba(255,255,255,.85);margin:12px 0 0;font-size:16px">We're thrilled to have you on board</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-size:16px;color:#374151;line-height:1.6">Hi <strong>${vars.firstName || 'there'}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6">Your account has been created successfully. You now have access to our powerful email & SMS platform.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${vars.ctaUrl || '#'}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block">Get Started →</a>
          </div>
          <p style="font-size:14px;color:#6b7280;line-height:1.6">If you have any questions, reply to this email — we're always here to help.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
          <p style="font-size:12px;color:#9ca3af;margin:0">© 2024 MessageHub. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,

  newsletter: (vars = {}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden">
        <tr><td style="padding:48px 40px;text-align:center;border-bottom:1px solid #334155">
          <p style="color:#94a3b8;margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase">Newsletter</p>
          <h1 style="color:#f1f5f9;margin:0;font-size:28px;font-weight:700">${vars.title || 'Monthly Update'}</h1>
          <p style="color:#64748b;margin:8px 0 0;font-size:14px">${vars.date || new Date().toLocaleDateString()}</p>
        </td></tr>
        <tr><td style="padding:40px">
          <p style="font-size:16px;color:#cbd5e1;line-height:1.7">${vars.intro || 'Here\'s what\'s new this month.'}</p>
          <div style="background:#0f172a;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #6366f1">
            <p style="color:#e2e8f0;margin:0;font-size:15px;line-height:1.6">${vars.highlight || 'Featured update content here...'}</p>
          </div>
          <div style="text-align:center;margin:32px 0">
            <a href="${vars.ctaUrl || '#'}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">Read Full Article</a>
          </div>
        </td></tr>
        <tr><td style="background:#0f172a;padding:24px 40px;text-align:center">
          <p style="font-size:12px;color:#475569;margin:0">You're receiving this because you subscribed. <a href="#" style="color:#6366f1">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,

  promotional: (vars = {}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff9f0;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:2px solid #fed7aa">
        <tr><td style="background:linear-gradient(135deg,#f97316,#ef4444);padding:60px 40px;text-align:center">
          <p style="color:rgba(255,255,255,.9);font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px">Limited Time Offer</p>
          <h1 style="color:#fff;margin:0;font-size:48px;font-weight:800">${vars.discount || '50% OFF'}</h1>
          <p style="color:rgba(255,255,255,.9);margin:12px 0 0;font-size:18px">${vars.subtitle || 'On all premium plans'}</p>
        </td></tr>
        <tr><td style="padding:40px;text-align:center">
          <p style="font-size:16px;color:#374151;line-height:1.6">Hi ${vars.firstName || 'there'}, don't miss this exclusive deal just for you!</p>
          <p style="font-size:15px;color:#6b7280;line-height:1.6">${vars.description || 'Offer details go here...'}</p>
          <div style="background:#fff9f0;border-radius:8px;padding:20px;margin:24px 0;border:2px dashed #f97316">
            <p style="color:#374151;margin:0 0 8px;font-size:14px">Use code:</p>
            <p style="color:#f97316;margin:0;font-size:28px;font-weight:800;letter-spacing:4px">${vars.code || 'SAVE50'}</p>
          </div>
          <a href="${vars.ctaUrl || '#'}" style="background:linear-gradient(135deg,#f97316,#ef4444);color:#fff;padding:16px 40px;border-radius:50px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">Claim Your Discount</a>
          <p style="font-size:12px;color:#9ca3af;margin:24px 0 0">Offer expires ${vars.expiry || 'soon'}. Terms apply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,

  notification: (vars = {}) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px">
      <table width="500" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06)">
        <tr><td style="padding:32px 40px;border-bottom:3px solid ${vars.color || '#6366f1'}">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><h2 style="color:#111827;margin:0;font-size:20px">${vars.title || 'Notification'}</h2></td>
            <td align="right"><span style="background:${vars.color || '#6366f1'}22;color:${vars.color || '#6366f1'};padding:4px 12px;border-radius:50px;font-size:12px;font-weight:600">${vars.badge || 'INFO'}</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <p style="font-size:15px;color:#374151;line-height:1.6;margin:0">${vars.message || 'Your notification message here.'}</p>
          ${vars.ctaUrl ? `<div style="margin-top:24px"><a href="${vars.ctaUrl}" style="background:${vars.color || '#6366f1'};color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">${vars.ctaText || 'View Details'}</a></div>` : ''}
        </td></tr>
        <tr><td style="padding:20px 40px;background:#f9fafb;text-align:center">
          <p style="font-size:12px;color:#9ca3af;margin:0">Sent via MessageHub</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
};

module.exports = templates;
