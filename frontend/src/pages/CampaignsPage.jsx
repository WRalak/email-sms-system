import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon, MegaphoneIcon, PlayIcon, PauseIcon, TrashIcon,
  XMarkIcon, ClockIcon, UsersIcon, ChartBarIcon, EyeIcon,
} from '@heroicons/react/24/outline';

const statusColors = {
  draft:     'badge-gray',
  scheduled: 'badge-yellow',
  active:    'badge-green',
  paused:    'badge-yellow',
  completed: 'badge-blue',
  cancelled: 'badge-red',
};

function CampaignModal({ campaign, onClose, onSave }) {
  const [form, setForm] = useState(campaign || {
    name: '', description: '', type: 'email', subject: '', body: '',
    targetLists: '', targetTags: '', scheduledAt: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetLists: form.targetLists ? form.targetLists.split(',').map(s => s.trim()).filter(Boolean) : [],
        targetTags:  form.targetTags  ? form.targetTags.split(',').map(s => s.trim()).filter(Boolean)  : [],
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      };
      if (campaign?._id) {
        const { data } = await api.put(`/api/campaigns/${campaign._id}`, payload);
        onSave(data.data, 'updated');
      } else {
        const { data } = await api.post('/api/campaigns', payload);
        onSave(data.data, 'created');
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{campaign?._id ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Campaign Name *</label><input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Summer Sale 2024" /></div>
          <div><label className="label">Description</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Campaign overview…" /></div>
          <div>
            <label className="label">Channel</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="mixed">Mixed (Email + SMS)</option>
            </select>
          </div>
          {(form.type === 'email' || form.type === 'mixed') && (
            <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Your email subject…" /></div>
          )}
          <div><label className="label">Message Body</label><textarea className="input resize-none" rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Your campaign message… use {{firstName}} for personalization" /></div>
          <div><label className="label">Target Lists <span className="text-slate-500 font-normal">(comma-separated)</span></label><input className="input" value={form.targetLists} onChange={e => setForm(f => ({ ...f, targetLists: e.target.value }))} placeholder="newsletter, customers" /></div>
          <div><label className="label">Target Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label><input className="input" value={form.targetTags} onChange={e => setForm(f => ({ ...f, targetTags: e.target.value }))} placeholder="vip, prospect" /></div>
          <div>
            <label className="label flex items-center gap-2"><ClockIcon className="w-4 h-4 text-slate-500" />Schedule (optional)</label>
            <input type="datetime-local" className="input" value={form.scheduledAt}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary btn-md flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-md flex-1">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : campaign?._id ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/api/campaigns?${params}`);
      setCampaigns(data.data || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleSave = (campaign, action) => {
    toast.success(`Campaign ${action}`);
    setModal(null);
    fetchCampaigns();
  };

  const handleLaunch = async (id) => {
    if (!window.confirm('Launch this campaign now?')) return;
    try {
      const { data } = await api.post(`/api/campaigns/${id}/launch`);
      toast.success(data.message || 'Campaign launched!');
      fetchCampaigns();
    } catch {}
  };

  const handlePause = async (id) => {
    await api.patch(`/api/campaigns/${id}/pause`);
    toast.success('Campaign paused');
    fetchCampaigns();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    await api.delete(`/api/campaigns/${id}`);
    toast.success('Campaign deleted');
    fetchCampaigns();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">{total} campaign{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary btn-md">
          <PlusIcon className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'scheduled', 'active', 'paused', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn-sm rounded-lg px-3 ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <MegaphoneIcon className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No campaigns yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Create a campaign to send messages to a group of contacts at once</p>
          <button onClick={() => setModal('create')} className="btn-primary btn-md">Create Campaign</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(c => {
            const sentPct  = c.stats?.total > 0 ? Math.round((c.stats.sent  / c.stats.total) * 100) : 0;
            const openPct  = c.stats?.sent  > 0 ? Math.round((c.stats.opened / c.stats.sent)  * 100) : 0;
            return (
              <div key={c._id} className="card-hover p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={statusColors[c.status] || 'badge-gray'}>{c.status}</span>
                      <span className="badge-gray capitalize">{c.type}</span>
                    </div>
                    <h3 className="font-semibold text-white truncate">{c.name}</h3>
                    {c.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Contacts', value: c.contactCount || 0 },
                    { label: 'Sent',     value: `${sentPct}%` },
                    { label: 'Opened',   value: `${openPct}%` },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/60 rounded-lg p-2">
                      <p className="text-base font-bold text-white">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {c.scheduledAt && (
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    Scheduled: {new Date(c.scheduledAt).toLocaleString()}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-800">
                  {['draft', 'paused'].includes(c.status) && (
                    <button onClick={() => handleLaunch(c._id)} className="btn-success btn-sm flex-1">
                      <PlayIcon className="w-3.5 h-3.5" /> Launch
                    </button>
                  )}
                  {c.status === 'active' && (
                    <button onClick={() => handlePause(c._id)} className="btn-secondary btn-sm flex-1">
                      <PauseIcon className="w-3.5 h-3.5" /> Pause
                    </button>
                  )}
                  {['draft', 'paused', 'scheduled'].includes(c.status) && (
                    <button onClick={() => setModal(c)} className="btn-secondary btn-sm flex-1">
                      <PlusIcon className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {['draft', 'cancelled'].includes(c.status) && (
                    <button onClick={() => handleDelete(c._id)} className="btn-ghost btn-sm p-2 hover:text-red-400">
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal === 'create' || (modal && modal._id)) && (
        <CampaignModal campaign={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}
