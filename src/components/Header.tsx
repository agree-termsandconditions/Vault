import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: string;
  userRole?: string;
  userDepartment?: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  sessionExpiresAt?: number | null;
  highContrastLight?: boolean;
  onToggleHighContrast?: () => void;
  onOpenUpload?: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser = 'Dr. Meera Nair',
  userDepartment = 'Science',
  isLoggedIn,
  isAdmin = false,
  sessionExpiresAt,
  onLogin,
  onLogout,
  onOpenHelp,
}) => {
  const isOnAdminView = ['admin', 'security', 'team', 'activity'].includes(activeTab);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  // Close profile popover on click outside
  useEffect(() => {
    if (!isProfilePopoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(e.target as Node)
      ) {
        setIsProfilePopoverOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isProfilePopoverOpen]);

  // Derive compact single uppercase letter for the Chrome-style avatar circle
  const getAvatarLetter = (name?: string) => {
    if (!name || !name.trim()) return 'U';
    const clean = name.trim().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '').trim();
    return (clean[0] || name.trim()[0] || 'U').toUpperCase();
  };

  const avatarLetter = getAvatarLetter(currentUser);

  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(() => {
    if (!sessionExpiresAt) return 0;
    return Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
  });

  React.useEffect(() => {
    if (!isLoggedIn || !sessionExpiresAt) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, sessionExpiresAt]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 transition-all">
      <div className="max-w-[1440px] mx-auto w-full px-3.5 sm:px-5 lg:px-8 h-9.5 sm:h-10 lg:h-10.5 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand Identity (Logo + "Notes Space" + "Beta") */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            onClick={() => setActiveTab('repository')}
            className="flex items-center gap-1.5 sm:gap-2 group transition-all duration-150 active:scale-95 cursor-pointer select-none shrink-0"
          >
            <img
              src="/logo.png"
              alt="Notes Space Logo"
              className="w-6.5 h-6.5 sm:w-7 sm:h-7 object-contain group-hover:scale-105 transition-transform duration-150 select-none drop-shadow-xs"
            />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                Notes Space
              </span>
              {/* Beta Badge */}
              <span
                className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300/80 text-[9px] sm:text-[9.5px] font-extrabold tracking-wide whitespace-nowrap select-none"
              >
                Beta
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions Cluster: Help (?) Button + Auth UI */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Help & Shortcut Guide (?) Icon Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
            aria-label="Help & Keyboard Shortcuts Guide"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[17px] leading-none text-slate-600">
              help_outline
            </span>
          </button>

          {/* Institutional Session Auto-Logout Countdown Timer (when logged in on sm+) */}
          {isLoggedIn && sessionExpiresAt && (
            <div
              className={`hidden sm:inline-flex px-2 sm:px-2.5 h-8 items-center rounded-xl text-xs font-mono font-bold tabular-nums border transition-all gap-1.5 select-none ${
                secondsRemaining <= 120
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-amber-50/90 text-amber-900 border-amber-200/90'
              }`}
              aria-label={`Institutional Session Timeout: Auto-logout in ${formatTimer(secondsRemaining)}`}
            >
              <span
                className={`material-symbols-outlined text-[14px] sm:text-[15px] leading-none ${
                  secondsRemaining <= 120 ? 'text-rose-600' : 'text-amber-700'
                }`}
              >
                schedule
              </span>
              <span className="leading-none text-[11px] sm:text-xs tracking-tight">{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          {/* Simplified Auth UI */}
          {isLoggedIn ? (
            <div className="relative flex items-center gap-2" ref={profilePopoverRef}>
              {/* Optional Admin quick switcher button for instant navigation */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab(isOnAdminView ? 'repository' : 'admin')}
                  className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    isOnAdminView
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-600 shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                  aria-label={isOnAdminView ? 'Return to Notes Board' : 'Open Admin Console'}
                >
                  <span className="material-symbols-outlined text-[15px] sm:text-[16px] leading-none">
                    {isOnAdminView ? 'grid_view' : 'admin_panel_settings'}
                  </span>
                  <span className="hidden sm:inline leading-none text-[11.5px] sm:text-xs">
                    {isOnAdminView ? 'Notes' : 'Admin'}
                  </span>
                </button>
              )}

              {/* Compact Circular Profile Avatar Badge (Chrome-style) */}
              <button
                type="button"
                onClick={() => setIsProfilePopoverOpen((prev) => !prev)}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center ring-2 ring-slate-200/90 hover:ring-blue-400 transition-all shadow-xs cursor-pointer active:scale-95 select-none"
                aria-label="User Account Menu"
                aria-expanded={isProfilePopoverOpen}
              >
                <span className="leading-none">{avatarLetter}</span>
              </button>

              {/* Minimal Profile Popover with Sign Out */}
              {isProfilePopoverOpen && (
                <div className="absolute right-0 top-10 sm:top-11 w-64 bg-white border border-slate-200/95 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  <div className="flex items-center gap-3 p-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-inner">
                      {avatarLetter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900 truncate leading-tight">{currentUser}</p>
                      <p className="text-xs text-blue-700 font-semibold truncate mt-0.5">{userDepartment} Dept</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(isOnAdminView ? 'repository' : 'admin');
                        setIsProfilePopoverOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-800 flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-blue-600">
                          {isOnAdminView ? 'grid_view' : 'admin_panel_settings'}
                        </span>
                        <span>{isOnAdminView ? 'Notes Board' : 'Admin Console'}</span>
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                    </button>
                  )}

                  {sessionExpiresAt && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600 font-semibold tabular-nums">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>Auto-Logout</span>
                      </span>
                      <span className="font-bold text-slate-800">{formatTimer(secondsRemaining)}</span>
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfilePopoverOpen(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Signed Out: Existing Sign In Button */
            <button
              type="button"
              onClick={onLogin}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-7.5 sm:h-8 px-2.5 sm:px-3 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] leading-none text-sky-300">
                login
              </span>
              <span className="leading-none text-[11px] sm:text-xs">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
