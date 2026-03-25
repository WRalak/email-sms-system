import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon, DocumentTextIcon, TrashIcon, PencilIcon,
  DocumentDuplicateIcon, XMarkIcon, EyeIcon,
} from '@heroicons/react/24/outline';

const categoryColors = {
  marketing:     'badge-purple',
  transactional: 'badge-blue',
  newsletter:    'badge-green',
  notification:  'badge-yellow',
  custom:        'badge-gray',
};

function TemplateModal({ template, onClose, onSave }) {
  const [form, setForm] = useState(template || {
    name: '', type: 'email', category: 'custom',
    subject: '', body: '', htmlBody: '', isPublic: false,
  });
  const [useHtml, setUseHtml] = useState(!!template?.htmlBody);
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, htmlBody: useHtml ? form.htmlBody : '' };
      // Extract variables {{varName}}
      const vars = [...(payload.body + payload.htmlBody).matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
      payload.variables = [...new Set(vars)];

      if (template?._id) {
        const { data } = await api.put(`/api/templates/${template._id}`, payload);
        onSave(data.data, 'updated');
      } else {
        const { data } = await api.post('/api/templates', payload);
        onSave(data.data, 'created');
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{template?._id ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Welcome Email" /></div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {['marketing','transactional','newsletter','notification','custom'].map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Channel</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} className="w-4 h-4 rounded accent-brand-500" />
                <span className="text-sm text-slate-300">Make public (shared)</span>
              </label>
            </div>
          </div>
          {form.type === 'email' && (
            <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Your email subject…" /></div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Body *</label>
              {form.type === 'email' && (
                <button type="button" onClick={() => setUseHtml(h => !h)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${useHtml ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
                  {useHtml ? 'HTML mode' : 'Plain mode'}
                </button>
              )}
            </div>
            {useHtml ? (
              <textarea required={!form.body} className="input font-mono text-xs resize-none" rows={10}
                placeholder="<html>…</html>"
                value={form.htmlBody} onChange={e => setForm(f => ({ ...f, htmlBody: e.target.value }))} />
            ) : (
              <textarea required className="input resize-none" rows={6}
                placeholder="Template body… use {{firstName}} for variables"
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            )}
          </div>
          {/* Variable hint */}
          <div className="flex flex-wrap gap-1.5">
            {['{{firstName}}','{{lastName}}','{{email}}','{{company}}','{{ctaUrl}}'].map(v => (
              <button key={v} type="button"
                onClick={() => setForm(f => ({ ...f, [useHtml ? 'htmlBody' : 'body']: (f[useHtml ? 'htmlBody' : 'body'] || '') + v }))}
                className="font-mono text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-brand-300 hover:border-brand-500/50 transition-colors">
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary btn-md flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-md flex-1">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : template?._id ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ template, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Preview: {template.name}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
        <div className="p-6">
          {template.htmlBody ? (
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <iframe srcDoc={template.htmlBody} title="Email Preview" className="w-full h-96 bg-white" />
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-800 text-sm text-slate-300 whitespace-pre-wrap">{template.body}</div>
          )}
          {template.variables?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Variables</p>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map(v => (
                  <span key={v} className="font-mono text-xs badge-purple">{'{{' + v + '}}'}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [modal, setModal]   = useState(null);
  const [preview, setPreview] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (catFilter)  params.set('category', catFilter);
      const { data } = await api.get(`/api/templates?${params}`);
      setTemplates(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [typeFilter, catFilter]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = (t, action) => {
    toast.success(`Template ${action}`);
    setModal(null);
    fetchTemplates();
  };

  const handleDuplicate = async (id) => {
    await api.post(`/api/templates/${id}/duplicate`);
    toast.success('Template duplicated');
    fetchTemplates();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await api.delete(`/api/templates/${id}`);
    toast.success('Template deleted');
    fetchTemplates();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary btn-md">
          <PlusIcon className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {['', 'email', 'sms'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${typeFilter === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {t || 'All'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {['', 'marketing', 'transactional', 'newsletter', 'notification'].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize transition-all ${catFilter === c ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {c || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <DocumentTextIcon className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No templates yet</p>
          <button onClick={() => setModal('create')} className="btn-primary btn-md mt-4">Create your first template</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t._id} className="card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={categoryColors[t.category] || 'badge-gray'} style={{ textTransform: 'capitalize' }}>{t.category}</span>
                    <span className={t.type === 'email' ? 'badge-purple' : 'badge-blue'}>{t.type}</span>
                    {t.isPublic && <span className="badge-green">Public</span>}
                  </div>
                  <h3 className="font-semibold text-white truncate">{t.name}</h3>
                  {t.subject && <p className="text-xs text-slate-500 truncate mt-0.5">{t.subject}</p>}
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 flex-1">{t.body?.slice(0, 100) || 'HTML template'}</p>

              {t.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.variables.slice(0, 3).map(v => (
                    <span key={v} className="font-mono text-xs badge-gray">{'{{' + v + '}}'}</span>
                  ))}
                  {t.variables.length > 3 && <span className="text-xs text-slate-500">+{t.variables.length - 3} more</span>}
                </div>
              )}

              <div className="flex gap-1.5 pt-2 border-t border-slate-800">
                <button onClick={() => setPreview(t)} className="btn-ghost btn-sm flex-1 text-slate-400 hover:text-slate-200">
                  <EyeIcon className="w-3.5 h-3.5" /> Preview
                </button>
                <button onClick={() => setModal(t)} className="btn-ghost btn-sm p-2 hover:text-brand-400"><PencilIcon className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDuplicate(t._id)} className="btn-ghost btn-sm p-2 hover:text-cyan-400"><DocumentDuplicateIcon className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(t._id)} className="btn-ghost btn-sm p-2 hover:text-red-400"><TrashIcon className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || (modal && modal._id)) && (
        <TemplateModal template={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {preview && <PreviewModal template={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
