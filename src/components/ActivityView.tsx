import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { Activity, CheckCircle2, AlertTriangle, Filter, Download, Trash2, Search } from 'lucide-react';

export const ActivityView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) setLogs(data.logs);
    } catch (e) {}
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) setLogs(data.logs);
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

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
            <Activity className="w-4 h-4" />
            Live System Audit Activity Stream
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Security Activity Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cryptographic telemetry of uploads, decryptions, PIN failures, and admin actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Logs */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
            />
          </div>

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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
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
    </div>
  );
};
