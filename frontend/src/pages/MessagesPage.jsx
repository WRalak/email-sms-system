import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon, DevicePhoneMobileIcon, TrashIcon, EyeIcon,
  FunnelIcon, MagnifyingGlassIcon, ClockIcon, XMarkIcon,
  PaperAirplaneIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';

const statusBadge = (status) => {
  const map = {
    sent:      <span className="badge-green">Sent</span>,
    failed:    <span className="badge-red">Failed</span>,
    scheduled: <span className="badge-yellow"><ClockIcon className="w-3 h-3" /> Scheduled</span>,
    sending:   <span className="badge-blue"><ArrowPathIcon className="w-3 h-3 animate-spin" /> Sending</span>,
    draft:     <span className="badge-gray">Draft</span>,
    cancelled: <span className="badge-gray">Cancelled</span>,
  };
  return map[status] || <span className="badge-gray">{status}</span>;
};

function MessageDetailModal({ message, onClose }) {
  if (!message) return null;
  const stats = message.stats || {};
  const pct = (n, d) => d > 0 ? ((n / d) * 100).toFixed(0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {message.type === 'email'
              ? <EnvelopeIcon className="w-5 h-5 text-brand-400" />
              : <DevicePhoneMobileIcon className="w-5 h-5 text-cyan-400" />
            }
            <h2 className="text-lg font-semibold text-white truncate max-w-md">
              {message.subject || message.body?.slice(0, 60)}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total || 0, color: 'text-slate-300' },
              { label: 'Sent',  value: stats.sent  || 0, color: 'text-emerald-400' },
              { label: 'Delivered', value: stats.delivered || 0, color: 'text-blue-400' },
              { label: 'Failed', value: stats.failed || 0, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-lg bg-slate-800">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {message.type === 'email' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Open Rate',  value: pct(stats.opened, stats.sent), n: stats.opened  || 0, color: 'bg-cyan-500' },
                { label: 'Click Rate', value: pct(stats.clicked, stats.sent), n: stats.clicked || 0, color: 'bg-brand-500' },
              ].map(r => (
                <div key={r.label} className="p-3 rounded-lg bg-slate-800">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-400">{r.label}</span>
                    <span className="text-xs text-slate-300 font-medium">{r.n} ({r.value}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700">
                    <div className={`h-full rounded-full ${r.color} transition-all duration-700`} style={{ width: `${r.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-slate-500 w-24">Status</span>
              {statusBadge(message.status)}
            </div>
            <div className="flex gap-3">
              <span className="text-slate-500 w-24">Type</span>
              <span className="text-slate-300 capitalize">{message.type}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-slate-500 w-24">Created</span>
              <span className="text-slate-300">{new Date(message.createdAt).toLocaleString()}</span>
            </div>
            {message.sentAt && (
              <div className="flex gap-3">
                <span className="text-slate-500 w-24">Sent At</span>
                <span className="text-slate-300">{new Date(message.sentAt).toLocaleString()}</span>
              </div>
            )}
            {message.scheduledAt && (
              <div className="flex gap-3">
                <span className="text-slate-500 w-24">Scheduled</span>
                <span className="text-amber-400">{new Date(message.scheduledAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Body preview */}
          {message.body && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Body Preview</p>
              <div className="p-3 rounded-lg bg-slate-800 text-sm text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {message.body}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((a, i) => (
                  <span key={i} className="badge-gray text-xs">{a.originalName}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [detail, setDetail]     = useState(null);
  const LIMIT = 20;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (typeFilter)   params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/api/messages?${params}`);
      setMessages(data.data || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/api/messages/${id}`);
      setDetail(data.data);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await api.delete(`/api/messages/${id}`);
    toast.success('Message deleted');
    fetchMessages();
  };

  const handleCancel = async (id) => {
    await api.patch(`/api/messages/${id}/cancel`);
    toast.success('Scheduled message cancelled');
    fetchMessages();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">{total.toLocaleString()} total messages</p>
        </div>
        <Link to="/compose" className="btn-primary btn-md">
          <PaperAirplaneIcon className="w-4 h-4" /> Compose
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="input pl-9 pr-8 appearance-none w-36" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select className="input pl-9 pr-8 appearance-none w-40" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {['sent', 'scheduled', 'sending', 'failed', 'draft', 'cancelled'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Type</th>
                <th>Recipients</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <EnvelopeIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No messages yet</p>
                  <Link to="/compose" className="btn-primary btn-sm mt-3 inline-flex">Send your first message</Link>
                </td></tr>
              ) : messages.map(m => {
                const deliveryPct = m.stats?.total > 0 ? Math.round((m.stats?.sent || 0) / m.stats.total * 100) : 0;
                return (
                  <tr key={m._id}>
                    <td>
                      <p className="font-medium text-slate-200 max-w-[200px] truncate">
                        {m.subject || m.body?.slice(0, 55) || '—'}
                      </p>
                      {m.campaign && <p className="text-xs text-slate-500 truncate">Campaign: {m.campaign.name}</p>}
                    </td>
                    <td>
                      <span className={m.type === 'email' ? 'badge-purple' : 'badge-blue'}>
                        {m.type === 'email'
                          ? <><EnvelopeIcon className="w-3 h-3" /> Email</>
                          : <><DevicePhoneMobileIcon className="w-3 h-3" /> SMS</>
                        }
                      </span>
                    </td>
                    <td className="text-slate-400">{m.stats?.total || 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${deliveryPct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{deliveryPct}%</span>
                      </div>
                    </td>
                    <td>{statusBadge(m.status)}</td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">
                      {m.scheduledAt
                        ? <span className="text-amber-400">{new Date(m.scheduledAt).toLocaleString()}</span>
                        : new Date(m.createdAt).toLocaleDateString()
                      }
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(m._id)} className="btn-ghost btn-sm p-1.5 hover:text-brand-400" title="View"><EyeIcon className="w-3.5 h-3.5" /></button>
                        {m.status === 'scheduled' && (
                          <button onClick={() => handleCancel(m._id)} className="btn-ghost btn-sm p-1.5 hover:text-amber-400" title="Cancel"><XMarkIcon className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => handleDelete(m._id)} className="btn-ghost btn-sm p-1.5 hover:text-red-400" title="Delete"><TrashIcon className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm px-3 disabled:opacity-40">←</button>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm px-3 disabled:opacity-40">→</button>
          </div>
        </div>
      )}

      {detail && <MessageDetailModal message={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
