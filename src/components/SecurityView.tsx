import React, { useState, useEffect } from 'react';
import { AllowedExt } from '../types';
import { ShieldCheck, Lock, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const [extensions, setExtensions] = useState<AllowedExt[]>([]);
  const [newExt, setNewExt] = useState('');
  const [newCat, setNewCat] = useState('Document');

  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    try {
      const res = await fetch('/api/extensions');
      const data = await res.json();
      if (data.success && Array.isArray(data.extensions)) {
        const sorted = [...data.extensions].sort((a, b) =>
          a.extension.toLowerCase().localeCompare(b.extension.toLowerCase())
        );
        setExtensions(sorted);
      }
    } catch (e) {}
  };

  const handleToggleExt = async (id: number) => {
    try {
      const res = await fetch('/api/extensions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchExtensions();
    } catch (e) {}
  };

  const handleAddExt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExt.trim()) return;
    try {
      const res = await fetch('/api/extensions/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extension: newExt, category: newCat }),
      });
      const data = await res.json();
      if (data.success) {
        setNewExt('');
        fetchExtensions();
      }
    } catch (e) {}
  };

  const sortedExtensions = [...extensions].sort((a, b) =>
    a.extension.toLowerCase().localeCompare(b.extension.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            256-Bit AES Cryptographic Vault Hardening
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Security Governance & Controls</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage alphabetical file extension whitelists and encryption parameters.
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

      {/* Alphabetical Whitelist Extension Manager (Full Width) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Allowed Extensions Whitelist (A–Z)
          </h3>
          <span className="text-xs text-slate-500">
            {sortedExtensions.filter((e) => e.is_allowed).length} Active Rules
          </span>
        </div>

        <form onSubmit={handleAddExt} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. mp4, pdf, zip"
            value={newExt}
            onChange={(e) => setNewExt(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none cursor-pointer"
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
            Add
          </button>
        </form>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {sortedExtensions.map((ext) => (
            <div
              key={ext.id}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 min-w-[54px] text-center">
                  .{ext.extension.toUpperCase()}
                </span>
                <span className="text-slate-600 font-semibold">{ext.category}</span>
              </div>

              <button
                onClick={() => handleToggleExt(ext.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  ext.is_allowed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
