import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: string;
  userRole?: string;
  userDepartment?: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  sessionExpiresAt?: number | null;
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
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: Brand Logo + Cylindrical Beta Badge */}
        <div
          onClick={() => setActiveTab('repository')}
          className="flex items-center gap-2.5 group transition-all duration-150 active:scale-95 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[19px] leading-none">verified_user</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              Vault
            </span>
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300/70 text-[10.5px] font-extrabold tracking-wide shadow-2xs"
              title="Vault Campus Edition"
            >
              Beta
            </span>
          </div>
        </div>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2.5">
          {/* Help & Documentation Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 border border-transparent hover:border-blue-200/80 transition-all cursor-pointer text-xs font-bold shadow-2xs"
            title="Help & Documentation — How to Use This Site"
          >
            <span className="material-symbols-outlined text-[17px] leading-none text-blue-600">
              help_outline
            </span>
            <span className="hidden sm:inline leading-none">Help & Guide</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* Sign In or Active Session */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <button
                  onClick={() => setActiveTab(isOnAdminView ? 'repository' : 'admin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                    isOnAdminView
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-600 shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                  title={isOnAdminView ? 'Return to Home / Notes Page' : 'Open Admin Console'}
                >
                  <span className="material-symbols-outlined text-[16px] leading-none">
                    {isOnAdminView ? 'grid_view' : 'admin_panel_settings'}
                  </span>
                  <span className="leading-none">
                    {isOnAdminView ? 'Home / Notes' : 'Admin Console'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                    {currentUser.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')}
                  </div>
                  <strong className="text-slate-900">{currentUser}</strong>
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {userDepartment}
                  </span>
                </div>
              )}

              {/* 15-Minute Institutional Session Timeout Live Countdown Timer */}
              {isLoggedIn && sessionExpiresAt && (
                <div
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border transition-all inline-flex items-center gap-1.5 shadow-2xs select-none ${
                    secondsRemaining <= 120
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-amber-50/90 text-amber-900 border-amber-200/90'
                  }`}
                  title={`Institutional Session Timeout: Auto-logout in ${formatTimer(secondsRemaining)} (15-min policy)`}
                >
                  <span className={`material-symbols-outlined text-[15px] leading-none ${secondsRemaining <= 120 ? 'text-rose-600' : 'text-amber-700'}`}>
                    schedule
                  </span>
                  <span className="leading-none tracking-tight">{formatTimer(secondsRemaining)}</span>
                </div>
              )}

              <button
                onClick={onLogout}
                className="border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-700 p-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs px-3.5 py-1.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px] leading-none text-blue-600">login</span>
              <span className="leading-none">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
