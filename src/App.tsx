import React, { useState, useEffect } from 'react';
import { ClockAlert, ArrowRight } from 'lucide-react';
import { VaultFile, DEFAULT_DEPARTMENTS, DepartmentConfig, SiteTheme } from './types';
import { Header } from './components/Header';
import { UploadWizardModal } from './components/UploadWizardModal';
import { RepositoryCard } from './components/RepositoryCard';
import { FileModal } from './components/FileModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LoginModal } from './components/LoginModal';
import { FoxxyChatbot } from './components/FoxxyChatbot';
import { ShareLinkModal } from './components/ShareLinkModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { SeasonalThemeOverlay } from './components/SeasonalThemeOverlay';
import { apiFetch } from './utils/apiFetch';

const FILES_CACHE_KEY = 'vault_cached_files_v1';

export default function App() {
  const isStoredSessionActive = (): boolean => {
    const loggedIn = localStorage.getItem('vault_logged_in') === 'true';
    if (!loggedIn) return false;
    const expStr = localStorage.getItem('vault_session_expires_at');
    if (!expStr) return false;
    const exp = Number(expStr);
    return !isNaN(exp) && exp > Date.now();
  };

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem('vault_active_tab');
    if (saved && ['admin', 'security', 'team', 'activity', 'themes'].includes(saved)) {
      return isStoredSessionActive() ? saved : 'repository';
    }
    return saved || 'repository';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('vault_active_tab', tab);
  };

  // High-Contrast Daylight Accessibility Mode (enabled by default for background dotted structure)
  const [highContrastLight, setHighContrastLight] = useState<boolean>(() => {
    const saved = localStorage.getItem('vault_high_contrast_light');
    return saved === null ? true : saved === 'true';
  });

  const toggleHighContrast = () => {
    setHighContrastLight((prev) => {
      const next = !prev;
      localStorage.setItem('vault_high_contrast_light', String(next));
      return next;
    });
  };

  // Auth state persisted in localStorage with active session validation
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return isStoredSessionActive();
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return isStoredSessionActive() && localStorage.getItem('vault_is_admin') === 'true';
  });
  const [isMasterAdmin, setIsMasterAdmin] = useState<boolean>(() => {
    return isStoredSessionActive() && localStorage.getItem('vault_is_master_admin') === 'true';
  });
  const [isSuperuser, setIsSuperuser] = useState<boolean>(() => {
    return isStoredSessionActive() && localStorage.getItem('vault_is_superuser') !== 'false';
  });
  const [currentUser, setCurrentUser] = useState<string>(() => {
    return isStoredSessionActive() ? (localStorage.getItem('vault_current_user') || 'Dr. Meera Nair') : 'Guest';
  });
  const [userRole, setUserRole] = useState<string>(() => {
    return isStoredSessionActive() ? (localStorage.getItem('vault_user_role') || 'Senior Science Teacher (Science)') : 'Standard Guest';
  });
  const [userDepartment, setUserDepartment] = useState<string>(() => {
    return isStoredSessionActive() ? (localStorage.getItem('vault_user_department') || 'Science') : 'Science';
  });

  // 15-Minute Institutional Terminal Session Timeout (Auto-logout)
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    const isLoggedInStored = localStorage.getItem('vault_logged_in') === 'true';
    if (!isLoggedInStored) return null;
    const storedExp = localStorage.getItem('vault_session_expires_at');
    if (storedExp) {
      const expNum = Number(storedExp);
      if (!isNaN(expNum) && expNum > Date.now()) {
        return expNum;
      }
    }
    const newExp = Date.now() + 15 * 60 * 1000;
    localStorage.setItem('vault_session_expires_at', String(newExp));
    return newExp;
  });

  // Low-latency cache-first hydration for instant initial paint (excluding directory items)
  const [files, setFiles] = useState<VaultFile[]>(() => {
    try {
      const cached = localStorage.getItem(FILES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (f: VaultFile) => !f.is_directory && String(f.file_extension || '').toUpperCase() !== 'DIR'
          );
        }
      }
    } catch {}
    return [];
  });

  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [modalAction, setModalAction] = useState<'decrypt' | 'download' | 'details' | 'delete'>('decrypt');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [activeTheme, setActiveTheme] = useState<SiteTheme | null>(null);

  const fetchSiteThemes = async () => {
    try {
      const res = await apiFetch('/api/themes');
      const data = await res.json();
      if (data.success && Array.isArray(data.themes)) {
        if (data.activeThemeId) {
          const found = data.themes.find((t: SiteTheme) => t.id === data.activeThemeId);
          setActiveTheme(found || null);
        } else {
          setActiveTheme(null);
        }
      }
    } catch {
      setActiveTheme(null);
    }
  };

  useEffect(() => {
    fetchVaultFiles();
    fetchDepartments();
    fetchSiteThemes();
  }, []);

  const fetchVaultFiles = async () => {
    try {
      const res = await apiFetch('/api/files');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        const nonDirFiles = data.files.filter(
          (f: VaultFile) => !f.is_directory && String(f.file_extension || '').toUpperCase() !== 'DIR'
        );
        setFiles(nonDirFiles);
        try {
          localStorage.setItem(FILES_CACHE_KEY, JSON.stringify(nonDirFiles));
        } catch {}
      }
    } catch (err) {
      console.error('Error syncing repository files:', err);
    }
  };

  // Optimistic zero-latency update for note tags
  const handleUpdateFileMeta = async (fileId: number, newTags: string[], customColor?: string) => {
    setFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === fileId
          ? { ...f, tags: newTags, custom_color: customColor || f.custom_color }
          : f
      );
      try {
        localStorage.setItem(FILES_CACHE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await apiFetch('/api/files/update-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          tags: newTags,
          custom_color: customColor,
        }),
      });
    } catch (err) {
      console.error('Error updating note metadata:', err);
      fetchVaultFiles();
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiFetch('/api/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch {}
  };

  const handleSelectFile = (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => {
    // Always pass a fresh object copy so clicking the same file multiple times triggers FileModal cleanly
    setModalAction(action);
    setSelectedFile({ ...file });
  };

  const handleLoginSuccess = (userData: {
    username: string;
    fullName: string;
    role: string;
    department: string;
    isSuperuser: boolean;
    isAdmin: boolean;
    isMasterAdmin?: boolean;
    token?: string;
  }) => {
    const masterFlag = Boolean(userData.isMasterAdmin);
    const expTime = Date.now() + 15 * 60 * 1000;

    setIsLoggedIn(true);
    setIsAdmin(userData.isAdmin || masterFlag);
    setIsMasterAdmin(masterFlag);
    setIsSuperuser(userData.isSuperuser || userData.isAdmin || masterFlag);
    setCurrentUser(userData.fullName);
    setUserRole(userData.role);
    setUserDepartment(userData.department || 'Science');
    setSessionExpiresAt(expTime);

    localStorage.setItem('vault_logged_in', 'true');
    localStorage.setItem('vault_emp_id', userData.username);
    if (userData.token) {
      localStorage.setItem('vault_session_token', userData.token);
      try {
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `vault_session_token=${encodeURIComponent(userData.token)}; path=/; max-age=86400; ${isSecure ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
      } catch {}
    }
    localStorage.setItem('vault_is_admin', userData.isAdmin || masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_is_master_admin', masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_is_superuser', userData.isSuperuser || userData.isAdmin || masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_current_user', userData.fullName);
    localStorage.setItem('vault_user_role', userData.role);
    localStorage.setItem('vault_user_department', userData.department || 'Science');
    localStorage.setItem('vault_session_expires_at', String(expTime));
  };

  const handleLogout = (keepLoginModalOpen = false) => {
    const token = localStorage.getItem('vault_session_token');

    // Clear state & session keys synchronously first to prevent any race condition on subsequent sign-ins
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsMasterAdmin(false);
    setIsSuperuser(false);
    setCurrentUser('Guest');
    setUserRole('Standard Guest');
    setUserDepartment('Science');
    setActiveTab('repository');
    setSessionExpiresAt(null);
    setSelectedFile(null);
    setShowUploadWizard(false);
    if (!keepLoginModalOpen) {
      setShowLoginModal(false);
    }

    localStorage.removeItem('vault_logged_in');
    localStorage.removeItem('vault_emp_id');
    localStorage.removeItem('vault_session_token');
    localStorage.removeItem('vault_is_admin');
    localStorage.removeItem('vault_is_master_admin');
    localStorage.removeItem('vault_is_superuser');
    localStorage.removeItem('vault_current_user');
    localStorage.removeItem('vault_user_role');
    localStorage.removeItem('vault_user_department');
    localStorage.removeItem('vault_session_expires_at');
    localStorage.removeItem('vault_active_tab');
    try {
      sessionStorage.clear();
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `vault_session_token=; path=/; max-age=0; ${isSecure ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
    } catch {}

    if (token) {
      void fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Session-Token': token,
        },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  };

  // Institutional Terminal Security: In-browser session timeout after 15 minutes
  useEffect(() => {
    if (!isLoggedIn || !sessionExpiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= sessionExpiresAt) {
        clearInterval(interval);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setIsMasterAdmin(false);
        setIsSuperuser(false);
        setCurrentUser('Guest');
        setUserRole('Standard Guest');
        setUserDepartment('Science');
        setSessionExpiresAt(null);

        localStorage.removeItem('vault_logged_in');
        localStorage.removeItem('vault_session_token');
        localStorage.removeItem('vault_is_admin');
        localStorage.removeItem('vault_is_master_admin');
        localStorage.removeItem('vault_is_superuser');
        localStorage.removeItem('vault_current_user');
        localStorage.removeItem('vault_user_role');
        localStorage.removeItem('vault_user_department');
        localStorage.removeItem('vault_session_expires_at');
        localStorage.removeItem('vault_active_tab');

        setShowSessionExpiredModal(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, sessionExpiresAt]);

  return (
    <div
      className={`min-h-screen bg-[#faf8ff] text-[#0f172a] flex flex-col antialiased relative classroom-dots ${
        highContrastLight ? 'high-contrast-light' : ''
      }`}
    >
      {/* Dynamic Seasonal Theme & Ambient Overlays (non-blocking) */}
      <SeasonalThemeOverlay activeTheme={activeTheme} />

      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        userRole={userRole}
        userDepartment={userDepartment}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        sessionExpiresAt={sessionExpiresAt}
        highContrastLight={highContrastLight}
        onToggleHighContrast={toggleHighContrast}
        onOpenUpload={() => {
          if (!isLoggedIn) {
            setShowLoginModal(true);
          } else {
            setShowUploadWizard(true);
          }
        }}
        onLogin={() => setShowLoginModal(true)}
        onLogout={() => handleLogout(false)}
        onOpenHelp={() => {
          fetchDepartments();
          setShowHelpModal(true);
        }}
      />

      {/* Main Body Canvas */}
      <div className={`w-full flex-1 flex flex-col ${['admin', 'security', 'team', 'activity', 'themes'].includes(activeTab) ? 'p-0' : 'px-2.5 sm:px-3.5 lg:px-8 py-2 sm:py-3 lg:py-4'}`}>
        {(activeTab === 'repository' || activeTab === 'dashboard') && (
          <RepositoryCard
            files={files}
            activeTheme={activeTheme}
            onSelectFile={handleSelectFile}
            onRefresh={fetchVaultFiles}
            onUpdateFileMeta={handleUpdateFileMeta}
            onOpenUpload={() => {
              if (!isLoggedIn) {
                setShowLoginModal(true);
              } else {
                setShowUploadWizard(true);
              }
            }}
            isAdmin={isAdmin}
          />
        )}

        {(activeTab === 'admin' || activeTab === 'security' || activeTab === 'team' || activeTab === 'activity' || activeTab === 'themes') && (
          <AdminDashboardView
            files={files}
            isMasterAdmin={isMasterAdmin}
            currentUser={currentUser}
            initialSection={
              activeTab === 'security'
                ? 'security'
                : activeTab === 'team'
                ? 'team'
                : activeTab === 'activity'
                ? 'activity'
                : activeTab === 'themes'
                ? 'themes'
                : 'overview'
            }
            onSelectFile={handleSelectFile}
            onRefreshFiles={fetchVaultFiles}
            onBackToRepository={() => setActiveTab('repository')}
            onThemeUpdated={fetchSiteThemes}
          />
        )}
      </div>

      {/* ================= COMPACT MODERN FOOTER ================= */}
      <footer className="w-full py-1 lg:py-2.5 mt-auto bg-white/95 backdrop-blur-md border-t border-slate-200/80 shrink-0 z-10 transition-colors">
        <div className="max-w-[1440px] mx-auto w-full px-3.5 sm:px-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-0.5 sm:gap-2 text-center sm:text-left text-[9.5px] lg:text-[11px]">
          <div className="text-slate-600 font-medium">
            <span>
              Designed & Built by{' '}
              <strong className="text-blue-700 font-bold">Akish | 阿奇什 | அகிஷ்</strong>
            </span>
          </div>
          <div className="text-slate-500 font-medium">
            AES-256 Encrypted Study Notes • 48h Auto-Purge Repository
          </div>
        </div>
      </footer>

      {/* Help & User Guide Modal */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        departments={departments}
      />

      {/* In-Browser Session Expired Modal */}
      {showSessionExpiredModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-7 text-center relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-inner">
              <ClockAlert className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
              Session Expired
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Your 15-minute terminal session has expired due to inactivity for institutional campus data security.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowSessionExpiredModal(false);
                setActiveTab('repository');
              }}
              className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue as Visitor</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Foxxy AI Chatbot */}
      <FoxxyChatbot
        currentUser={currentUser}
        userRole={`${userDepartment} Dept`}
        isLoggedIn={isLoggedIn}
        mascotOverride={activeTheme?.mascotOverride}
        onLogin={() => setShowLoginModal(true)}
        onOpenUploadWizard={() => {
          if (!isLoggedIn) {
            setShowLoginModal(true);
          } else {
            setShowUploadWizard(true);
          }
        }}
      />

      {/* Upload Wizard Modal */}
      <UploadWizardModal
        isOpen={showUploadWizard}
        onClose={() => setShowUploadWizard(false)}
        onUploadSuccess={fetchVaultFiles}
        isLoggedIn={isLoggedIn}
        isSuperuser={isSuperuser}
        currentUser={currentUser}
        userDepartment={userDepartment}
        onLogin={() => {
          setShowUploadWizard(false);
          setShowLoginModal(true);
        }}
      />

      {/* Active File Decrypt / Modal */}
      {selectedFile && (
        <FileModal
          file={selectedFile}
          initialAction={modalAction}
          isAdmin={isAdmin}
          onClose={() => setSelectedFile(null)}
          onRefreshRepository={fetchVaultFiles}
        />
      )}

      {/* Share Web Link Modal */}
      <ShareLinkModal
        isOpen={showShareLinkModal}
        onClose={() => setShowShareLinkModal(false)}
        onSuccess={fetchVaultFiles}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogin={() => {
          setShowShareLinkModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Sign In / Admin Portal Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogout={() => handleLogout(true)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
