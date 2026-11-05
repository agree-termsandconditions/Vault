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
  const [empId, setEmpId] = useState('');
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
              <label className="text-[12.5px] font-bold text-slate-700 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                Employee ID
              </label>
              <input
                type="text"
                required
                value={empId}
                onChange={(e) => {
                  setEmpId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Akish or test"
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
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
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
        </div>
      </div>
    </div>
  );
};
