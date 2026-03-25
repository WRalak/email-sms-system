import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BoltIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]             = useState({ email: '', password: '', twoFactorCode: '' });
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPw]   = useState(false);
  const [needs2FA, setNeeds2FA]     = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.email, form.password, form.twoFactorCode || undefined);
      if (result?.requiresTwoFactor) {
        setNeeds2FA(true);
        toast('Enter your 2FA code', { icon: '🔐' });
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch {
      // error toast shown by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="glow-orb w-96 h-96 bg-brand-600 -top-48 -left-48" />
      <div className="glow-orb w-64 h-64 bg-purple-700 bottom-0 right-0" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-brand mb-4">
            <BoltIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to your MessageHub account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!needs2FA ? (
              <>
                <div>
                  <label className="label">Email address</label>
                  <input name="email" type="email" required autoComplete="email"
                    className="input" placeholder="you@example.com"
                    value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} required
                      className="input pr-10" placeholder="••••••••"
                      value={form.password} onChange={handleChange} />
                    <button type="button" onClick={() => setShowPw(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-brand-600/10 border border-brand-600/25">
                  <ShieldCheckIcon className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <p className="text-sm text-brand-300">Enter your 6-digit authenticator code</p>
                </div>
                <label className="label">Authenticator Code</label>
                <input name="twoFactorCode" type="text" inputMode="numeric" pattern="[0-9]{6}"
                  maxLength={6} required autoFocus
                  className="input text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  value={form.twoFactorCode} onChange={handleChange} />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary btn-lg w-full mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : needs2FA ? 'Verify' : 'Sign In'}
            </button>
          </form>

          {needs2FA && (
            <button onClick={() => setNeeds2FA(false)}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-200 mt-4 transition-colors">
              ← Back to login
            </button>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
