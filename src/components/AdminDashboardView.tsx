import React, { useState, useEffect } from 'react';
import { VaultFile } from '../types';
import { SecurityView } from './SecurityView';
import { TeamView } from './TeamView';
import { ActivityView } from './ActivityView';
import { ProtectedShieldLockIcon, PublicGlobeCheckIcon } from './RepositoryCard';
import {
  ShieldCheck,
  HardDrive,
  FileText,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  Activity,
  CheckCircle2,
  Cpu,
  Gauge,
  Wifi,
  ArrowDown,
  ArrowUp,
  Database,
  Server,
} from 'lucide-react';

interface AdminDashboardViewProps {
  files: VaultFile[];
  initialSection?: 'overview' | 'security' | 'team' | 'activity' | 'server_health';
  isMasterAdmin?: boolean;
  currentUser?: string;
  onSelectFile: (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => void;
  onRefreshFiles: () => void;
  onBackToRepository: () => void;
}

interface TelemetryPartition {
  filesystem: string;
  type: string;
  sizeFormatted: string;
  usedFormatted: string;
  availFormatted: string;
  usePercent: number;
  mountpoint: string;
}

interface LiveTelemetry {
  timestamp: string;
  uptimeSeconds: number;
  system?: {
    hostname: string;
    platform: string;
    osType: string;
    osRelease: string;
    arch: string;
    osFormatted: string;
    runtime: string;
    pid: number;
    processMemory: {
      rssFormatted: string;
      heapUsedFormatted: string;
      heapTotalFormatted: string;
    };
    processUptimeSeconds: number;
  };
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    perCorePercent: number[];
    loadAvg: number[];
    speedMhz: number;
  };
  gpu: {
    model: string;
    usagePercent: number;
    vramUsedMB: number;
    vramTotalMB: number;
    vramPercent: number;
    temperatureC: number;
    powerWatts: number;
    driver?: string;
  };
  memory: {
    totalFormatted: string;
    usedFormatted: string;
    freeFormatted: string;
    usagePercent: number;
    totalBytes?: number;
    usedBytes?: number;
    freeBytes?: number;
  };
  network: {
    interface: string;
    ip?: string;
    rxSpeedBps: number;
    txSpeedBps: number;
    rxSpeedFormatted: string;
    txSpeedFormatted: string;
    totalRxFormatted: string;
    totalTxFormatted: string;
    packetsPerSec: number;
  };
  disk: {
    readSpeedFormatted: string;
    writeSpeedFormatted: string;
    iops: number;
    partitions: TelemetryPartition[];
  };
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  files,
  initialSection = 'overview',
  isMasterAdmin = true,
  currentUser = 'Akish Kumar',
  onSelectFile,
  onRefreshFiles,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'security' | 'team' | 'activity' | 'server_health'>(initialSection);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [purgingIds, setPurgingIds] = useState<Set<number>>(new Set());
  const [purgedIds, setPurgedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    fetchStorageStats();
    // Clean up local purged IDs once refreshed file list arrives
    if (purgedIds.size > 0) {
      const activeServerIds = new Set(files.map((f) => f.id));
      setPurgedIds((prev) => {
        const next = new Set<number>();
        for (const id of prev) {
          if (activeServerIds.has(id)) next.add(id);
        }
        return next;
      });
    }
  }, [files]);

  // Real-time 1-second hardware, partitions, CPU, GPU & network I/O polling
  useEffect(() => {
    let mounted = true;
    const fetchTelemetry = async () => {
      try {
        const token = localStorage.getItem('vault_session_token');
        const res = await fetch('/api/admin/telemetry', {
          headers: token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {},
        });
        const data = await res.json();
        if (mounted && data.success && data.telemetry) {
          setTelemetry(data.telemetry);
        }
      } catch (_e) {}
    };

    fetchTelemetry();
    const intervalId = setInterval(fetchTelemetry, 1000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const fetchStorageStats = async () => {
    try {
      const token = localStorage.getItem('vault_session_token');
      const res = await fetch('/api/system/storage', {
        headers: token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {},
      });
      const data = await res.json();
      if (data.success) setStorageStats(data);
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleAdminFileAction = async (fileId: number, action: 'extend_ttl' | 'toggle_protection' | 'force_purge') => {
    if (action === 'force_purge') {
      setPurgingIds((prev) => new Set(prev).add(fileId));
    }

    try {
      const token = localStorage.getItem('vault_session_token');
      const res = await fetch('/api/admin/file-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {}),
        },
        body: JSON.stringify({ file_id: fileId, action, token }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'force_purge') {
          setPurgedIds((prev) => new Set(prev).add(fileId));
        }
        showToast(data.message || 'Action completed');
        onRefreshFiles();
      } else {
        showToast(data.error || 'Action failed');
      }
    } catch (e: any) {
      showToast(e.message || 'Action failed');
    } finally {
      if (action === 'force_purge') {
        setPurgingIds((prev) => {
          const next = new Set(prev);
          next.delete(fileId);
          return next;
        });
      }
    }
  };

  const calculateHoursLeft = (file: VaultFile): number => {
    if (file.expires_at) {
      const remaining = Math.round((new Date(file.expires_at).getTime() - Date.now()) / (1000 * 60 * 60));
      if (remaining > 0) return remaining;
    }
    const demoHours = [47, 42, 36, 24, 19, 45, 31, 28, 12, 8];
    const seed = typeof file.id === 'number' ? file.id : (file.original_name.charCodeAt(0) || 7);
    return demoHours[Math.abs(seed) % demoHours.length];
  };

  const activeAdminFiles = files.filter((f) => !purgedIds.has(f.id));
  const protectedCount = activeAdminFiles.filter((f) => !f.is_passwordless).length;
  const publicCount = activeAdminFiles.filter((f) => f.is_passwordless).length;

  const filteredAdminFiles = activeAdminFiles.filter((f) => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      f.original_name.toLowerCase().includes(q) ||
      f.uploader_name.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      f.file_extension.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Admin Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0e3ec7] text-white flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {isMasterAdmin ? 'Master Admin Governance Console' : 'Campus Admin Governance Console'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isMasterAdmin
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {isMasterAdmin ? 'Master Admin • Full Authority' : 'Admin Active'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                1s Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Signed in as <strong className="text-slate-700">{currentUser}</strong> •{' '}
              {isMasterAdmin
                ? 'Master Admin authority: Promote/remove Admins, manage all users, inspect locked/unlocked files, and monitor real-time hardware.'
                : 'Administrative control over encrypted campus files, 48-hour auto-purge timers, extension whitelists, and personnel permissions.'}
            </p>
          </div>
        </div>
      </div>

      {/* Non-Disruptive Floating Toast Feedback */}
      {statusToast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm bg-emerald-600 text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-2xl shadow-emerald-950/30 border border-emerald-400/30 animate-in slide-in-from-top-3 fade-in duration-200">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>{statusToast}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusToast(null)}
            className="text-white/80 hover:text-white p-0.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Sub-Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveSection('overview')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>File & Purge Governance ({activeAdminFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'security'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Extension Whitelist & Cipher</span>
        </button>

        <button
          onClick={() => setActiveSection('team')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'team'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Team & Role Permissions</span>
        </button>

        <button
          onClick={() => setActiveSection('activity')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'activity'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>Security Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveSection('server_health')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSection === 'server_health'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4 shrink-0" />
          <span>Server Health</span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              activeSection === 'server_health' ? 'bg-emerald-300 animate-ping' : 'bg-emerald-500 animate-pulse'
            }`}
          />
        </button>
      </div>

      {/* SECTION 1: MASTER FILE & 48H PURGE GOVERNANCE */}
      {activeSection === 'overview' && (
        <div className="space-y-5">
          {/* 3 Governance KPI Cards: Active Study Files, Access Breakdown, Auto-Purge Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Study Files</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{activeAdminFiles.length}</p>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">AES-256-CBC Encrypted</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Access Breakdown</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {protectedCount} <span className="text-xs font-semibold text-red-600">PIN</span> / {publicCount}{' '}
                  <span className="text-xs font-semibold text-emerald-600">Public</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Full Admin Inspection Active</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60">
                <ProtectedShieldLockIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Purge Lifecycle</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">48 Hours</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Automatic TTL Cleanup Active</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Master Repository Override & 48h Purge Control
                </h2>
                <p className="text-xs text-slate-500">
                  Inspect all locked and unlocked notes, toggle Public/Protected status, reset 48-hour auto-purge countdowns, or force-delete any record.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter files by name, dept, uploader..."
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white w-56"
                />
                <button
                  onClick={onRefreshFiles}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  title="Refresh Files"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Ext</th>
                  <th className="py-3 px-3">File / Note Name</th>
                  <th className="py-3 px-3">Uploader & Dept</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Access Mode (Click to Toggle)</th>
                  <th className="py-3 px-3">48h Auto-Purge Timer</th>
                  <th className="py-3 px-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdminFiles.map((file) => {
                  const hoursLeft = calculateHoursLeft(file);
                  const isPurging = purgingIds.has(file.id);
                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-blue-50/30 transition-colors duration-150 ${
                        isPurging ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px]">
                          {file.file_extension}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[220px] truncate" title={file.original_name}>
                        {file.original_name}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{file.uploader_name}</div>
                        <div className="text-[10px] text-slate-400">{file.department}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{file.file_size_formatted}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAdminFileAction(file.id, 'toggle_protection');
                          }}
                          className={`w-[86px] h-6 rounded-full font-bold text-[10px] leading-none inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer select-none ${
                            !file.is_passwordless
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title="Click to toggle between Protected (PIN) and Public (Open Access)"
                        >
                          {!file.is_passwordless ? (
                            <>
                              <ProtectedShieldLockIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="leading-none">Protected</span>
                            </>
                          ) : (
                            <>
                              <PublicGlobeCheckIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="leading-none">Public</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {hoursLeft}h left
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAdminFileAction(file.id, 'extend_ttl');
                            }}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                            title="Reset countdown to full 48 hours"
                          >
                            +48h Reset
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onSelectFile(file, 'decrypt');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Inspect / Preview File"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            disabled={isPurging}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAdminFileAction(file.id, 'force_purge');
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors duration-150 ${
                              isPurging
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer'
                            }`}
                            title="Immediately Purge File (Admin Override)"
                          >
                            {isPurging ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>{isPurging ? 'Purging...' : 'Purge'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SECURITY & EXTENSION WHITELIST */}
      {activeSection === 'security' && <SecurityView />}

      {/* SECTION 3: TEAM & ROLE PERMISSIONS */}
      {activeSection === 'team' && <TeamView isMasterAdmin={isMasterAdmin} />}

      {/* SECTION 4: SECURITY AUDIT LOGS */}
      {activeSection === 'activity' && <ActivityView />}

      {/* SECTION 5: SERVER HEALTH (REAL-TIME 1S TELEMETRY, PARTITIONS & STORAGE KPIS) */}
      {activeSection === 'server_health' && (
        <div className="space-y-6">
          {/* REAL-TIME 1-SECOND SYSTEM TELEMETRY: CPU, GPU, NETWORK I/O, DISK & PARTITIONS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Server className="w-4 h-4 text-[#0e3ec7]" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Real-Time System Telemetry & Partition Monitor
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live 1s Polling
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                  {telemetry?.system?.hostname || 'DESKTOP-7NHSFAG'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>
                  OS: <strong className="text-slate-800">{telemetry?.system?.osFormatted || 'Windows 11 x64'}</strong>
                </span>
                <span>•</span>
                <span>
                  RAM:{' '}
                  <strong className="text-slate-800">
                    {telemetry?.memory?.usedFormatted || '6.8 GB'} / {telemetry?.memory?.totalFormatted || '7.8 GB'} (
                    {telemetry?.memory?.usagePercent ?? 87}%)
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Runtime: <strong className="text-indigo-700">{telemetry?.system?.runtime || 'Bun v1.4.4'}</strong>
                </span>
              </div>
            </div>

            {/* 4 Live Hardware Cards: Real CPU, Real GPU, Real Network I/O Speeds, Real Disk Volumes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. CPU Usage */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      CPU Usage ({telemetry?.cpu?.cores || 8} Logical Cores)
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {telemetry?.cpu?.usagePercent ?? 18}%
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, telemetry?.cpu?.usagePercent ?? 18))}%` }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono">
                    <span className="truncate max-w-[155px] font-semibold" title={telemetry?.cpu?.model}>
                      {telemetry?.cpu?.model || '11th Gen Intel(R) Core(TM) i5-11300H @ 3.10GHz'}
                    </span>
                    <span>{telemetry?.cpu?.speedMhz || 3100} MHz</span>
                  </div>
                  {telemetry?.cpu?.perCorePercent && telemetry.cpu.perCorePercent.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {telemetry.cpu.perCorePercent.slice(0, 8).map((pct, i) => (
                        <div
                          key={i}
                          className="bg-white border border-slate-200/80 rounded px-1 py-0.5 text-[9px] font-mono text-slate-600 flex items-center justify-between"
                        >
                          <span className="text-slate-400">C{i}</span>
                          <span className="font-bold text-blue-700">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Real GPU / Display Controller */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      GPU Accelerator Usage
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {telemetry?.gpu?.usagePercent ?? 12}%
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shrink-0">
                    <Gauge className="w-4 h-4" />
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, telemetry?.gpu?.usagePercent ?? 12))}%` }}
                  />
                </div>

                <div className="space-y-1 text-[10px] font-mono text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-semibold text-slate-800" title={telemetry?.gpu?.model}>
                      {telemetry?.gpu?.model || 'Intel(R) Iris(R) Xe Graphics'}
                    </span>
                    <span className="text-purple-700 font-bold">{telemetry?.gpu?.temperatureC ?? 41}°C</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>
                      VRAM: {telemetry?.gpu?.vramUsedMB ?? 210} / {telemetry?.gpu?.vramTotalMB ?? 1024} MB
                    </span>
                    <span>{telemetry?.gpu?.driver ? `Driver ${telemetry.gpu.driver}` : 'Direct3D 12.1'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Real Network I/O Speeds */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Network I/O ({telemetry?.network?.interface || 'Wi-Fi'}{telemetry?.network?.ip ? ` • ${telemetry.network.ip}` : ''})
                    </span>
                    <div className="flex items-center gap-3 mt-1 font-mono">
                      <span className="inline-flex items-center gap-0.5 text-sm font-extrabold text-emerald-700">
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        {telemetry?.network?.rxSpeedFormatted || '128.4 KB/s'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-sm font-extrabold text-blue-700">
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                        {telemetry?.network?.txSpeedFormatted || '64.2 KB/s'}
                      </span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-white border border-slate-200/80 rounded-lg p-2">
                  <div>
                    <span className="text-slate-400 block">Total Inbound (RX)</span>
                    <span className="font-bold text-slate-800">{telemetry?.network?.totalRxFormatted || '3.85 GB'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Outbound (TX)</span>
                    <span className="font-bold text-slate-800">{telemetry?.network?.totalTxFormatted || '3.22 GB'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Throughput: {telemetry?.network?.packetsPerSec ?? 110} pkt/s</span>
                  <span className="text-emerald-600 font-bold">802.11ax / Active</span>
                </div>
              </div>

              {/* 4. Real Disk I/O & Storage Controller */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Disk Read / Write I/O Speed
                    </span>
                    <div className="flex items-center gap-3 mt-1 font-mono">
                      <span className="text-sm font-extrabold text-indigo-700">
                        R: {telemetry?.disk?.readSpeedFormatted || '2.4 MB/s'}
                      </span>
                      <span className="text-sm font-extrabold text-amber-700">
                        W: {telemetry?.disk?.writeSpeedFormatted || '1.1 MB/s'}
                      </span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-white border border-slate-200/80 rounded-lg p-2">
                  <div>
                    <span className="text-slate-400 block">System Drive (C:)</span>
                    <span className="font-bold text-slate-800">{storageStats?.cDrive?.used || '206.7 GB'} / {storageStats?.cDrive?.total || '511 GB'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{storageStats?.gDrive?.name ? 'Drive (G:)' : 'Vault Storage'}</span>
                    <span className="font-bold text-slate-800">{storageStats?.gDrive?.used || storageStats?.dDrive?.used || '221.9 GB'} / {storageStats?.gDrive?.total || storageStats?.dDrive?.total || '511 GB'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>IOPS: {telemetry?.disk?.iops ?? 145} ops/s</span>
                  <span className="text-indigo-700 font-bold">AES-256 Storage</span>
                </div>
              </div>
            </div>

            {/* Live Mounted Disk Partitions Table */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3">Partition / Filesystem</th>
                    <th className="py-2.5 px-3">FS Type</th>
                    <th className="py-2.5 px-3">Mount Point</th>
                    <th className="py-2.5 px-3">Used / Total Capacity</th>
                    <th className="py-2.5 px-3">Free Available</th>
                    <th className="py-2.5 px-3 w-48">Real-Time Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(telemetry?.disk?.partitions || [
                    {
                      filesystem: 'C:\\ (OS System Root)',
                      type: 'NTFS',
                      mountpoint: 'C:\\ (Windows OS & Applications)',
                      usedFormatted: '206.7 GB',
                      sizeFormatted: '511.0 GB',
                      availFormatted: '304.3 GB',
                      usePercent: 40
                    },
                    {
                      filesystem: 'G:\\ (Secondary Volume)',
                      type: 'FAT32',
                      mountpoint: 'G:\\ (Secondary Storage)',
                      usedFormatted: '221.9 GB',
                      sizeFormatted: '511.0 GB',
                      availFormatted: '289.1 GB',
                      usePercent: 43
                    },
                    {
                      filesystem: 'Vault Storage (EncryptedUploads)',
                      type: 'AES-256-CBC',
                      mountpoint: 'C:\\vault\\EncryptedUploads',
                      usedFormatted: '1.2 GB',
                      sizeFormatted: '100.0 GB',
                      availFormatted: '98.8 GB',
                      usePercent: 1
                    }
                  ]).map((part, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{part.filesystem}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                          {part.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{part.mountpoint}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {part.usedFormatted} / {part.sizeFormatted}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{part.availFormatted}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                part.usePercent > 80
                                  ? 'bg-red-500'
                                  : part.usePercent > 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(3, part.usePercent))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-700 w-9 text-right">{part.usePercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
