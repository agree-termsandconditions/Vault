import React, { useState, useEffect } from 'react';
import { VaultFile, SiteTheme } from '../types';
import { STARTER_THEME_TEMPLATE } from '../theme/defaultTheme';
import { SecurityView } from './SecurityView';
import { TeamView } from './TeamView';
import { ActivityView } from './ActivityView';
import { ProtectedShieldLockIcon, PublicGlobeCheckIcon } from './RepositoryCard';
import { apiFetch } from '../utils/apiFetch';
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
  Menu,
  X,
  ArrowLeft,
  Search,
  Palette,
  Sparkles,
  Download,
  Upload,
  Plus,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';

interface AdminDashboardViewProps {
  files: VaultFile[];
  initialSection?: 'overview' | 'security' | 'team' | 'activity' | 'server_health' | 'themes';
  isMasterAdmin?: boolean;
  currentUser?: string;
  onSelectFile: (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => void;
  onRefreshFiles: () => void;
  onBackToRepository: () => void;
  onThemeUpdated?: () => void;
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
  pollSeq?: number;
  timestamp: string;
  uptimeSeconds: number;
  httpTraffic?: {
    totalRequests: number;
    totalBytesRx: number;
    totalBytesTx: number;
  };
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
  currentUser = 'Akish',
  onSelectFile,
  onRefreshFiles,
  onBackToRepository,
  onThemeUpdated,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'security' | 'team' | 'activity' | 'server_health' | 'themes'>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<LiveTelemetry | null>(null);
  const [liveTick, setLiveTick] = useState<number>(1);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 15, 14, 18, 16, 15, 19, 17, 16, 18]);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [purgingIds, setPurgingIds] = useState<Set<number>>(new Set());
  const [purgedIds, setPurgedIds] = useState<Set<number>>(new Set());
  const [adminFiles, setAdminFiles] = useState<VaultFile[]>(files);

  // Dynamic Site Themes & Seasonal Overlays State
  const [themesList, setThemesList] = useState<SiteTheme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>('');
  const [themeLoading, setThemeLoading] = useState(false);
  const [showAddThemeModal, setShowAddThemeModal] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<SiteTheme | null>(null);
  const [themeJsonInput, setThemeJsonInput] = useState('');
  const [themeJsonError, setThemeJsonError] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'upload' | 'paste'>('paste');

  const fetchThemes = async () => {
    try {
      const res = await apiFetch('/api/themes');
      const data = await res.json();
      if (data.success) {
        setThemesList(data.themes || []);
        setActiveThemeId(data.activeThemeId || '');
      }
    } catch {}
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleToggleTheme = async (themeId: string, enabled: boolean) => {
    setThemeLoading(true);
    try {
      const res = await apiFetch('/api/admin/themes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId, enabled }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveThemeId(data.activeThemeId || '');
        showToast(enabled ? `Seasonal theme activated live!` : 'Seasonal theme turned off; default clean UI restored.');
        if (onThemeUpdated) onThemeUpdated();
      } else {
        showToast(data.error || 'Failed to toggle theme.');
      }
    } catch {
      showToast('Network error toggling theme.');
    } finally {
      setThemeLoading(false);
    }
  };

  const handleDeleteTheme = async (themeId: string, themeName: string) => {
    if (!window.confirm(`Are you sure you want to permanently remove theme "${themeName}"?`)) return;
    try {
      const res = await apiFetch('/api/admin/themes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId }),
      });
      const data = await res.json();
      if (data.success) {
        setThemesList(data.themes || []);
        setActiveThemeId(data.activeThemeId || '');
        showToast(`Theme "${themeName}" removed.`);
        if (onThemeUpdated) onThemeUpdated();
      } else {
        showToast(data.error || 'Failed to delete theme.');
      }
    } catch {
      showToast('Network error deleting theme.');
    }
  };

  const handleDownloadTemplate = () => {
    const jsonStr = JSON.stringify(STARTER_THEME_TEMPLATE, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded theme-template.json starter!');
  };

  const handleSaveTheme = async () => {
    setThemeJsonError(null);
    try {
      if (!themeJsonInput.trim()) {
        throw new Error('Please paste a valid JSON theme configuration or upload a .json file.');
      }
      const parsed = JSON.parse(themeJsonInput.trim());
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Theme configuration must be a valid JSON object.');
      }
      if (!parsed.name || typeof parsed.name !== 'string') {
        throw new Error("Theme must include a 'name' string field.");
      }

      const res = await apiFetch('/api/admin/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: parsed }),
      });
      const data = await res.json();
      if (data.success) {
        setThemesList(data.themes || []);
        setActiveThemeId(data.activeThemeId || '');
        setShowAddThemeModal(false);
        setThemeJsonInput('');
        showToast(`Theme "${data.theme?.name || 'Custom Theme'}" uploaded successfully!`);
        if (onThemeUpdated) onThemeUpdated();
      } else {
        setThemeJsonError(data.error || 'Failed to save theme.');
      }
    } catch (err: any) {
      setThemeJsonError(err.message || 'Invalid JSON syntax. Please check formatting.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setThemeJsonInput(content);
      setAddMode('paste');
    };
    reader.readAsText(file);
  };

  const fetchAdminFiles = async () => {
    try {
      const res = await apiFetch('/api/admin/files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setAdminFiles(data.files);
      }
    } catch {
      setAdminFiles(files);
    }
  };

  useEffect(() => {
    fetchAdminFiles();
  }, [files]);
  const [clientHwInfo, setClientHwInfo] = useState<{
    gpuModel: string;
    gpuVendor: string;
    gpuDriver: string;
    cpuSummary: string;
    cores: number;
    ramGb: number;
    platform: string;
    storageQuotaFormatted: string;
  } | null>(null);

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

  // Auto-detect real hardware components from browser + host OS and update every 1 second
  useEffect(() => {
    let mounted = true;

    const parseAngleRenderer = (rawRenderer: string, rawVendor: string): { model: string; vendor: string; driver: string } => {
      const cleanR = (rawRenderer || '').trim();
      const cleanV = (rawVendor || '').trim();
      if (!cleanR) {
        return { model: 'WebGL Hardware Accelerator', vendor: cleanV || 'System GPU', driver: 'WebGL 2.0' };
      }

      // Extract inner GPU name from ANGLE (Vendor, GPU Name (0x...), Direct3D11/OpenGL/Metal/Vulkan...)
      const angleFull = cleanR.match(/^ANGLE\s*\(([^,]+),\s*([^,]+?)(?:,\s*(.*))?\)$/i);
      if (angleFull) {
        const vendorPart = angleFull[1].trim();
        const rawDevice = angleFull[2]
          .replace(/\s*\(0x[0-9a-fA-F]+\)/g, '')
          .replace(/\s+Direct3D\d*.*$/i, '')
          .replace(/\s+vs_\d+_\d+.*$/i, '')
          .trim();
        const apiDriverPart = (angleFull[3] || '').trim() || 'ANGLE WebGL 2.0';
        return {
          model: rawDevice || cleanR,
          vendor: vendorPart || cleanV || 'GPU Vendor',
          driver: apiDriverPart,
        };
      }

      return {
        model: cleanR.replace(/\s*\(0x[0-9a-fA-F]+\)/g, '').trim(),
        vendor: cleanV || 'Hardware Vendor',
        driver: 'WebGL 2.0 / Native',
      };
    };

    const detectBrowserHardware = async () => {
      const cores =
        typeof navigator !== 'undefined' && navigator.hardwareConcurrency
          ? navigator.hardwareConcurrency
          : 4;
      const ramGb =
        typeof navigator !== 'undefined' && (navigator as any).deviceMemory
          ? Number((navigator as any).deviceMemory)
          : 8;

      let gpuModel = '';
      let gpuVendor = '';
      let gpuDriver = 'WebGL 2.0';

      try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl2') ||
          canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
          const glVersion = String(gl.getParameter(gl.VERSION) || 'WebGL 2.0');
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          const unmaskedRenderer = dbg
            ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
            : String(gl.getParameter(gl.RENDERER) || '');
          const unmaskedVendor = dbg
            ? String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '')
            : String(gl.getParameter(gl.VENDOR) || '');
          const parsed = parseAngleRenderer(unmaskedRenderer, unmaskedVendor);
          gpuModel = parsed.model;
          gpuVendor = parsed.vendor;
          gpuDriver = parsed.driver || glVersion;
        }
      } catch (_e) {}

      let arch = '';
      let bitness = '64';
      let platformName = typeof navigator !== 'undefined' ? navigator.platform || '' : '';
      let modelHint = '';

      try {
        const uaData = (navigator as any)?.userAgentData;
        if (uaData) {
          platformName = uaData.platform || platformName;
          if (typeof uaData.getHighEntropyValues === 'function') {
            const hev = await uaData.getHighEntropyValues([
              'architecture',
              'bitness',
              'model',
              'platform',
              'platformVersion',
            ]);
            arch = hev.architecture || arch;
            bitness = hev.bitness || bitness;
            platformName = hev.platform || platformName;
            modelHint = hev.model || '';
          }
        }
      } catch (_e) {}

      // Derive CPU vendor hint from GPU vendor or architecture if not exposed by browser
      let cpuVendorHint = '';
      if (/apple/i.test(gpuModel) || /apple/i.test(gpuVendor)) {
        cpuVendorHint = gpuModel.includes('Apple') ? `${gpuModel.split(' GPU')[0]} SoC` : 'Apple Silicon';
      } else if (/intel/i.test(gpuVendor) || /intel/i.test(gpuModel)) {
        cpuVendorHint = 'Intel x86_64 Processor';
      } else if (/amd|radeon/i.test(gpuVendor) || /amd|radeon/i.test(gpuModel)) {
        cpuVendorHint = 'AMD Ryzen / x86_64 Processor';
      }

      const archLabel = arch ? `${arch.toUpperCase()} (${bitness}-bit)` : '64-bit';
      const cpuSummary = modelHint
        ? `${modelHint} (${cores} Logical Cores)`
        : cpuVendorHint
        ? `${cpuVendorHint} (${cores} Logical Cores • ${archLabel})`
        : '';

      let storageQuotaFormatted = '';
      try {
        if (navigator.storage && typeof navigator.storage.estimate === 'function') {
          const est = await navigator.storage.estimate();
          if (est && est.quota) {
            const usedMb = ((est.usage || 0) / (1024 * 1024)).toFixed(1);
            const quotaGb = (est.quota / (1024 * 1024 * 1024)).toFixed(1);
            storageQuotaFormatted = `${usedMb} MB used / ${quotaGb} GB quota`;
          }
        }
      } catch (_e) {}

      return {
        gpuModel,
        gpuVendor,
        gpuDriver,
        cpuSummary,
        cores,
        ramGb,
        platform: `${platformName} ${archLabel}`.trim(),
        storageQuotaFormatted,
      };
    };

    let cachedClientHw: Awaited<ReturnType<typeof detectBrowserHardware>> | null = null;

    const fetchTelemetry = async () => {
      try {
        if (!cachedClientHw) {
          cachedClientHw = await detectBrowserHardware();
          if (mounted) setClientHwInfo(cachedClientHw);
        }

        const params = new URLSearchParams({
          t: String(Date.now()),
          clientCores: String(cachedClientHw.cores || 0),
          clientRamGb: String(cachedClientHw.ramGb || 0),
        });
        if (cachedClientHw.gpuModel) {
          params.set('clientGpu', cachedClientHw.gpuModel);
        }
        if (cachedClientHw.gpuVendor) {
          params.set('clientGpuVendor', cachedClientHw.gpuVendor);
        }
        if (cachedClientHw.gpuDriver) {
          params.set('clientGpuDriver', cachedClientHw.gpuDriver);
        }
        if (cachedClientHw.cpuSummary) {
          params.set('clientCpu', cachedClientHw.cpuSummary);
        }

        const res = await apiFetch(`/api/admin/telemetry?${params.toString()}`);
        const data = await res.json();
        if (mounted && data.success && data.telemetry) {
          setTelemetry(data.telemetry);
          setLiveTick((prev) => prev + 1);
          setCpuHistory((prev) => [...prev.slice(-11), data.telemetry.cpu?.usagePercent ?? 12]);
        }
      } catch (_e) {
        if (mounted) setLiveTick((prev) => prev + 1);
      }
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
      const res = await apiFetch('/api/system/storage');
      const data = await res.json();
      if (data.success) setStorageStats(data);
    } catch (e) {}
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const handleAdminFileAction = async (fileId: number, action: 'extend_ttl' | 'toggle_protection' | 'force_purge' | 'restore') => {
    if (action === 'force_purge') {
      setPurgingIds((prev) => new Set(prev).add(fileId));
    }

    try {
      const token = localStorage.getItem('vault_session_token');
      const res = await apiFetch('/api/admin/file-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: fileId, action, token }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'force_purge') {
          setPurgedIds((prev) => new Set(prev).add(fileId));
        }
        showToast(data.message || 'Action completed');
        fetchAdminFiles();
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

  const calculateRetentionHoursLeft = (file: VaultFile): number => {
    if (!file.deleted_at) return 48;
    const deletedTime = new Date(file.deleted_at).getTime();
    if (isNaN(deletedTime)) return 48;
    const diff = (48 * 3600 * 1000) - (Date.now() - deletedTime);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
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

  const activeAdminFiles = adminFiles.filter(
    (f) =>
      !purgedIds.has(f.id) &&
      !f.is_directory &&
      String(f.file_extension || '').toUpperCase() !== 'DIR'
  );
  const liveAdminFiles = activeAdminFiles.filter((f) => !f.is_deleted);
  const softDeletedAdminFiles = activeAdminFiles.filter((f) => f.is_deleted);
  const protectedCount = liveAdminFiles.filter((f) => !f.is_passwordless).length;
  const publicCount = liveAdminFiles.filter((f) => f.is_passwordless).length;

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
    <div className="flex min-h-[calc(100vh-64px)] w-full bg-[#f8fafc] text-slate-800 relative">
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

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

      {/* Left Sidebar (256px / w-64, strict 240px–260px design spec) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 shrink-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Sidebar Header Brand (64px / h-16) */}
            <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                    Admin Console
                  </h2>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        isMasterAdmin
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {isMasterAdmin ? 'Master Admin' : 'Campus Admin'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-11 h-11 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center justify-center"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1.5">
              <div className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Governance & Controls
              </div>

              {/* 1. File & Purge Governance */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('overview');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 shrink-0 ${activeSection === 'overview' ? 'text-white' : 'text-slate-500'}`} />
                  <span>File & Purge</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                    activeSection === 'overview'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {activeAdminFiles.length}
                </span>
              </button>

              {/* 2. Extension Whitelist & Cipher */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('security');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'security'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${activeSection === 'security' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Allowed Extensions</span>
                </div>
              </button>

              {/* 3. Team & Role Permissions */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('team');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'team'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 shrink-0 ${activeSection === 'team' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Team & Personnel</span>
                </div>
              </button>

              {/* 4. Security Audit Logs */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('activity');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'activity'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className={`w-4 h-4 shrink-0 ${activeSection === 'activity' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Security Audit Logs</span>
                </div>
              </button>

              {/* 5. Server Health */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('server_health');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'server_health'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server className={`w-4 h-4 shrink-0 ${activeSection === 'server_health' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Server Health</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </button>

              {/* 6. Dynamic Site Themes & Seasonal Overlays */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('themes');
                  setSidebarOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeSection === 'themes'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Palette className={`w-4 h-4 shrink-0 ${activeSection === 'themes' ? 'text-white' : 'text-slate-500'}`} />
                  <span>Site Themes</span>
                </div>
                {activeThemeId ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Seasonal theme active" />
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-500">Off</span>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-slate-800 truncate">{currentUser}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {isMasterAdmin ? 'Master Authority' : 'Campus Administrator'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToRepository}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Notes Board</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header (64px / h-16) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-11 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Console</span>
                <span>/</span>
                <span className="text-blue-600 font-extrabold">
                  {activeSection === 'overview' && 'File & Purge Governance'}
                  {activeSection === 'security' && 'Extension Whitelist & Cipher'}
                  {activeSection === 'team' && 'Team & Role Permissions'}
                  {activeSection === 'activity' && 'Security Audit Logs'}
                  {activeSection === 'server_health' && 'Server Telemetry'}
                  {activeSection === 'themes' && 'Site Themes & Seasonal Overlays'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                {activeSection === 'overview' && 'Master File & 48-Hour Purge Governance'}
                {activeSection === 'security' && 'Cryptographic Hardening & Whitelist'}
                {activeSection === 'team' && 'Institutional Personnel & Access Matrix'}
                {activeSection === 'activity' && 'Immutable Security Audit Logs'}
                {activeSection === 'server_health' && 'Live Hardware & Disk Telemetry'}
                {activeSection === 'themes' && 'Dynamic Seasonal Themes & Overlay Manager'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              1s Live Telemetry
            </span>
            <button
              type="button"
              onClick={onRefreshFiles}
              className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Refresh repository files"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Refresh Data</span>
            </button>
            <button
              type="button"
              onClick={onBackToRepository}
              className="h-10 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              title="Return to Notes Board"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notes Board</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Container (Max width 1440px with generous 24px/32px padding) */}
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 sm:p-8 space-y-6">

      {/* SECTION 1: MASTER FILE & 48H PURGE GOVERNANCE */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* 3 Governance KPI Cards: Active Study Files, Access Breakdown, Auto-Purge Lifecycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Study Files</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{liveAdminFiles.length}</p>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  {softDeletedAdminFiles.length > 0 ? (
                    <span className="text-rose-600 font-bold">+{softDeletedAdminFiles.length} in 48h soft-retention</span>
                  ) : (
                    'AES-256-CBC Encrypted'
                  )}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Access Breakdown</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                  {protectedCount} <span className="text-xs font-semibold text-red-600">PIN</span> / {publicCount}{' '}
                  <span className="text-xs font-semibold text-emerald-600">Public</span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Full Admin Inspection Active</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60 shrink-0">
                <ProtectedShieldLockIcon className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Purge Lifecycle</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">48 Hours</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Automatic TTL Cleanup Active</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Master File Table Container */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Master Repository Override & 48h Purge Control
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect locked and unlocked notes, toggle Public/Protected status, reset 48-hour auto-purge countdowns, or force-delete records.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter files, dept, uploader..."
                    className="h-10 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 w-64 transition"
                  />
                </div>
                <button
                  onClick={onRefreshFiles}
                  className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center cursor-pointer transition shrink-0"
                  title="Refresh Files"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Ext</th>
                    <th className="py-3.5 px-4">File / Note Name</th>
                    <th className="py-3.5 px-4">Uploader & Dept</th>
                    <th className="py-3.5 px-4 text-right">Size</th>
                    <th className="py-3.5 px-4 text-center">Access Mode</th>
                    <th className="py-3.5 px-4">48h Auto-Purge Timer</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdminFiles.map((file) => {
                    const hoursLeft = calculateHoursLeft(file);
                    const retentionHours = calculateRetentionHoursLeft(file);
                    const isPurging = purgingIds.has(file.id);
                    const isSoftDeleted = Boolean(file.is_deleted);

                    return (
                      <tr
                        key={file.id}
                        className={`transition-colors duration-150 ${
                          isSoftDeleted
                            ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500'
                            : 'hover:bg-blue-50/30'
                        } ${isPurging ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 align-middle">
                          <span className={`px-2 py-0.5 rounded border text-[10px] ${
                            isSoftDeleted ? 'bg-rose-100/70 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {file.file_extension}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[240px] truncate align-middle" title={file.original_name}>
                          {isSoftDeleted ? (
                            <div className="flex items-center gap-1.5">
                              <span className="line-through text-slate-500">{file.original_name}</span>
                            </div>
                          ) : (
                            file.original_name
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-semibold text-slate-800">{file.uploader_name}</div>
                          <div className="text-[10px] text-slate-400">{file.department}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-right align-middle">
                          {file.file_size_formatted}
                        </td>
                        <td className="py-3.5 px-4 text-center align-middle">
                          {isSoftDeleted ? (
                            <span
                              className="px-2.5 py-1 rounded-full font-bold text-[10px] leading-none inline-flex items-center justify-center gap-1.5 shadow-2xs bg-rose-600 text-white select-none"
                              title="Soft-deleted by user. Retained for 48 hours in Admin Console."
                            >
                              <Trash2 className="w-3 h-3 shrink-0" />
                              <span>Deleted by {file.deleted_by || 'user'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAdminFileAction(file.id, 'toggle_protection');
                              }}
                              className={`w-[90px] h-6 rounded-full font-bold text-[10px] leading-none inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer select-none ${
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
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-middle">
                          {isSoftDeleted ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10.5px] tabular-nums"
                                title="48-hour soft delete retention window. Auto-purged after 48h."
                              >
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Retention: {retentionHours}h left</span>
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10.5px] tabular-nums">
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
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right align-middle">
                          <div className="inline-flex items-center gap-1.5">
                            {isSoftDeleted ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAdminFileAction(file.id, 'restore');
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                                  title="Restore Note to Active Repository"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isPurging}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAdminFileAction(file.id, 'force_purge');
                                  }}
                                  className="h-8 px-2.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
                                  title="Permanently Purge Record Now (Cannot be undone)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{isPurging ? 'Purging...' : 'Purge'}</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectFile(file, 'decrypt');
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
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
                                  className={`h-8 px-2.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-colors duration-150 ${
                                    isPurging
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer'
                                  }`}
                                  title="Immediately Delete / Purge File (Admin Override without PIN)"
                                >
                                  {isPurging ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isPurging ? 'Purging...' : 'Delete'}</span>
                                </button>
                              </>
                            )}
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

      {/* SECTION 5: SERVER HEALTH (REAL-TIME 1S AUTO-FETCHED TELEMETRY, PARTITIONS & STORAGE KPIS) */}
      {activeSection === 'server_health' && (
        <div className="space-y-6">
          {/* REAL-TIME 1-SECOND SYSTEM TELEMETRY: CPU, GPU, NETWORK I/O, DISK & PARTITIONS */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Server className="w-4 h-4 text-[#0e3ec7]" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Auto-Fetched Hardware & Partition Telemetry
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Auto-Sync 1s • Poll #{telemetry?.pollSeq ?? liveTick}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-mono font-bold">
                  {telemetry?.timestamp
                    ? new Date(telemetry.timestamp).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                  Host: {telemetry?.system?.hostname || 'auto-detecting...'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500">
                <span>
                  Uptime:{' '}
                  <strong className="text-emerald-700">
                    {Math.floor((telemetry?.uptimeSeconds ?? 0) / 3600)}h{' '}
                    {Math.floor(((telemetry?.uptimeSeconds ?? 0) % 3600) / 60)}m{' '}
                    {(telemetry?.uptimeSeconds ?? liveTick) % 60}s
                  </strong>
                </span>
                <span>•</span>
                <span>
                  OS: <strong className="text-slate-800">{telemetry?.system?.osFormatted || clientHwInfo?.platform || 'Auto-Detecting...'}</strong>
                </span>
                <span>•</span>
                <span>
                  RAM:{' '}
                  <strong className="text-slate-800">
                    {telemetry?.memory?.usedFormatted || '...'} / {telemetry?.memory?.totalFormatted || '...'} (
                    {telemetry?.memory?.usagePercent ?? 0}%)
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Node Heap:{' '}
                  <strong className="text-indigo-700">
                    {telemetry?.system?.processMemory?.heapUsedFormatted || '...'} (RSS{' '}
                    {telemetry?.system?.processMemory?.rssFormatted || '...'})
                  </strong>
                </span>
              </div>
            </div>

            {/* 4 Live Hardware Cards: Auto-Fetched CPU, GPU, Network I/O Speeds, Disk Volumes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. CPU Usage */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      CPU ({telemetry?.cpu?.cores || clientHwInfo?.cores || 4} Logical Cores)
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {telemetry?.cpu?.usagePercent ?? 0}%
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, telemetry?.cpu?.usagePercent ?? 5))}%` }}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px] text-slate-600 font-mono">
                    <span
                      className="truncate max-w-[165px] font-semibold text-slate-800"
                      title={telemetry?.cpu?.model || clientHwInfo?.cpuSummary || 'Auto-detecting CPU...'}
                    >
                      {telemetry?.cpu?.model || clientHwInfo?.cpuSummary || 'Auto-detecting CPU...'}
                    </span>
                    <span className="shrink-0">{telemetry?.cpu?.speedMhz || 0} MHz</span>
                  </div>
                  {/* Live 12-Sample Sparkline */}
                  <div className="flex items-end gap-0.5 h-5 pt-0.5">
                    {cpuHistory.map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-500/80 rounded-t transition-all duration-300"
                        style={{ height: `${Math.max(15, Math.min(100, val))}%` }}
                        title={`${val}%`}
                      />
                    ))}
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
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      GPU ({clientHwInfo?.gpuVendor || 'Auto-Detected'})
                    </span>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {telemetry?.gpu?.usagePercent ?? 0}%
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/70 flex items-center justify-center shrink-0">
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, telemetry?.gpu?.usagePercent ?? 5))}%` }}
                  />
                </div>

                <div className="space-y-1.5 text-[10px] font-mono text-slate-600">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="truncate font-semibold text-slate-800"
                      title={clientHwInfo?.gpuModel || telemetry?.gpu?.model || 'Auto-detecting GPU...'}
                    >
                      {clientHwInfo?.gpuModel || telemetry?.gpu?.model || 'Auto-detecting GPU...'}
                    </span>
                    <span className="text-purple-700 font-bold shrink-0">{telemetry?.gpu?.temperatureC ?? 40}°C</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-slate-500">
                    <span className="truncate">
                      VRAM: {telemetry?.gpu?.vramUsedMB ?? 0} / {telemetry?.gpu?.vramTotalMB ?? 1024} MB
                    </span>
                    <span className="truncate max-w-[115px]" title={clientHwInfo?.gpuDriver || telemetry?.gpu?.driver}>
                      {clientHwInfo?.gpuDriver || telemetry?.gpu?.driver || 'WebGL 2.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Real Network I/O Speeds */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Network ({telemetry?.network?.interface || 'eth0'}{telemetry?.network?.ip ? ` • ${telemetry.network.ip}` : ''})
                    </span>
                    <div className="flex items-center gap-3 mt-1 font-mono">
                      <span className="inline-flex items-center gap-0.5 text-sm font-extrabold text-emerald-700">
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                        {telemetry?.network?.rxSpeedFormatted || '0.0 KB/s'}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-sm font-extrabold text-blue-700">
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                        {telemetry?.network?.txSpeedFormatted || '0.0 KB/s'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                    <Wifi className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <div>
                    <span className="text-slate-400 block">Total Inbound (RX)</span>
                    <span className="font-bold text-slate-800">{telemetry?.network?.totalRxFormatted || '0 B'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Outbound (TX)</span>
                    <span className="font-bold text-slate-800">{telemetry?.network?.totalTxFormatted || '0 B'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Throughput: {telemetry?.network?.packetsPerSec ?? 0} pkt/s</span>
                  <span className="text-emerald-600 font-bold">Live Kernel Stats</span>
                </div>
              </div>

              {/* 4. Real Disk I/O & Storage Controller */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Disk Read / Write I/O Speed
                    </span>
                    <div className="flex items-center gap-3 mt-1 font-mono">
                      <span className="text-sm font-extrabold text-indigo-700">
                        R: {telemetry?.disk?.readSpeedFormatted || '0.0 KB/s'}
                      </span>
                      <span className="text-sm font-extrabold text-amber-700">
                        W: {telemetry?.disk?.writeSpeedFormatted || '0.0 KB/s'}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white border border-slate-200/80 rounded-lg p-2.5">
                  <div>
                    <span className="text-slate-400 block truncate">
                      {telemetry?.disk?.partitions?.[0]?.filesystem || storageStats?.cDrive?.name || 'System Root (/)'}
                    </span>
                    <span className="font-bold text-slate-800">
                      {telemetry?.disk?.partitions?.[0]
                        ? `${telemetry.disk.partitions[0].usedFormatted} / ${telemetry.disk.partitions[0].sizeFormatted}`
                        : `${storageStats?.cDrive?.used || '...'} / ${storageStats?.cDrive?.total || '...'}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block truncate">Vault Storage</span>
                    <span className="font-bold text-slate-800">
                      {storageStats?.dDrive
                        ? `${storageStats.dDrive.used} / ${storageStats.dDrive.total}`
                        : clientHwInfo?.storageQuotaFormatted || 'Active'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>IOPS: {telemetry?.disk?.iops ?? 0} ops/s</span>
                  <span className="text-indigo-700 font-bold">AES-256 Storage</span>
                </div>
              </div>
            </div>

            {/* Live Mounted Disk Partitions Table */}
            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4">Partition / Filesystem</th>
                    <th className="py-3.5 px-4">FS Type</th>
                    <th className="py-3.5 px-4">Mount Point</th>
                    <th className="py-3.5 px-4">Used / Total Capacity</th>
                    <th className="py-3.5 px-4">Free Available</th>
                    <th className="py-3.5 px-4 w-48">Real-Time Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(telemetry?.disk?.partitions || []).map((part, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle">{part.filesystem}</td>
                      <td className="py-3.5 px-4 align-middle">
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase">
                          {part.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 align-middle">{part.mountpoint}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 align-middle">
                        {part.usedFormatted} / {part.sizeFormatted}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold align-middle">{part.availFormatted}</td>
                      <td className="py-3.5 px-4 align-middle">
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

      {/* SECTION 6: DYNAMIC SITE THEMES & SEASONAL OVERLAYS */}
      {activeSection === 'themes' && (
        <div className="space-y-6">
          {/* Top Banner / Controls Bar */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Zero-Code Seasonal Theming</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Site Themes & Seasonal Overlay Manager
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
                Activate, preview, upload, or toggle seasonal themes anytime. When a theme is enabled, custom banners, flying runners, ambient particles, footer waves, and 4 rotating note card skins appear automatically. When turned off, the site instantly reverts to its clean default design.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              {/* Download Starter Theme Template Button */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 md:flex-none h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
                title="Download clean theme-template.json starter file"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>Download Theme Template</span>
              </button>

              {/* Add / Upload Theme Button */}
              <button
                type="button"
                onClick={() => {
                  setThemeJsonInput('');
                  setThemeJsonError(null);
                  setShowAddThemeModal(true);
                }}
                className="flex-1 md:flex-none h-11 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-900 text-xs font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 text-blue-700" />
                <span>Add Theme</span>
              </button>
            </div>
          </div>

          {/* 3 Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Active Theme</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1 truncate max-w-[220px]">
                  {activeThemeId
                    ? themesList.find((t) => t.id === activeThemeId)?.name || activeThemeId
                    : 'Clean Default (Off)'}
                </p>
                <p className="text-[11px] font-semibold mt-1">
                  {activeThemeId ? (
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Across Campus
                    </span>
                  ) : (
                    <span className="text-slate-500">Standard institutional UI active</span>
                  )}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${activeThemeId ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                <Palette className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available Themes</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{themesList.length}</p>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  Ready to activate with 1 click
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supported Layout Zones</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">6 Zones</p>
                <p className="text-[11px] text-purple-700 font-semibold mt-1">
                  Navbar, Runner, Snow, Footer, Corners, 4 Skins
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* List of Registered Seasonal Themes */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Theme Catalog</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Toggle any theme On to instantly activate it across the site, or turn it Off to revert to default.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {themesList.map((theme) => {
                const isActive = activeThemeId === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`rounded-2xl border p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl">
                          {theme.id.includes('winter') || theme.id.includes('christmas') ? '❄️' : '🎨'}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {theme.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          v{theme.version}
                        </span>
                        {theme.isBuiltIn && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            Built-in
                          </span>
                        )}
                        {isActive ? (
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Active Live
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            Off
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {theme.description || 'Custom user-uploaded seasonal site theme.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {theme.navbar?.bannerText && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            Navbar Banner
                          </span>
                        )}
                        {theme.navbar?.runnerSvg && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            Flying Runner
                          </span>
                        )}
                        {theme.ambient && theme.ambient.type !== 'none' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            {theme.ambient.type === 'snow' ? 'Snow' : 'Particle'} Ambient
                          </span>
                        )}
                        {theme.footer?.blendSvg && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            Footer Blend
                          </span>
                        )}
                        {(theme.corners?.bottomLeftSvg || theme.corners?.bottomRightSvg) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                            Corner Scenes
                          </span>
                        )}
                        {theme.cardSkins && theme.cardSkins.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            {theme.cardSkins.length} Card Skins
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls: Toggle Switch (On/Off), Preview, Delete */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        disabled={themeLoading}
                        onClick={() => handleToggleTheme(theme.id, !isActive)}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          isActive ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        title={isActive ? 'Turn Off Theme' : 'Activate Theme'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => setPreviewTheme(theme)}
                        className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Preview theme details and card skins"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Preview</span>
                      </button>

                      {/* Delete Button */}
                      {!theme.isBuiltIn ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTheme(theme.id, theme.name)}
                          className="h-9 w-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title="Delete theme"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <div
                          className="h-9 w-9 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Built-in themes cannot be removed, but can be turned Off"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / UPLOAD THEME */}
      {showAddThemeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add New Seasonal Theme</h3>
                  <p className="text-xs text-slate-500 font-medium">Upload a .json theme file or paste theme configuration JSON</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddThemeModal(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAddMode('paste')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    addMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste JSON Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                    addMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload .json File
                </button>
              </div>

              {addMode === 'upload' ? (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 hover:border-blue-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>
                    <label className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline">
                      <span>Click to select theme JSON file</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Supports standard Theme Schema (.json)</p>
                  </div>
                  {themeJsonInput && (
                    <div className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      File loaded! You can review or edit below in Paste mode.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">JSON Configuration:</span>
                    <button
                      type="button"
                      onClick={() => setThemeJsonInput(JSON.stringify(STARTER_THEME_TEMPLATE, null, 2))}
                      className="text-blue-600 hover:underline font-bold text-[11px]"
                    >
                      Fill with Starter Template
                    </button>
                  </div>
                  <textarea
                    rows={12}
                    value={themeJsonInput}
                    onChange={(e) => setThemeJsonInput(e.target.value)}
                    placeholder="Paste full theme JSON here..."
                    className="w-full font-mono text-[11px] leading-relaxed p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              )}

              {themeJsonError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{themeJsonError}</span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowAddThemeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTheme}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Save & Register Theme</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW THEME */}
      {previewTheme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Theme Preview: {previewTheme.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    v{previewTheme.version} • Author: {previewTheme.author}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Navbar Banner Preview */}
              {previewTheme.navbar?.bannerText && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Zone 1: Top Announcement Banner
                  </span>
                  <div
                    style={{
                      background: previewTheme.navbar.bannerBg || 'linear-gradient(90deg, #064e3b, #991b1b, #064e3b)',
                      color: previewTheme.navbar.bannerTextColor || '#fff',
                    }}
                    className="p-3 text-center text-xs font-semibold rounded-xl shadow-xs"
                  >
                    {previewTheme.navbar.bannerText}
                  </div>
                </div>
              )}

              {/* Navbar Runner Preview */}
              {previewTheme.navbar?.runnerSvg && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Zone 2: Navbar Bottom Runner Strip
                  </span>
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex items-center justify-center overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: previewTheme.navbar.runnerSvg }} />
                  </div>
                </div>
              )}

              {/* 4 Rotating Sticky Note Skins Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Zone 4: 4 Rotating Sticky Note Card Skins (Matching Reference Design)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(previewTheme.cardSkins && previewTheme.cardSkins.length > 0
                    ? previewTheme.cardSkins
                    : [
                        { id: '1', name: 'Variant 1: Warm Cream', bgColor: '#fffdf5', borderColor: '#fef3c7' },
                        { id: '2', name: 'Variant 2: Soft Ice Blue', bgColor: '#f1f8fe', borderColor: '#dbeafe' },
                        { id: '3', name: 'Variant 3: Mint Green', bgColor: '#f0fbf5', borderColor: '#d1fae5' },
                        { id: '4', name: 'Variant 4: Blush Pink', bgColor: '#fff0f6', borderColor: '#fce7f3' },
                      ]
                  ).map((skin, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: skin.bgColor,
                        borderColor: skin.borderColor || 'transparent',
                      }}
                      className="border rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[170px]"
                    >
                      {/* Corner / Edge SVGs */}
                      {skin.decorations?.topLeftSvg && (
                        <div
                          className="absolute top-0 left-0 pointer-events-none select-none z-10"
                          dangerouslySetInnerHTML={{ __html: skin.decorations.topLeftSvg }}
                        />
                      )}
                      {skin.decorations?.topSvg && (
                        <div
                          className="absolute top-0 inset-x-0 pointer-events-none select-none z-10"
                          dangerouslySetInnerHTML={{ __html: skin.decorations.topSvg }}
                        />
                      )}
                      {skin.decorations?.bottomLeftSvg && (
                        <div
                          className="absolute bottom-0 left-0 pointer-events-none select-none z-10"
                          dangerouslySetInnerHTML={{ __html: skin.decorations.bottomLeftSvg }}
                        />
                      )}
                      {skin.decorations?.bottomSvg && (
                        <div
                          className="absolute bottom-0 inset-x-0 pointer-events-none select-none z-10"
                          dangerouslySetInnerHTML={{ __html: skin.decorations.bottomSvg }}
                        />
                      )}
                      {skin.decorations?.bottomRightSvg && (
                        <div
                          className="absolute bottom-0 right-0 pointer-events-none select-none z-10"
                          dangerouslySetInnerHTML={{ __html: skin.decorations.bottomRightSvg }}
                        />
                      )}

                      <div className="relative z-20">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-black/10 text-slate-800">
                          Variant {idx + 1}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 mt-2 leading-tight">
                          {skin.name}
                        </h5>
                      </div>

                      <div className="relative z-20 text-[10px] text-slate-500 font-medium">
                        Center note area remains clean & high-contrast
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={() => setPreviewTheme(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleTheme(previewTheme.id, true);
                  setPreviewTheme(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Activate Theme Live</span>
              </button>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </div>
  );
};
