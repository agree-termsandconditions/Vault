import React, { useState, useEffect } from 'react';
import { VaultFile, shortenTag, fixMojibake } from '../types';
import { getDisplayNoteTitle } from '../utils/noteUtils';
import {
  ProtectedShieldLockIcon,
  PublicGlobeCheckIcon,
  triggerMaskedFileDownload,
  openFileDirectly,
} from './RepositoryCard';
import { apiFetch } from '../utils/apiFetch';
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
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface FileModalProps {
  file: VaultFile | null;
  initialAction: 'decrypt' | 'download' | 'details' | 'delete';
  isAdmin?: boolean;
  onClose: () => void;
  onRefreshRepository: () => void;
}

const LEGACY_TOPIC_TAGS = new Set(['revision', 'homework', 'anatomy', 'formula', 'lab', 'exam']);

export const FileModal: React.FC<FileModalProps> = ({
  file,
  initialAction,
  isAdmin = false,
  onClose,
  onRefreshRepository,
}) => {
  const effectiveInitialAction =
    !isAdmin && initialAction === 'details' ? 'decrypt' : initialAction;

  const [actionTab, setActionTab] = useState<'decrypt' | 'download' | 'details' | 'delete'>(
    effectiveInitialAction
  );
  const [inputPin, setInputPin] = useState('');
  const [unlockedPin, setUnlockedPin] = useState<string | null>(
    file?.is_passwordless ? 'PWDLESS_PUBLIC' : null
  );
  const [unlockedLinkUrl, setUnlockedLinkUrl] = useState<string | null>(
    file?.is_link && file?.link_url ? file.link_url : null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLink = !!file?.is_link;

  // Verify PIN and open file directly without rendering raw contents on this modal screen
  const handleUnlockAndOpenDirectly = async (pinToUse: string, openImmediately = true) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await apiFetch('/api/decrypt', {
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
        setUnlockedPin(pinToUse);
        const resolvedUrl = data.link_url || file.link_url || null;
        setUnlockedLinkUrl(resolvedUrl);
        setSuccessMessage('Access verified — opening file directly.');

        if (openImmediately) {
          if (data.is_link || file.is_link) {
            if (resolvedUrl) {
              const a = document.createElement('a');
              a.href = resolvedUrl;
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }
          } else {
            openFileDirectly(file, pinToUse);
          }
        }
      } else {
        setErrorMessage(data.error || 'Incorrect password / PIN.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error while unlocking note.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download file with PIN
  const handleDownload = async (customPin?: string, autoCloseAfterDownload = false) => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const pinToUse =
      customPin !== undefined
        ? customPin
        : unlockedPin
        ? unlockedPin
        : file.is_passwordless
        ? 'PWDLESS_PUBLIC'
        : inputPin.trim();

    try {
      const res = await apiFetch('/api/decrypt', {
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
        setUnlockedPin(pinToUse);
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

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInputPin('');
    setActionTab(effectiveInitialAction);

    if (!file) return;

    setUnlockedLinkUrl(file.is_link && file.link_url ? file.link_url : null);

    if (file.is_passwordless) {
      setUnlockedPin('PWDLESS_PUBLIC');
      if (effectiveInitialAction === 'decrypt' && !isAdmin) {
        openFileDirectly(file, 'PWDLESS_PUBLIC');
        onClose();
      } else if (effectiveInitialAction === 'download') {
        triggerMaskedFileDownload(file.id, 'PWDLESS_PUBLIC', file.original_name);
        onClose();
      }
    } else {
      setUnlockedPin(null);
    }
  }, [file, initialAction, isAdmin]);

  if (!file) return null;

  const displayTags = (file.tags || [])
    .map((t) => shortenTag(String(t || '').trim()))
    .filter((t) => t && !LEGACY_TOPIC_TAGS.has(t.toLowerCase()))
    .slice(0, 3);

  const handleDelete = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('vault_session_token');
      const res = await apiFetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: file.id,
          password: inputPin.trim(),
          pin: inputPin.trim(),
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

  const previewUrl = unlockedPin
    ? `/api/preview/${file.id}?pin=${encodeURIComponent(unlockedPin)}`
    : null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/95 rounded-3xl w-full max-w-md flex flex-col p-6 shadow-2xl relative overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 absolute top-0 left-0 right-0" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Redesigned Compact Header */}
        <div className="pr-8 shrink-0 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider border bg-slate-50 border-slate-200">
            {actionTab === 'delete' ? (
              <>
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-600">Delete Study Note</span>
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
                  <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span className={file.is_passwordless ? 'text-emerald-700' : 'text-rose-700'}>
                  {file.file_extension} Study Note •{' '}
                  {file.is_passwordless ? 'Public Access' : 'PIN Protected'}
                </span>
              </>
            )}
          </div>

          <h3
            className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug break-words"
          >
            {getDisplayNoteTitle(file.original_name, isLink, file.file_extension)}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-500 pt-0.5">
            <span>
              {isLink ? 'Type:' : 'Size:'}{' '}
              <strong className="text-slate-800 font-semibold">
                {file.file_size_formatted || 'Web URL'}
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
          </div>

          {displayTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {displayTags.map((t) => (
                <span
                  key={t}
                  className="bg-blue-50 border border-blue-200/90 text-blue-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md select-none"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ADMIN-ONLY ACTION TABS */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 border-b border-slate-200 py-2.5 mt-4 shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActionTab('decrypt')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                actionTab === 'decrypt'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Open & Actions
            </button>
            <button
              type="button"
              onClick={() => setActionTab('details')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                actionTab === 'details'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {isLink ? 'Link Specs' : 'Technical Specs'}
            </button>
            <button
              type="button"
              onClick={() => setActionTab('delete')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
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

        {/* Modal Body (No raw file contents rendered on this screen) */}
        <div className="space-y-4 pt-4">
          {/* 1. ADMIN-ONLY TECHNICAL DETAILS TAB */}
          {isAdmin && actionTab === 'details' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Cipher Engine:</span>
                <span className="text-blue-600 font-bold">AES-256-CBC</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Format / MIME:</span>
                <span className="text-slate-800 font-bold truncate max-w-[200px]">
                  {file.mime_type || file.file_extension}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Key Derivation:</span>
                <span className="text-slate-800">PBKDF2 SHA-256</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Batch Storage ID:</span>
                <span className="text-slate-800">{file.batch_id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">48-Hour Purge Timestamp:</span>
                <span className="text-rose-600 font-semibold">
                  {new Date(file.expires_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 2. OPEN / UNLOCK TAB (Redesigned — Never displays inline file contents) */}
          {actionTab === 'decrypt' && (
            <div className="space-y-3">
              {!unlockedPin ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUnlockAndOpenDirectly(inputPin.trim(), true);
                  }}
                  className="space-y-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                      <ProtectedShieldLockIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        6-Character Protection PIN Required
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Enter the 6-character protection PIN to unlock and open directly.
                      </p>
                    </div>
                  </div>

                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter 6-character protection PIN"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="submit"
                      disabled={isProcessing || !inputPin.trim()}
                      className="bg-[#0e3ec7] hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Unlock & Open Directly</span>
                        </>
                      )}
                    </button>

                    {!isLink && (
                      <button
                        type="button"
                        disabled={isProcessing || !inputPin.trim()}
                        onClick={() => handleDownload(inputPin.trim(), true)}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unlock & Download</span>
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5">
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Ready for Direct Access
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        This study note is unlocked. Choose an action below to open it directly in a new tab or download the original file.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {isLink ? (
                      <a
                        href={unlockedLinkUrl || file.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm:col-span-2 bg-[#0e3ec7] hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Website Directly</span>
                      </a>
                    ) : (
                      <>
                        {previewUrl && (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0e3ec7] hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open File Directly</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownload(unlockedPin, false)}
                          disabled={isProcessing}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download File</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. DOWNLOAD TAB */}
          {actionTab === 'download' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDownload(undefined, true);
              }}
              className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-4"
            >
              {!file.is_passwordless && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-rose-600" />
                    Enter Password / PIN to Download
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Enter 6-character protection PIN"
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

          {/* 4. DELETE TAB (Strict UI Privacy: Zero admin override details exposed) */}
          {actionTab === 'delete' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="space-y-4 bg-rose-50/40 border border-rose-200/80 rounded-2xl p-4"
              autoComplete="off"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ProtectedShieldLockIcon className="w-3.5 h-3.5 text-rose-600" />
                  <span>Uploader Authorization Required to Delete</span>
                </label>
                <p className="text-[11.5px] text-slate-600 leading-snug">
                  Please enter the <strong>uploader's password or 6-character PIN</strong> to remove this study note from the public repository.
                </p>
                <input
                  type="password"
                  name="vault_del_pass_no_cache"
                  autoFocus
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Enter uploader PIN or password"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !inputPin.trim()}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isProcessing ? 'Verifying & Deleting...' : 'Verify & Delete Note'}</span>
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
