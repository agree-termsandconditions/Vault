import React, { useState, useEffect } from 'react';
import { VaultFile, shortenTag, fixMojibake } from '../types';
import {
  ProtectedShieldLockIcon,
  PublicGlobeCheckIcon,
  openMaskedFileInBrowser,
  triggerMaskedFileDownload,
  openExternalUrlSafely,
} from './RepositoryCard';
import {
  X,
  Download,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface FileModalProps {
  file: VaultFile | null;
  initialAction: 'decrypt' | 'download' | 'details' | 'delete';
  isAdmin?: boolean;
  onClose: () => void;
  onRefreshRepository: () => void;
}

export const FileModal: React.FC<FileModalProps> = ({
  file,
  initialAction,
  isAdmin = false,
  onClose,
  onRefreshRepository,
}) => {
  // Non-admins only ever see 'decrypt' (open/download) or 'delete'
  const effectiveInitialAction =
    !isAdmin && initialAction === 'details' ? 'decrypt' : initialAction;

  const [actionTab, setActionTab] = useState<'decrypt' | 'download' | 'details' | 'delete'>(
    effectiveInitialAction
  );
  const [inputPin, setInputPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLink = !!file?.is_link;

  const getCleanExt = (targetFile: VaultFile | null): string => {
    if (!targetFile) return '';
    return (targetFile.file_extension || '').toLowerCase().replace(/^\./, '').trim();
  };

  const isImageFile = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    const ext = getCleanExt(targetFile);
    const mime = (targetFile.mime_type || '').toLowerCase();
    const name = (targetFile.original_name || '').toLowerCase();
    const imgExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'svg'];
    return (
      imgExts.includes(ext) ||
      mime.startsWith('image/') ||
      imgExts.some((e) => name.endsWith(`.${e}`))
    );
  };

  const isPdfFile = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    const ext = getCleanExt(targetFile);
    const mime = (targetFile.mime_type || '').toLowerCase();
    const name = (targetFile.original_name || '').toLowerCase();
    return ext === 'pdf' || mime === 'application/pdf' || name.endsWith('.pdf');
  };

  const isWebOrMarkupFile = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    const ext = getCleanExt(targetFile);
    const mime = (targetFile.mime_type || '').toLowerCase();
    const name = (targetFile.original_name || '').toLowerCase();
    const webExts = ['html', 'htm', 'xml', 'svg', 'js', 'css'];
    return (
      webExts.includes(ext) ||
      mime === 'text/html' ||
      mime === 'application/xml' ||
      mime === 'text/xml' ||
      mime === 'text/css' ||
      mime === 'text/javascript' ||
      mime === 'application/javascript' ||
      webExts.some((e) => name.endsWith(`.${e}`))
    );
  };

  const isMediaFile = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    const ext = getCleanExt(targetFile);
    const mime = (targetFile.mime_type || '').toLowerCase();
    const name = (targetFile.original_name || '').toLowerCase();
    const mediaExts = ['mp3', 'mp4', 'webm', 'ogg', 'ogv', '3gp', 'wav'];
    return (
      mediaExts.includes(ext) ||
      mime.startsWith('audio/') ||
      mime.startsWith('video/') ||
      mediaExts.some((e) => name.endsWith(`.${e}`))
    );
  };

  const isTextPreviewable = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    const ext = getCleanExt(targetFile);
    const mime = (targetFile.mime_type || '').toLowerCase();
    const name = (targetFile.original_name || '').toLowerCase();
    const txtExts = ['txt', 'text', 'csv', 'md', 'json', 'log', 'dir'];
    return (
      txtExts.includes(ext) ||
      targetFile.is_directory ||
      mime.startsWith('text/') ||
      txtExts.some((e) => name.endsWith(`.${e}`))
    );
  };

  // True if browser can natively open it in a browser tab (Web & Markup, Documents & Text, Images, Audio & Video Media, Web Link)
  // False for PPTX, DOCX, XLSX, ENC, PEM, ZIP, etc., which download directly once unlocked
  const isBrowserSupported = (targetFile: VaultFile | null): boolean => {
    if (!targetFile) return false;
    return (
      !!targetFile.is_link ||
      isImageFile(targetFile) ||
      isPdfFile(targetFile) ||
      isWebOrMarkupFile(targetFile) ||
      isMediaFile(targetFile) ||
      isTextPreviewable(targetFile)
    );
  };

  const canOpenInBrowser = isBrowserSupported(file);

  // Download file with PIN
  const handleDownload = async (customPin?: string, autoCloseAfterDownload = true) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const pinToUse =
      customPin !== undefined ? customPin : file.is_passwordless ? 'PWDLESS_PUBLIC' : inputPin.trim();

    try {
      const res = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.id,
          pin: pinToUse,
          action: 'download',
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        setSuccessMessage('File decrypted and download started.');
        if (autoCloseAfterDownload) {
          setTimeout(() => onClose(), 350);
        }
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Incorrect password / PIN.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Download connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Decrypt & Open directly in browser tab (if supported) or trigger direct download (if binary) — never showing an in-modal content preview
  const handleDecryptAndOpenInBrowser = async (customPin?: string) => {
    if (!file) return;
    const pinToUse =
      customPin !== undefined ? customPin : file.is_passwordless ? 'PWDLESS_PUBLIC' : inputPin.trim();

    // If not supported natively in browser (e.g. DOCX, XLSX, PPTX, ENC, PEM), verify PIN and trigger direct download
    if (!canOpenInBrowser) {
      await handleDownload(pinToUse, true);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.id,
          pin: pinToUse,
          action: 'view',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.is_link || file.is_link) {
          const targetUrl = data.link_url || file.link_url;
          if (targetUrl) {
            openExternalUrlSafely(targetUrl);
          }
        } else {
          // Open decrypted supported file directly in a new browser tab with vanity origin masking (hiding /api/preview/... and PIN)
          openMaskedFileInBrowser(file.id, pinToUse, file.original_name);
        }
        onClose();
      } else {
        setErrorMessage(data.error || 'Incorrect password / PIN.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error while verifying PIN.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInputPin('');
    setActionTab(effectiveInitialAction);

    if (!file) return;

    // If a Public file is opened with 'decrypt' or 'download', open in browser or download immediately without showing raw internal URLs
    if (file.is_passwordless && effectiveInitialAction === 'decrypt') {
      if (file.is_link && file.link_url) {
        openExternalUrlSafely(file.link_url);
      } else if (canOpenInBrowser) {
        openMaskedFileInBrowser(file.id, 'PWDLESS_PUBLIC', file.original_name);
      } else {
        triggerMaskedFileDownload(file.id, 'PWDLESS_PUBLIC', file.original_name);
      }
      onClose();
    } else if (file.is_passwordless && effectiveInitialAction === 'download') {
      triggerMaskedFileDownload(file.id, 'PWDLESS_PUBLIC', file.original_name);
      onClose();
    }
  }, [file?.id, initialAction, isAdmin]);

  if (!file) return null;

  const handleDelete = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('vault_session_token');
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token } : {}),
        },
        body: JSON.stringify({
          file_id: file.id,
          pin: file.is_passwordless ? 'PWDLESS_PUBLIC' : inputPin.trim(),
          token,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Note deleted successfully.');
        setTimeout(() => {
          onClose();
          onRefreshRepository();
        }, 400);
      } else {
        setErrorMessage(data.error || 'Incorrect password / PIN. Deletion failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Delete error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col p-5 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 absolute top-0 left-0 right-0" />
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="pr-8 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">
            {actionTab === 'delete' ? (
              <>
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-600">Delete Note</span>
              </>
            ) : isLink ? (
              <>
                <Globe className="w-3.5 h-3.5 text-cyan-600" />
                <span className="text-cyan-700">
                  Shared Web Link • {file.is_passwordless ? 'Public' : 'Protected'}
                </span>
              </>
            ) : (
              <>
                {file.is_passwordless ? (
                  <PublicGlobeCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {file.file_extension} Study Note •{' '}
                  {file.is_passwordless ? 'Public Access' : 'Protected (PIN Required)'}
                </span>
              </>
            )}
          </div>

          <h3
            className="text-lg font-extrabold text-slate-900 truncate"
            title={fixMojibake(file.original_name)}
          >
            {fixMojibake(file.original_name)}
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span>
              {isLink ? 'Domain:' : 'Size:'}{' '}
              <strong className="text-slate-800 font-semibold">
                {file.file_size_formatted || 'web-link'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Dept: <strong className="text-slate-800 font-semibold">{file.department}</strong>
            </span>
            <span>•</span>
            <span>
              By: <strong className="text-slate-800 font-semibold">{file.uploader_name}</strong>
            </span>
            {file.tags && file.tags.length > 0 && (
              <div className="flex items-center gap-1 ml-0.5">
                {file.tags.map((t) => (
                  <span
                    key={t}
                    className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded select-none"
                  >
                    #{shortenTag(t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ADMIN-ONLY ACTION TABS */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 border-b border-slate-200 py-2.5 mt-3 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActionTab('details')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                actionTab === 'details'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {isLink ? 'Link Specs' : 'Technical Specs'}
            </button>
            <button
              onClick={() => setActionTab('decrypt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                actionTab === 'decrypt'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {canOpenInBrowser ? 'Open in Browser' : 'Decrypt & Download'}
            </button>
            {!isLink && (
              <button
                onClick={() => setActionTab('download')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  actionTab === 'download'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}
            <button
              onClick={() => setActionTab('delete')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                actionTab === 'delete'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-0.5 custom-scrollbar">
          {/* 1. ADMIN-ONLY TECHNICAL DETAILS TAB */}
          {isAdmin && actionTab === 'details' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Cipher Engine:</span>
                  <span className="text-blue-600 font-bold">AES-256-CBC</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Format / MIME:</span>
                  <span className="text-slate-800 font-bold truncate max-w-[220px]">
                    {file.mime_type || file.file_extension}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Key Derivation:</span>
                  <span className="text-slate-800">PBKDF2 SHA-256 (10,000 Iterations)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Encryption Salt:</span>
                  <span className="text-slate-800 truncate max-w-[180px]" title={file.encryption_salt}>
                    {file.encryption_salt || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Initialization Vector (IV):</span>
                  <span className="text-slate-800 truncate max-w-[180px]" title={file.encryption_iv}>
                    {file.encryption_iv || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-500">Batch Storage ID:</span>
                  <span className="text-slate-800">{file.batch_id}</span>
                </div>
                {file.tags && file.tags.length > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/80">
                    <span className="text-slate-500">Organizational Tags:</span>
                    <span className="text-blue-700 font-bold">{file.tags.map(shortenTag).join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">48-Hour Purge Timestamp:</span>
                  <span className="text-rose-600 font-semibold">
                    {new Date(file.expires_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. DECRYPT & OPEN IN BROWSER (OR DOWNLOAD IF UNSUPPORTED BINARY) */}
          {actionTab === 'decrypt' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDecryptAndOpenInBrowser();
              }}
              className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4"
            >
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ProtectedShieldLockIcon className="w-4 h-4 text-amber-600" />
                <span>
                  Enter 6-Char Protection PIN to{' '}
                  {canOpenInBrowser ? 'Decrypt & Open in Browser' : 'Decrypt & Download File'}
                </span>
              </label>
              <p className="text-[11px] text-slate-500 leading-snug">
                {canOpenInBrowser
                  ? 'Once decrypted, this supported file will open directly in a new browser tab without showing an in-app preview.'
                  : 'Once decrypted, this file will be downloaded directly to your device.'}
              </p>
              <input
                type="password"
                autoFocus
                required={!file.is_passwordless}
                placeholder={isAdmin ? 'Enter 6-char PIN or Admin Master Password' : 'Enter 6-character PIN'}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={isProcessing || (!file.is_passwordless && !inputPin.trim())}
                className="w-full bg-[#0e3ec7] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Decrypting...</span>
                  </>
                ) : canOpenInBrowser ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Decrypt & Open in Browser</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Decrypt & Download File</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. DOWNLOAD TAB */}
          {actionTab === 'download' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDownload(undefined, true);
              }}
              className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4"
            >
              {!file.is_passwordless && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-amber-600" />
                    Enter Password / PIN to Download
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder={isAdmin ? 'Enter 6-char PIN or Admin Master Password' : 'Enter 6-character PIN'}
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing || (!file.is_passwordless && !inputPin.trim())}
                className="w-full bg-[#0e3ec7] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Downloading...' : 'Decrypt & Download File'}</span>
              </button>
            </form>
          )}

          {/* 4. DELETE TAB */}
          {actionTab === 'delete' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="space-y-4 bg-rose-50/40 border border-rose-200/80 rounded-xl p-4"
            >
              {!file.is_passwordless ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-rose-600" />
                    Enter Password / PIN to Delete Note
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter 6-character PIN"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-600 font-medium">
                  Are you sure you want to permanently remove <strong>{fixMojibake(file.original_name)}</strong> from the board?
                </p>
              )}

              <button
                type="submit"
                disabled={isProcessing || (!file.is_passwordless && !inputPin.trim())}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'Deleting...' : 'Delete Note'}</span>
              </button>
            </form>
          )}

          {/* Status Feedback Alerts */}
          {errorMessage && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
