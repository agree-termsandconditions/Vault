import React, { useState, useEffect } from 'react';
import { VaultFile, DEFAULT_DEPARTMENTS, DepartmentConfig } from './types';
import { Header } from './components/Header';
import { UploadWizardModal } from './components/UploadWizardModal';
import { RepositoryCard } from './components/RepositoryCard';
import { FileModal } from './components/FileModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LoginModal } from './components/LoginModal';
import { FoxxyChatbot } from './components/FoxxyChatbot';
import { ShareLinkModal } from './components/ShareLinkModal';
import { HelpGuideModal } from './components/HelpGuideModal';

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
    if (saved && ['admin', 'security', 'team', 'activity'].includes(saved)) {
      return isStoredSessionActive() ? saved : 'repository';
    }
    return saved || 'repository';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('vault_active_tab', tab);
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

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [modalAction, setModalAction] = useState<'decrypt' | 'download' | 'details' | 'delete'>('decrypt');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  useEffect(() => {
    fetchVaultFiles();
    fetchDepartments();
  }, []);

  const fetchVaultFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Error syncing repository files:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }
    } catch {}
  };

  const handleSelectFile = (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => {
    setSelectedFile(file);
    setModalAction(action);
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
    if (userData.token) {
      localStorage.setItem('vault_session_token', userData.token);
    }
    localStorage.setItem('vault_is_admin', userData.isAdmin || masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_is_master_admin', masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_is_superuser', userData.isSuperuser || userData.isAdmin || masterFlag ? 'true' : 'false');
    localStorage.setItem('vault_current_user', userData.fullName);
    localStorage.setItem('vault_user_role', userData.role);
    localStorage.setItem('vault_user_department', userData.department || 'Science');
    localStorage.setItem('vault_session_expires_at', String(expTime));

    if (userData.isAdmin || masterFlag) {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsMasterAdmin(false);
    setIsSuperuser(false);
    setCurrentUser('Guest');
    setUserRole('Standard Guest');
    setUserDepartment('Science');
    setActiveTab('repository');
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
  };

  // Institutional Terminal Security: In-browser session timeout after 15 minutes
  useEffect(() => {
    if (!isLoggedIn || !sessionExpiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= sessionExpiresAt) {
        clearInterval(interval);
        // Clear stored session state immediately
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

        // Show in-browser session expired overlay with blurred page
        setShowSessionExpiredModal(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoggedIn, sessionExpiresAt]);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#151b2a] flex flex-col antialiased relative classroom-dots">
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
        onLogin={() => setShowLoginModal(true)}
        onLogout={() => handleLogout()}
        onOpenHelp={() => {
          fetchDepartments();
          setShowHelpModal(true);
        }}
      />

      {/* Main Body Canvas */}
      <div className="w-full px-3 sm:px-4 lg:px-4 xl:px-8 py-3.5 flex-1 flex flex-col">
        {(activeTab === 'repository' || activeTab === 'dashboard') && (
          <RepositoryCard
            files={files}
            onSelectFile={handleSelectFile}
            onRefresh={fetchVaultFiles}
            onOpenUpload={() => setShowUploadWizard(true)}
            isAdmin={isAdmin}
          />
        )}

        {(activeTab === 'admin' || activeTab === 'security' || activeTab === 'team' || activeTab === 'activity') && (
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
                : 'overview'
            }
            onSelectFile={handleSelectFile}
            onRefreshFiles={fetchVaultFiles}
            onBackToRepository={() => setActiveTab('repository')}
          />
        )}
      </div>

      {/* ================= COMPACT MODERN FOOTER ================= */}
      <footer className="w-full py-2.5 mt-auto bg-white/90 backdrop-blur-md border-t border-slate-200/80 shrink-0 z-10 transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center sm:justify-start text-center sm:text-left">
          {/* Copyright & Campus Repository Info */}
          <div className="text-[11px] text-slate-600 font-medium">
            <span>
              Designed & Built by{' '}
              <strong className="text-blue-700 font-bold">Akish | 阿奇什 | அகிஷ்</strong>
            </span>
          </div>
        </div>
      </footer>

      {/* Help & User Guide Modal (Includes Merged Terms of Service & Campus Guidelines) */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        departments={departments}
      />

      {/* In-Browser Session Expired Modal with Page Blur */}
      {showSessionExpiredModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/90 rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-7 text-center relative overflow-hidden flex flex-col items-center">
            {/* Top accent gradient stripe */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />

            {/* Circular warning icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-inner">
              <span className="material-symbols-outlined text-3xl">timer_off</span>
            </div>

            {/* Modal Title */}
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
              Session Expired
            </h3>

            {/* Modal Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Your 15-minute terminal session has expired due to inactivity for institutional campus data security.
            </p>

            {/* Continue Button */}
            <button
              type="button"
              onClick={() => {
                setShowSessionExpiredModal(false);
                setActiveTab('repository');
              }}
              className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue as Visitor</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Foxxy AI Chatbot */}
      <FoxxyChatbot
        currentUser={currentUser}
        userRole={`${userDepartment} Dept`}
        isLoggedIn={isLoggedIn}
        onLogin={() => setShowLoginModal(true)}
        onOpenUploadWizard={() => setShowUploadWizard(true)}
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
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
