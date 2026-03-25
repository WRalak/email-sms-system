import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon,
  ArrowUpTrayIcon, TagIcon, EnvelopeIcon, DevicePhoneMobileIcon,
  XMarkIcon, UserCircleIcon, FunnelIcon,
} from '@heroicons/react/24/outline';

const emptyContact = { firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', tags: '', emailSubscribed: true, smsSubscribed: false, notes: '' };

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact ? { ...contact, tags: contact.tags?.join(', ') || '' } : emptyContact);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      if (contact?._id) {
        const { data } = await api.put(`/api/contacts/${contact._id}`, payload);
        onSave(data.data, 'updated');
      } else {
        const { data } = await api.post('/api/contacts', payload);
        onSave(data.data, 'created');
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{contact?._id ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input required className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Jane" /></div>
            <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Smith" /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
          <div><label className="label">Phone</label><input type="tel" className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Company</label><input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc." /></div>
            <div><label className="label">Job Title</label><input className="input" value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))} placeholder="Marketing Lead" /></div>
          </div>
          <div><label className="label">Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label><input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, newsletter, prospect" /></div>
          <div><label className="label">Notes</label><textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-4">
            {[['emailSubscribed','Email Subscribed'],['smsSubscribed','SMS Subscribed']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary btn-md flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-md flex-1">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : contact?._id ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImported }) {
  const [csv, setCsv] = useState('');
  const [loading, setLoading] = useState(false);

  const parseAndImport = async () => {
    setLoading(true);
    try {
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
      const contacts = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return {
          firstName: obj.firstname || obj.first_name || obj.name || '',
          lastName:  obj.lastname  || obj.last_name  || '',
          email:     obj.email || '',
          phone:     obj.phone || obj.phonenumber || '',
          company:   obj.company || '',
        };
      }).filter(c => c.firstName || c.email);

      const { data } = await api.post('/api/contacts/bulk-import', { contacts });
      toast.success(`Imported ${data.imported} contacts`);
      onImported();
      onClose();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Import Contacts (CSV)</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-brand-600/10 border border-brand-600/25 text-sm text-brand-300">
            Expected columns: <code className="font-mono">firstName, lastName, email, phone, company</code>
          </div>
          <div>
            <label className="label">Paste CSV Data</label>
            <textarea className="input font-mono text-xs resize-none" rows={8} value={csv} onChange={e => setCsv(e.target.value)} placeholder={`firstName,lastName,email,phone\nJane,Smith,jane@example.com,+1555000001`} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={parseAndImport} disabled={!csv.trim() || loading} className="btn-primary btn-md flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [allTags, setAllTags]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'create' | contact obj
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const LIMIT = 25;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search)    params.set('search', search);
      if (tagFilter) params.set('tag', tagFilter);
      const { data } = await api.get(`/api/contacts?${params}`);
      setContacts(data.data || []);
      setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search, tagFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => {
    api.get('/api/contacts/tags').then(({ data }) => setAllTags(data.data || [])).catch(() => {});
  }, []);

  const handleSave = (contact, action) => {
    toast.success(`Contact ${action}`);
    setModal(null);
    fetchContacts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await api.delete(`/api/contacts/${id}`);
    toast.success('Contact deleted');
    fetchContacts();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} contacts?`)) return;
    await Promise.all([...selected].map(id => api.delete(`/api/contacts/${id}`)));
    toast.success(`${selected.size} contacts deleted`);
    setSelected(new Set());
    fetchContacts();
  };

  const toggleSelect = (id) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelected(s => s.size === contacts.length ? new Set() : new Set(contacts.map(c => c._id)));
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{total.toLocaleString()} contacts total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary btn-md">
            <ArrowUpTrayIcon className="w-4 h-4" /> Import
          </button>
          <button onClick={() => setModal('create')} className="btn-primary btn-md">
            <PlusIcon className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search contacts…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {allTags.length > 0 && (
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select className="input pl-9 pr-8 appearance-none" value={tagFilter}
              onChange={e => { setTagFilter(e.target.value); setPage(1); }}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="btn-danger btn-md">
            <TrashIcon className="w-4 h-4" /> Delete ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" checked={selected.size === contacts.length && contacts.length > 0}
                    onChange={toggleAll} className="w-4 h-4 rounded accent-brand-500" />
                </th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Subscribed</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <UserCircleIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No contacts found</p>
                  <button onClick={() => setModal('create')} className="btn-primary btn-sm mt-3">Add your first contact</button>
                </td></tr>
              ) : contacts.map(c => (
                <tr key={c._id}>
                  <td><input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelect(c._id)} className="w-4 h-4 rounded accent-brand-500" /></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.firstName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{c.firstName} {c.lastName}</p>
                        {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="text-slate-400">{c.email || <span className="text-slate-600">—</span>}</td>
                  <td className="text-slate-400">{c.phone || <span className="text-slate-600">—</span>}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.slice(0, 2).map(t => <span key={t} className="badge-gray text-xs">{t}</span>)}
                      {c.tags?.length > 2 && <span className="text-xs text-slate-500">+{c.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {c.emailSubscribed && <span className="badge-green"><EnvelopeIcon className="w-3 h-3" /></span>}
                      {c.smsSubscribed   && <span className="badge-blue"><DevicePhoneMobileIcon className="w-3 h-3" /></span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setModal(c)} className="btn-ghost btn-sm p-1.5 hover:text-brand-400"><PencilIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn-ghost btn-sm p-1.5 hover:text-red-400"><TrashIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-sm px-3 disabled:opacity-40">←</button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`btn-sm px-3 rounded-lg ${page === p ? 'btn-primary' : 'btn-secondary'}`}>{p}</button>
            ))}
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-sm px-3 disabled:opacity-40">→</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {(modal === 'create' || (modal && modal._id)) && (
        <ContactModal contact={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={fetchContacts} />}
    </div>
  );
}
