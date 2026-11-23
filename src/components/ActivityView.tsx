import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { apiFetch } from '../utils/apiFetch';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Download,
  Trash2,
  Search,
  Database,
  History,
  Users,
  HardDrive,
} from 'lucide-react';

interface UploadHistoryEntry {
  id: number;
  file_id: number;
  original_name: string;
  file_extension: string;
  file_size_formatted: string;
  department: string;
  tags: string[];
  uploader_emp_id: string;
  uploader_name: string;
  access_mode: 'PUBLIC' | 'PIN_PROTECTED';
  upload_source: 'FILE_UPLOAD' | 'QUICK_NOTE' | 'WEB_LINK' | 'SEED';
  client_ip: string;
  status: string;
  uploaded_at: string;
}

const INITIAL_SEED_LOGS: AuditLog[] = [
  {
    id: 1,
    emp_id: 'AKISH (MASTER ADMIN)',
    action: 'SYSTEM_BOOT',
    file_name: 'vault.sqlite',
    status: 'SUCCESS',
    details: 'Initialized AES-256-CBC Vault SQLite Database & Shared Users DB (users_db.json)',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 2,
    emp_id: 'EMP-1001 (Dr. Meera Nair)',
    action: 'UPLOAD',
    file_name: 'Human Body Anatomy Physiology Notes.pdf',
    status: 'SUCCESS',
    details: 'Uploaded PDF (1.4 MB) to Science [#Sci, #6, #A] • 8-Byte Magic Signature Verified',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
  {
    id: 3,
    emp_id: 'EMP-1002 (Prof. Rajesh Iyer)',
    action: 'UPLOAD',
    file_name: 'Algebraic_Identities_Linear_Equations_Grade7.docx',
    status: 'SUCCESS',
    details: 'Uploaded DOCX (380 KB) to Mathematics [#Math, #7, #B] • Public Access',
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 4,
    emp_id: 'EMP-1004 (Kavitha Rao)',
    action: 'UPLOAD_PROTECTED',
    file_name: 'Python_Data_Structures_Algorithms_Handout.pdf',
    status: 'SUCCESS',
    details: 'Uploaded PIN-Protected PDF (1.8 MB) to Computer Science [#CS, #9, #A]',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 5,
    emp_id: 'GUEST_STUDENT',
    action: 'ACCESS_DECRYPT',
    file_name: 'Human Body Anatomy Physiology Notes.pdf',
    status: 'SUCCESS',
    details: 'Opened & previewed Public Note in Science department',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 6,
    emp_id: 'AKISH (MASTER ADMIN)',
    action: 'EXTENSION_GOVERNANCE',
    file_name: 'Allowed Extensions Whitelist',
    status: 'SUCCESS',
    details: 'Verified 17 A–Z allowed file extensions (CSV, DOC, DOCX, PDF, PNG, JPG, XLSX, ZIP...)',
    created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];

export const ActivityView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'uploads'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_SEED_LOGS);
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);
  const [dbSummary, setDbSummary] = useState<any>(null);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchUploadHistory();
    fetchDbSummary();
    const interval = setInterval(() => {
      fetchLogs();
      fetchUploadHistory();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch('/api/logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
        setLogs(data.logs);
      }
    } catch (_e) {}
  };

  const fetchUploadHistory = async () => {
    try {
      const res = await apiFetch('/api/db/upload-history');
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setUploadHistory(data.history);
      }
    } catch (e) {}
  };

  const fetchDbSummary = async () => {
    try {
      const res = await apiFetch('/api/db/summary');
      const data = await res.json();
      if (data.success) setDbSummary(data.database || data);
    } catch (e) {}
  };

  const handleClearLogs = async () => {
    try {
      const res = await apiFetch('/api/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (e) {}
  };

  const handleDownloadDbFile = async (type: 'users' | 'sqlite' | 'full', filename: string) => {
    try {
      const res = await apiFetch(`/api/db/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (e) {}
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Emp ID', 'Action', 'Target File', 'Status', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.created_at,
      `"${l.emp_id}"`,
      `"${l.action}"`,
      `"${l.file_name}"`,
      l.status,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vault_audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      filterAction === 'ALL' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.emp_id.toLowerCase().includes(q) ||
      log.file_name.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    return matchesAction && matchesSearch;
  });

  const filteredUploadHistory = uploadHistory.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.original_name.toLowerCase().includes(q) ||
      item.uploader_name.toLowerCase().includes(q) ||
      item.uploader_emp_id.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Shared SQLite & Portable Users DB Panel */}
      <div className="bg-white border border-blue-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 uppercase tracking-wider">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Unified SQLite Database & Portable Cross-App Users DB</span>
          </div>
          <p className="text-xs text-slate-600">
            All <strong>Users ({dbSummary?.tables?.users ?? '10'})</strong>,{' '}
            <strong>Files ({dbSummary?.tables?.active_files ?? dbSummary?.tables?.files ?? '10'})</strong>,{' '}
            <strong>File Upload History ({dbSummary?.tables?.file_upload_history ?? uploadHistory.length})</strong>, and{' '}
            <strong>Audit Logs ({dbSummary?.tables?.audit_logs ?? logs.length})</strong> are stored in{' '}
            <code className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
              /database/vault.sqlite
            </code>{' '}
            and synced to{' '}
            <code className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              /database/users_db.json
            </code>{' '}
            so you can share the exact same Users DB with another app (or verify logins via{' '}
            <code className="font-mono text-slate-800">POST /api/db/auth-verify</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDownloadDbFile('users', 'users_db.json')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Download Portable Users DB JSON for use in another application"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Download Shared Users DB (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownloadDbFile('sqlite', 'vault.sqlite')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            title="Download full SQLite3 database file (users, files, file_upload_history, audit_logs)"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Download vault.sqlite</span>
          </button>
        </div>
      </div>

      {/* Main Logs & Upload History Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('logs')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubTab === 'logs'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Security Audit Logs ({logs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('uploads')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition ${
                  activeSubTab === 'uploads'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>File Upload History DB ({uploadHistory.length})</span>
              </button>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {activeSubTab === 'logs' ? 'Security Activity Logs' : 'File Upload History Database'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSubTab === 'logs'
                ? 'Real-time cryptographic telemetry of uploads, decryptions, PIN failures, and admin actions.'
                : 'Persistent relational ledger of every file, study note, and link uploaded to the Vault database.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeSubTab === 'logs' ? 'Search logs...' : 'Search upload history...'}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
              />
            </div>

            {activeSubTab === 'logs' && (
              <>
                {/* Action Filter */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-semibold">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filter:</span>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Actions ({logs.length})</option>
                    <option value="UPLOAD">Uploads</option>
                    <option value="ACCESS">Decryption / Access</option>
                    <option value="DELETE">Deletions / Purges</option>
                    <option value="ADMIN">Admin Governance</option>
                    <option value="AUTH">Authentication</option>
                  </select>
                </div>

                {/* Export CSV */}
                <button
                  onClick={handleExportCsv}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Export Audit Trail as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export CSV</span>
                </button>

                {/* Clear Logs */}
                <button
                  onClick={handleClearLogs}
                  className="border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Reset Audit Logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {activeSubTab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] bg-slate-50/60">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User / Actor</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Target Record</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.emp_id}</td>
                    <td className="py-3 px-3">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[180px]">{log.file_name}</td>
                    <td className="py-3 px-3 text-slate-600">{log.details}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                        )}
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] bg-slate-50/60">
                  <th className="py-2.5 px-3">Uploaded At</th>
                  <th className="py-2.5 px-3">Uploader</th>
                  <th className="py-2.5 px-3">File / Note Name</th>
                  <th className="py-2.5 px-3">Dept & Tags</th>
                  <th className="py-2.5 px-3">Size & Source</th>
                  <th className="py-2.5 px-3 text-right">Access Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUploadHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-blue-50/30 transition">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(h.uploaded_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{h.uploader_name}</div>
                      <div className="text-[10px] text-slate-400">{h.uploader_emp_id}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 max-w-[220px] truncate">
                      {h.original_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 mr-1.5">{h.department}</span>
                      {(h.tags || []).slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1"
                        >
                          #{t}
                        </span>
                      ))}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.file_size_formatted} •{' '}
                      <span className="text-[10px] text-slate-400">
                        {h.upload_source || (h as any).action_type || 'UPLOAD'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          h.access_mode === 'PUBLIC'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {h.access_mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
