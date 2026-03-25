# ⚡ MessageHub — Full-Stack Email & SMS Platform

A production-ready MERN stack messaging platform with Tailwind CSS, featuring every modern messaging feature you need.

---

## 📦 Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 18, Tailwind CSS, Chart.js, React Router v6 |
| Backend   | Node.js, Express 4, MongoDB + Mongoose |
| Auth      | JWT, bcryptjs, speakeasy (2FA/TOTP) |
| Email     | Nodemailer (SMTP) |
| SMS       | Twilio |
| Scheduler | node-cron |
| Upload    | Multer |
| Security  | express-rate-limit, express-validator, CORS, bcrypt |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Required `.env` values:
- `MONGODB_URI` — Your MongoDB connection string
- `JWT_SECRET` — A strong random secret (use `openssl rand -base64 32`)
- `SMTP_HOST / SMTP_USER / SMTP_PASS` — Gmail or any SMTP provider
- `TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER` — Twilio credentials

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open **http://localhost:3000**

---

## ✨ Features

### 📨 Messaging
- **Email Sending** via Nodemailer (SMTP) — HTML + plain text
- **SMS Sending** via Twilio
- **Bulk Sending** — send to hundreds of contacts at once
- **File Attachments** — up to 10MB per email
- **Scheduled Messages** — pick any future date/time
- **Template Variables** — `{{firstName}}`, `{{company}}`, etc.

### 📧 Email Templates
Pre-designed HTML templates:
- Welcome / Onboarding
- Newsletter (dark theme)
- Promotional / Discount
- Notification / Alert

Create and manage custom templates with HTML preview.

### 📣 Campaigns
- Create email or SMS campaigns targeting contact lists/tags
- Schedule campaigns for future delivery
- Launch, pause, and monitor campaigns
- Per-campaign analytics (sent, delivered, opened, clicked)

### 👥 Contact Management
- Full CRUD for contacts
- Bulk CSV import
- Tags and lists for segmentation
- Email and SMS subscription preferences
- Full-text search

### 📊 Analytics Dashboard
- Messages sent over time (line/bar charts)
- Delivery / open / click rates
- Top-performing campaigns
- Status breakdown donut chart
- Configurable time periods (7d / 30d / 90d)

### 🔐 Security
- **JWT Authentication** — stateless token-based auth
- **bcrypt Password Hashing** — 12 salt rounds
- **Two-Factor Authentication** — TOTP via Google Authenticator / Authy
- **Rate Limiting** — per-endpoint limits (auth: 10/15min, send: 20/min)
- **Input Validation** — express-validator on all endpoints
- **CORS** — whitelist only your frontend origin
- **Webhook Signature Verification** — HMAC-SHA256

### 🔗 Webhooks
- `/api/webhooks/twilio` — SMS delivery status updates
- `/api/webhooks/email` — Email open/click/bounce tracking
- Real-time message recipient status updates

---

## 📁 Project Structure

```
messagehub/
├── backend/
│   ├── server.js                 # Entry point
│   ├── .env.example              # Config template
│   ├── config/
│   ├── controllers/
│   │   ├── authController.js     # Auth + 2FA
│   │   ├── messageController.js  # Email + SMS sending
│   │   ├── contactController.js  # Contact CRUD
│   │   ├── campaignController.js # Campaigns
│   │   ├── templateController.js # Templates
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js               # JWT protect
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── upload.js             # Multer
│   ├── models/
│   │   ├── User.js
│   │   ├── Contact.js
│   │   ├── Message.js
│   │   ├── Campaign.js
│   │   ├── Template.js
│   │   └── WebhookEvent.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── messages.js
│   │   ├── contacts.js
│   │   ├── campaigns.js
│   │   ├── templates.js
│   │   ├── analytics.js
│   │   ├── webhooks.js
│   │   └── settings.js
│   ├── templates/
│   │   └── emailTemplates.js     # Pre-designed HTML
│   └── utils/
│       └── scheduler.js          # node-cron scheduler
│
└── frontend/
    └── src/
        ├── App.jsx               # Router
        ├── context/AuthContext.jsx
        ├── utils/api.js
        ├── components/AppLayout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── ContactsPage.jsx
            ├── MessagesPage.jsx
            ├── ComposePage.jsx
            ├── CampaignsPage.jsx
            ├── TemplatesPage.jsx
            ├── AnalyticsPage.jsx
            └── SettingsPage.jsx
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (supports 2FA) |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/auth/2fa/setup` | Generate 2FA QR code |
| POST | `/api/auth/2fa/verify` | Enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| PUT  | `/api/auth/change-password` | Change password |
| GET/POST | `/api/contacts` | List / create contacts |
| POST | `/api/contacts/bulk-import` | Import CSV contacts |
| GET/POST | `/api/messages` | List messages |
| POST | `/api/messages/send` | Send email or SMS |
| PATCH | `/api/messages/:id/cancel` | Cancel scheduled |
| GET/POST | `/api/campaigns` | List / create campaigns |
| POST | `/api/campaigns/:id/launch` | Launch campaign |
| GET/POST | `/api/templates` | Templates CRUD |
| POST | `/api/templates/:id/duplicate` | Duplicate template |
| GET  | `/api/analytics/overview` | Dashboard stats |
| GET  | `/api/analytics/messages-over-time` | Chart data |
| POST | `/api/webhooks/twilio` | Twilio status webhook |
| POST | `/api/webhooks/email` | Email event webhook |

---

## 🔧 Gmail SMTP Setup

1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Use that as `SMTP_PASS` in your `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

---

## 📱 Twilio SMS Setup

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number from the Twilio Console
3. Copy Account SID and Auth Token

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚢 Production Deployment

```bash
# Build frontend
cd frontend && npm run build

# Serve static files from Express (add to server.js)
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/build/index.html')));
```

Set production environment variables:
- `NODE_ENV=production`
- Strong `JWT_SECRET`
- MongoDB Atlas connection string
- Real SMTP credentials
- Twilio live credentials
