import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, ShieldCheckIcon, BellIcon, KeyIcon,
  CheckCircleIcon, XCircleIcon,
} from '@heroicons/react/24/outline';

function ProfileSection({ user, refreshUser }) {
  const [form, setForm] = useState({ name: user.name, preferences: { timezone: user.preferences?.timezone || 'UTC', emailNotifications: user.preferences?.emailNotifications !== false, smsNotifications: user.preferences?.smsNotifications || false } });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/settings/profile', form);
      await refreshUser();
      toast.success('Profile updated');
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-brand-600/10"><UserCircleIcon className="w-5 h-5 text-brand-400" /></div>
        <h2 className="text-base font-semibold text-white">Profile</h2>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input className="input max-w-md" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input max-w-md opacity-60 cursor-not-allowed" value={user.email} disabled />
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label className="label">Timezone</label>
          <select className="input max-w-xs" value={form.preferences.timezone} onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, timezone: e.target.value } }))}>
            {['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Kolkata','Australia/Sydney'].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="label">Notifications</label>
          {[['emailNotifications','Email notifications'],['smsNotifications','SMS notifications']].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.preferences[k]} onChange={e => setForm(f => ({ ...f, preferences: { ...f.preferences, [k]: e.target.checked } }))} className="w-4 h-4 rounded accent-brand-500" />
              <span className="text-sm text-slate-300">{l}</span>
            </label>
          ))}
        </div>
        <button type="submit" disabled={saving} className="btn-primary btn-md">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function PasswordSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await api.put('/api/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-600/10"><KeyIcon className="w-5 h-5 text-amber-400" /></div>
        <h2 className="text-base font-semibold text-white">Change Password</h2>
      </div>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        {[
          ['currentPassword','Current Password'],
          ['newPassword','New Password'],
          ['confirm','Confirm New Password'],
        ].map(([name, label]) => (
          <div key={name}>
            <label className="label">{label}</label>
            <input type="password" className="input" value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder="••••••••" required />
          </div>
        ))}
        <button type="submit" disabled={saving} className="btn-primary btn-md">
          {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

function TwoFASection({ user, refreshUser }) {
  const [step, setStep]       = useState('idle'); // idle | setup | verify | disable
  const [qrCode, setQrCode]   = useState('');
  const [secret, setSecret]   = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep('setup');
    } catch {} finally { setLoading(false); }
  };

  const verifyAndEnable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/2fa/verify', { token: code });
      toast.success('2FA enabled!');
      await refreshUser();
      setStep('idle'); setCode('');
    } catch {} finally { setLoading(false); }
  };

  const disable2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/2fa/disable', { token: code });
      toast.success('2FA disabled');
      await refreshUser();
      setStep('idle'); setCode('');
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-600/10"><ShieldCheckIcon className="w-5 h-5 text-emerald-400" /></div>
        <div>
          <h2 className="text-base font-semibold text-white">Two-Factor Authentication</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account</p>
        </div>
        <div className="ml-auto">
          {user.twoFactorEnabled
            ? <span className="badge-green"><CheckCircleIcon className="w-3.5 h-3.5" /> Enabled</span>
            : <span className="badge-red"><XCircleIcon className="w-3.5 h-3.5" /> Disabled</span>
          }
        </div>
      </div>

      {step === 'idle' && (
        <div>
          {user.twoFactorEnabled ? (
            <div>
              <p className="text-sm text-slate-400 mb-4">Your account is protected with 2FA. You'll need your authenticator app to sign in.</p>
              <button onClick={() => setStep('disable')} className="btn-danger btn-md">Disable 2FA</button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-400 mb-4">Use an authenticator app like Google Authenticator or Authy to generate login codes.</p>
              <button onClick={startSetup} disabled={loading} className="btn-primary btn-md">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Enable 2FA'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'setup' && (
        <div className="space-y-5">
          <div>
            <p className="text-sm text-slate-300 mb-3">1. Scan this QR code with your authenticator app</p>
            <div className="inline-block p-3 bg-white rounded-xl">
              <img src={qrCode} alt="2FA QR Code" className="w-44 h-44" />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-300 mb-2">Or enter this secret manually:</p>
            <code className="font-mono text-sm bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-brand-300 select-all">{secret}</code>
          </div>
          <form onSubmit={verifyAndEnable} className="space-y-3">
            <div>
              <label className="label">2. Enter the 6-digit code from your app</label>
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className="input w-40 text-center font-mono text-xl tracking-widest"
                value={code} onChange={e => setCode(e.target.value)} placeholder="000000" autoFocus required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary btn-md">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify & Enable'}
              </button>
              <button type="button" onClick={() => { setStep('idle'); setCode(''); }} className="btn-secondary btn-md">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {step === 'disable' && (
        <form onSubmit={disable2FA} className="space-y-4">
          <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/25 text-sm text-red-300">
            Enter your current 2FA code to confirm disabling
          </div>
          <div>
            <label className="label">6-Digit Code</label>
            <input type="text" inputMode="numeric" maxLength={6} className="input w-40 text-center font-mono text-xl tracking-widest"
              value={code} onChange={e => setCode(e.target.value)} placeholder="000000" autoFocus required />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-danger btn-md">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Disable 2FA'}
            </button>
            <button type="button" onClick={() => { setStep('idle'); setCode(''); }} className="btn-secondary btn-md">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account preferences and security</p>
      </div>

      {/* Account stats */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user.name}</p>
            <p className="text-sm text-slate-400">{user.email}</p>
            <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
              <span>📧 {user.stats?.emailsSent?.toLocaleString() || 0} emails sent</span>
              <span>📱 {user.stats?.smsSent?.toLocaleString() || 0} SMS sent</span>
              <span className="capitalize bg-brand-600/15 text-brand-400 px-2 py-0.5 rounded-full">{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      <ProfileSection user={user} refreshUser={refreshUser} />
      <TwoFASection   user={user} refreshUser={refreshUser} />
      <PasswordSection />
    </div>
  );
}
