import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon, DevicePhoneMobileIcon, PaperAirplaneIcon,
  PaperClipIcon, ClockIcon, UsersIcon, XMarkIcon,
  DocumentTextIcon, MagnifyingGlassIcon, CheckIcon,
} from '@heroicons/react/24/outline';

const TABS = [
  { key: 'email', label: 'Email', Icon: EnvelopeIcon },
  { key: 'sms',   label: 'SMS',   Icon: DevicePhoneMobileIcon },
];

function RecipientPicker({ selected, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [manualEmail, setManualEmail] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      api.get(`/api/contacts?search=${encodeURIComponent(search)}&limit=8`)
        .then(({ data }) => setResults(data.data || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const addContact = (c) => {
    if (!selected.find(s => s._id === c._id)) onChange([...selected, c]);
    setSearch(''); setResults([]);
  };

  const addManual = () => {
    if (!manualEmail) return;
    const pseudoContact = { _id: manualEmail, firstName: manualEmail, email: manualEmail, phone: manualEmail, _manual: true };
    if (!selected.find(s => s._id === manualEmail)) onChange([...selected, pseudoContact]);
    setManualEmail('');
  };

  const remove = (id) => onChange(selected.filter(s => s._id !== id));

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
          {selected.map(c => (
            <span key={c._id} className="flex items-center gap-1.5 bg-brand-600/20 text-brand-300 border border-brand-600/30 rounded-full px-2.5 py-0.5 text-xs">
              {c.firstName} {c.lastName}
              <button onClick={() => remove(c._id)}><XMarkIcon className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {/* Search existing contacts */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search contacts…" value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
          {open && results.length > 0 && (
            <div className="absolute z-20 top-full mt-1 w-full card py-1 shadow-xl max-h-48 overflow-y-auto">
              {results.map(c => (
                <button key={c._id} onMouseDown={() => addContact(c)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 text-left">
                  <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-300 text-xs font-bold">
                    {c.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-slate-500">{c.email || c.phone}</p>
                  </div>
                  {selected.find(s => s._id === c._id) && <CheckIcon className="w-3.5 h-3.5 text-brand-400 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual email / phone */}
        <input className="input w-48" placeholder="Or type email/phone"
          value={manualEmail} onChange={e => setManualEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addManual()} />
        <button onClick={addManual} className="btn-secondary btn-md px-3">Add</button>
      </div>
    </div>
  );
}

export default function ComposePage() {
  const [type, setType]           = useState('email');
  const [subject, setSubject]     = useState('');
  const [body, setBody]           = useState('');
  const [htmlBody, setHtmlBody]   = useState('');
  const [useHtml, setUseHtml]     = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [files, setFiles]         = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending]     = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get(`/api/templates?type=${type}`)
      .then(({ data }) => setTemplates(data.data || [])).catch(() => {});
  }, [type]);

  const applyTemplate = (t) => {
    if (t.subject) setSubject(t.subject);
    if (t.htmlBody) { setHtmlBody(t.htmlBody); setUseHtml(true); }
    else setBody(t.body);
    setShowTemplates(false);
    toast.success(`Template "${t.name}" applied`);
  };

  const handleFileAdd = (e) => {
    const newFiles = [...e.target.files];
    const totalSize = [...files, ...newFiles].reduce((a, f) => a + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) { toast.error('Total attachments exceed 10MB'); return; }
    setFiles(f => [...f, ...newFiles]);
  };

  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const handleSend = async () => {
    if (!recipients.length) { toast.error('Add at least one recipient'); return; }
    if (type === 'email' && !subject) { toast.error('Email subject is required'); return; }
    if (!body && !htmlBody) { toast.error('Message body is required'); return; }

    setSending(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      if (subject)    fd.append('subject', subject);
      fd.append('body', body || 'See HTML content');
      if (useHtml)    fd.append('htmlBody', htmlBody);
      if (scheduledAt) fd.append('scheduledAt', new Date(scheduledAt).toISOString());
      fd.append('isBulk', recipients.length > 1 ? 'true' : 'false');
      recipients.forEach(r => fd.append('recipients', r._manual ? JSON.stringify({ email: r.email, phone: r.phone }) : r._id));
      files.forEach(f => fd.append('attachments', f));

      await api.post('/api/messages/send', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(scheduledAt ? 'Message scheduled!' : 'Message sent!');
      setSubject(''); setBody(''); setHtmlBody(''); setRecipients([]); setFiles([]); setScheduledAt('');
    } catch {} finally { setSending(false); }
  };

  const charCount = body.length;
  const smsSegments = Math.ceil(charCount / 160) || 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Compose</h1>
          <p className="page-subtitle">Send an email or SMS message</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-fit border border-slate-800">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setType(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              type === key ? 'bg-brand-600 text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-5">
        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">To</label>
            <span className="text-xs text-slate-500">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</span>
          </div>
          <RecipientPicker selected={recipients} onChange={setRecipients} />
        </div>

        {/* Subject (email only) */}
        {type === 'email' && (
          <div>
            <label className="label">Subject</label>
            <input className="input" placeholder="Your subject line…" value={subject}
              onChange={e => setSubject(e.target.value)} />
          </div>
        )}

        {/* Template picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Message</label>
            <div className="flex gap-2">
              {type === 'email' && (
                <button onClick={() => setUseHtml(h => !h)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${useHtml ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-500 hover:text-slate-300'}`}>
                  {useHtml ? 'HTML mode' : 'Plain mode'}
                </button>
              )}
              <button onClick={() => setShowTemplates(s => !s)}
                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                <DocumentTextIcon className="w-3.5 h-3.5" />
                Use template
              </button>
            </div>
          </div>

          {/* Template list */}
          {showTemplates && (
            <div className="mb-3 p-3 rounded-lg bg-slate-800 border border-slate-700 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {templates.length === 0 ? <p className="text-xs text-slate-500 col-span-2 text-center py-3">No templates yet</p> :
                templates.map(t => (
                  <button key={t._id} onClick={() => applyTemplate(t)}
                    className="text-left p-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-brand-500/50 transition-colors">
                    <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{t.category}</p>
                  </button>
                ))
              }
            </div>
          )}

          {useHtml && type === 'email' ? (
            <textarea className="input font-mono text-xs resize-none" rows={12}
              placeholder="<html>…</html> — paste or write HTML here"
              value={htmlBody} onChange={e => setHtmlBody(e.target.value)} />
          ) : (
            <div className="relative">
              <textarea className="input resize-none" rows={type === 'sms' ? 5 : 8}
                placeholder={type === 'email' ? 'Write your email… use {{firstName}} for personalization' : 'Your SMS message…'}
                value={body} onChange={e => setBody(e.target.value)} />
              {type === 'sms' && body && (
                <div className="absolute bottom-2 right-3 text-xs text-slate-500">
                  {charCount} chars · {smsSegments} segment{smsSegments !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attachments (email only) */}
        {type === 'email' && (
          <div>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm">
                <PaperClipIcon className="w-3.5 h-3.5" /> Attach Files
              </button>
              <span className="text-xs text-slate-500">Max 10MB total</span>
              <input ref={fileRef} type="file" multiple hidden onChange={handleFileAdd} />
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="text-slate-300">{f.name}</span>
                    <span className="text-slate-500">({(f.size/1024).toFixed(0)}KB)</span>
                    <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule */}
        <div>
          <label className="label flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-slate-500" />
            Schedule (optional)
          </label>
          <input type="datetime-local" className="input w-auto"
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          {scheduledAt && (
            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              Will be sent on {new Date(scheduledAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Send button */}
        <div className="pt-2 flex gap-3">
          <button onClick={handleSend} disabled={sending} className="btn-primary btn-lg flex-1">
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : scheduledAt
                ? <><ClockIcon className="w-4 h-4" /> Schedule</>
                : <><PaperAirplaneIcon className="w-4 h-4" /> Send Now</>
            }
            {!sending && recipients.length > 1 && ` to ${recipients.length} recipients`}
          </button>
          <button onClick={() => { setSubject(''); setBody(''); setHtmlBody(''); setRecipients([]); setFiles([]); setScheduledAt(''); }}
            className="btn-secondary btn-lg">
            Clear
          </button>
        </div>
      </div>

      {/* Personalization tips */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Personalization Variables</p>
        <div className="flex flex-wrap gap-2">
          {['{{firstName}}', '{{lastName}}', '{{email}}', '{{phone}}', '{{company}}'].map(v => (
            <button key={v} onClick={() => { setBody(b => b + v); }}
              className="font-mono text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-brand-300 hover:border-brand-500/50 transition-colors">
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
