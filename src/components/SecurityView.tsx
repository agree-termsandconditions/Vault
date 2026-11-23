import React, { useState, useEffect } from 'react';
import { AllowedExt } from '../types';
import { ShieldCheck, Lock, Plus, ToggleLeft, ToggleRight, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

const DEFAULT_ALLOWED_EXTENSIONS: AllowedExt[] = [
  { id: 1, extension: 'csv', category: 'Spreadsheet', mime_type: 'text/csv', is_allowed: true },
  { id: 2, extension: 'doc', category: 'Document', mime_type: 'application/msword', is_allowed: true },
  { id: 3, extension: 'docx', category: 'Document', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', is_allowed: true },
  { id: 4, extension: 'enc', category: 'Encrypted', mime_type: 'application/octet-stream', is_allowed: true },
  { id: 5, extension: 'jpeg', category: 'Image', mime_type: 'image/jpeg', is_allowed: true },
  { id: 6, extension: 'jpg', category: 'Image', mime_type: 'image/jpeg', is_allowed: true },
  { id: 7, extension: 'mp3', category: 'Audio', mime_type: 'audio/mpeg', is_allowed: true },
  { id: 8, extension: 'mp4', category: 'Video', mime_type: 'video/mp4', is_allowed: true },
  { id: 9, extension: 'pdf', category: 'Document', mime_type: 'application/pdf', is_allowed: true },
  { id: 10, extension: 'pem', category: 'Key', mime_type: 'application/x-pem-file', is_allowed: true },
  { id: 11, extension: 'png', category: 'Image', mime_type: 'image/png', is_allowed: true },
  { id: 12, extension: 'pptx', category: 'Presentation', mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', is_allowed: true },
  { id: 13, extension: 'txt', category: 'Document', mime_type: 'text/plain', is_allowed: true },
  { id: 14, extension: 'wav', category: 'Audio', mime_type: 'audio/wav', is_allowed: true },
  { id: 15, extension: 'xls', category: 'Spreadsheet', mime_type: 'application/vnd.ms-excel', is_allowed: true },
  { id: 16, extension: 'xlsx', category: 'Spreadsheet', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', is_allowed: true },
  { id: 17, extension: 'zip', category: 'Archive', mime_type: 'application/zip', is_allowed: true },
];

export const SecurityView: React.FC = () => {
  const [extensions, setExtensions] = useState<AllowedExt[]>(DEFAULT_ALLOWED_EXTENSIONS);
  const [newExt, setNewExt] = useState('');
  const [newCat, setNewCat] = useState('Document');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchExtensions();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchExtensions = async () => {
    try {
      const res = await apiFetch('/api/extensions');
      const data = await res.json();
      if (data.success && Array.isArray(data.extensions) && data.extensions.length > 0) {
        const sorted = [...data.extensions].sort((a, b) =>
          a.extension.toLowerCase().localeCompare(b.extension.toLowerCase())
        );
        setExtensions(sorted);
      }
    } catch (_e) {}
  };

  const handleToggleExt = async (id: number) => {
    // Optimistic update
    setExtensions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_allowed: !item.is_allowed } : item))
    );
    try {
      const res = await apiFetch('/api/extensions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.extensions) && data.extensions.length > 0) {
          setExtensions(data.extensions);
        } else {
          fetchExtensions();
        }
        const target = data.extension || extensions.find((x) => x.id === id);
        if (target) {
          showToast(
            `.${String(target.extension).toUpperCase()} is now ${target.is_allowed ? 'ALLOWED' : 'BLOCKED'}`
          );
        }
      }
    } catch (_e) {}
  };

  const handleAddExt = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleaned) return;
    try {
      const res = await apiFetch('/api/extensions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extension: cleaned, category: newCat }),
      });
      const data = await res.json();
      if (data.success) {
        setNewExt('');
        if (Array.isArray(data.extensions) && data.extensions.length > 0) {
          setExtensions(data.extensions);
        } else {
          fetchExtensions();
        }
        showToast(`Added .${cleaned.toUpperCase()} (${newCat}) to Allowed File Extensions Whitelist`);
      }
    } catch (_e) {}
  };

  const handleDeleteExt = async (id: number, extName: string) => {
    try {
      const res = await apiFetch('/api/extensions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.extensions)) {
          setExtensions(data.extensions);
        } else {
          fetchExtensions();
        }
        showToast(`Removed .${extName.toUpperCase()} from extension rules`);
      }
    } catch (_e) {}
  };

  const sortedExtensions = [...extensions].sort((a, b) =>
    a.extension.toLowerCase().localeCompare(b.extension.toLowerCase())
  );
  const allowedList = sortedExtensions.filter((e) => e.is_allowed);
  const blockedList = sortedExtensions.filter((e) => !e.is_allowed);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {toast}
          </span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            256-Bit AES Cryptographic Vault Hardening
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Security Governance & Allowed Extensions</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage alphabetical file extension whitelists, magic-byte inspection rules, and encryption parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Cipher Algorithm</p>
            <p className="text-sm font-extrabold text-blue-600">AES-256-CBC</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">PBKDF2 Iterations</p>
            <p className="text-sm font-extrabold text-slate-900">10,000 Sha256</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Bar of All Allowed Extensions */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Active Allowed File Extensions ({allowedList.length} Allowed / {blockedList.length} Blocked)
            </span>
          </div>
          <button
            type="button"
            onClick={fetchExtensions}
            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync List</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {sortedExtensions.map((ext) => (
            <button
              key={ext.id}
              type="button"
              onClick={() => handleToggleExt(ext.id)}
              className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs border transition cursor-pointer inline-flex items-center gap-1 ${
                ext.is_allowed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-300 line-through opacity-75 hover:opacity-100'
              }`}
              title={`Click to ${ext.is_allowed ? 'Block' : 'Allow'} .${ext.extension.toUpperCase()} (${ext.category})`}
            >
              <span>.{ext.extension.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alphabetical Whitelist Extension Manager (Full Width) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Allowed Extensions Whitelist (A–Z)
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            {allowedList.length} of {sortedExtensions.length} Extensions Allowed
          </span>
        </div>

        <form onSubmit={handleAddExt} className="flex flex-wrap sm:flex-nowrap gap-2">
          <input
            type="text"
            placeholder="Add extension (e.g. md, json, ppt, rtf, 7z)..."
            value={newExt}
            onChange={(e) => setNewExt(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Document">Document</option>
            <option value="Spreadsheet">Spreadsheet</option>
            <option value="Presentation">Presentation</option>
            <option value="Archive">Archive</option>
            <option value="Image">Image</option>
            <option value="Audio">Audio</option>
            <option value="Video">Video</option>
            <option value="Encrypted">Encrypted</option>
            <option value="Key">Key</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Extension
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
          {sortedExtensions.map((ext) => (
            <div
              key={ext.id}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 border border-slate-200 p-3 rounded-xl text-xs transition"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 min-w-[60px] text-center">
                  .{ext.extension.toUpperCase()}
                </span>
                <div>
                  <span className="text-slate-800 font-bold block">{ext.category}</span>
                  <span className="text-[10px] text-slate-400">
                    {ext.is_allowed ? 'Permitted for campus uploads' : 'Blocked by security policy'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleExt(ext.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    ext.is_allowed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {ext.is_allowed ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" /> Allowed
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-rose-600" /> Blocked
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExt(ext.id, ext.extension)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title={`Remove .${ext.extension.toUpperCase()}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

