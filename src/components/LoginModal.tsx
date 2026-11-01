import React, { useState, useEffect } from 'react';
import { Employee } from '../types';
import { PasswordResetModal } from './PasswordResetModal';
import {
  X,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  KeyRound,
  BadgeCheck,
  CheckCircle2,
  Zap,
  LogOut,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onLoginSuccess: (userData: {
    username: string;
    fullName: string;
    role: string;
    department: string;
    isSuperuser: boolean;
    isAdmin: boolean;
    isMasterAdmin?: boolean;
    token?: string;
  }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onLoginSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empId, setEmpId] = useState('EMP-1002');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dedicated PasswordResetModal & First-Login Activation Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetModalMode, setResetModalMode] = useState<'request' | 'redeem_token' | 'first_login'>('request');
  const [firstLoginEmployee, setFirstLoginEmployee] = useState<{
    emp_id: string;
    full_name: string;
    department: string;
    designation?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowResetModal(false);
      fetch('/api/employees')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.employees)) {
            setEmployees(d.employees);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // If PasswordResetModal is active, render it
  if (showResetModal) {
    return (
      <PasswordResetModal
        isOpen={showResetModal}
        initialMode={resetModalMode}
        initialEmpId={empId}
        firstLoginEmployee={firstLoginEmployee}
        onClose={() => {
          setShowResetModal(false);
          onClose();
        }}
        onBackToLogin={() => {
          setShowResetModal(false);
          setFirstLoginEmployee(null);
        }}
        onForceLogout={() => {
          if (onLogout) onLogout();
        }}
        onPasswordResetCompleted={(updatedEmpId) => {
          if (onLogout) onLogout();
          setEmpId(updatedEmpId);
          setPassword('');
          setFirstLoginEmployee(null);
          setShowResetModal(false);
          setSuccessMessage(
            'Password changed successfully , please login/signin again to continue'
          );
        }}
      />
    );
  }

  const executeLogin = async (idToUse: string, passToUse: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanId = idToUse.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Employee ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: cleanId,
          password: passToUse.trim(),
        }),
      });

      const data = await res.json();

      // Check if this is a first-login unactivated employee ("<emp_id>@2027")
      if (res.ok && data.success && data.requireFirstLoginChange && data.employee) {
        setFirstLoginEmployee(data.employee);
        setResetModalMode('first_login');
        setShowResetModal(true);
        return;
      }

      if (res.ok && data.success && data.user) {
        onLoginSuccess({
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role,
          department: data.user.department,
          isSuperuser: Boolean(data.user.isSuperuser),
          isAdmin: Boolean(data.user.isAdmin),
          isMasterAdmin: Boolean(data.user.isMasterAdmin),
          token: data.token,
        });
        onClose();
        return;
      }

      setErrorMessage(data.error || 'Invalid Employee ID, Password, or 6-char Quick PIN.');
    } catch {
      setErrorMessage('Unable to verify credentials. Please check your Employee ID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(empId, password);
  };

  const handleQuickFillAndSignIn = (presetEmpId: string, presetPassword: string) => {
    setEmpId(presetEmpId);
    setPassword(presetPassword);
    executeLogin(presetEmpId, presetPassword);
  };

  const demoAccounts = [
    {
      id: 'EMP-1002',
      password: '100299',
      label: 'Faculty (PIN)',
      sublabel: 'Quick PIN',
      color: 'blue',
      onClick: () => handleQuickFillAndSignIn('EMP-1002', '100299'),
    },
    {
      id: 'EMP-1007',
      password: 'EMP-1007@2027',
      label: '1st Login (0)',
      sublabel: 'Unactivated',
      color: 'amber',
      onClick: () => {
        setEmpId('EMP-1007');
        setPassword('EMP-1007@2027');
        setErrorMessage(null);
      },
    },
    {
      id: 'EMP-1005',
      password: 'Admin@123!',
      label: 'Campus Admin',
      sublabel: 'Full access',
      color: 'violet',
      onClick: () => handleQuickFillAndSignIn('EMP-1005', 'Admin@123!'),
    },
    {
      id: 'EMP-1001',
      password: 'Akish@143',
      label: 'Master Admin',
      sublabel: 'Root access',
      color: 'emerald',
      onClick: () => handleQuickFillAndSignIn('EMP-1001', 'Akish@143'),
    },
  ];

  const getAccountColors = (color: string) => {
    const map: Record<string, { bg: string; border: string; hoverBg: string; text: string; dot: string }> = {
      blue:    { bg: 'bg-blue-50/80',    border: 'border-blue-200/80',    hoverBg: 'hover:bg-blue-100/80',    text: 'text-blue-700',    dot: 'bg-blue-500' },
      amber:   { bg: 'bg-amber-50/80',   border: 'border-amber-200/80',   hoverBg: 'hover:bg-amber-100/80',   text: 'text-amber-700',   dot: 'bg-amber-500' },
      violet:  { bg: 'bg-violet-50/80',  border: 'border-violet-200/80',  hoverBg: 'hover:bg-violet-100/80',  text: 'text-violet-700',  dot: 'bg-violet-500' },
      emerald: { bg: 'bg-emerald-50/80', border: 'border-emerald-200/80', hoverBg: 'hover:bg-emerald-100/80', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    };
    return map[color] || map.blue;
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl relative text-slate-800 overflow-hidden">

        {/* ─── Gradient accent bar ─── */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

        {/* ─── Close Button ─── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center z-10"
          aria-label="Close login modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="px-7 pt-7 pb-6 space-y-5">

          {/* ─── Header ─── */}
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight">
                Campus Login Portal
              </h3>
              <p className="text-[12.5px] text-slate-500 font-medium mt-0.5">
                Unified Role-Based Access • Quick PIN or Password
              </p>
            </div>
          </div>

          {/* ─── Success Banner ─── */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-[12.5px] font-semibold flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-snug">{successMessage}</span>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) onLogout();
                    setPassword('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* ─── Error Banner ─── */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-[12.5px] font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* ─── Login Form ─── */}
          <form onSubmit={handleUnifiedLogin} className="space-y-4">
            {/* Employee ID */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                  Employee ID
                </span>
                <span className="text-[10.5px] font-medium text-slate-400">
                  Role auto-detected
                </span>
              </label>
              <input
                type="text"
                list="campus-employee-ids"
                required
                value={empId}
                onChange={(e) => {
                  setEmpId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. EMP-1002"
                className="w-full h-11 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl px-4 text-[13px] font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Password or Quick PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setResetModalMode('request');
                    setShowResetModal(true);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter password or 6-char Quick PIN"
                  className="w-full h-11 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl pl-4 pr-11 text-[13px] font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1.5 leading-relaxed">
                <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  New users: sign in with <code className="font-mono font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded text-[10px]">{empId.trim() || 'EMP-ID'}@2027</code> to activate.
                </span>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Sign In to Campus Portal</span>
                  <ChevronRight className="w-4 h-4 -ml-0.5 opacity-60" />
                </>
              )}
            </button>
          </form>

          <datalist id="campus-employee-ids">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <option key={emp.id} value={emp.emp_id}>
                  {emp.full_name} — {emp.department} ({emp.is_activated ? 'Activated: 1' : 'Not Activated: 0'})
                </option>
              ))
            ) : (
              <>
                <option value="EMP-1001">Akish Kumar — IT Dept (Master Admin)</option>
                <option value="EMP-1002">Dr. Meera Nair — Science Dept (Quick PIN: 100299)</option>
                <option value="EMP-1003">Prof. Rajesh Sharma — Mathematics Dept (Unactivated: 0)</option>
                <option value="EMP-1005">Prof. Anita Desai — Social Science Dept (Admin)</option>
                <option value="EMP-1007">Coach Vikram Rathore — PE Dept (First Login: EMP-1007@2027)</option>
              </>
            )}
          </datalist>
        </div>

        {/* ─── Demo Accounts Section ─── */}
        <div className="bg-slate-50 border-t border-slate-200/80 px-7 py-4 space-y-2.5">
          <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
            Quick Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => {
              const colors = getAccountColors(account.color);
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={account.onClick}
                  className={`${colors.bg} ${colors.hoverBg} border ${colors.border} py-2 px-3 rounded-xl text-left cursor-pointer transition-all hover:shadow-sm group`}
                  title={`Sign in as ${account.label}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
                    <span className={`font-mono font-bold text-[11px] ${colors.text}`}>
                      {account.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5 pl-3.5">
                    <span className="text-[10.5px] font-medium text-slate-500 truncate">
                      {account.label}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
