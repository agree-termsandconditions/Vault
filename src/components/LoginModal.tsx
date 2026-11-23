import React, { useState, useEffect } from 'react';
import { PasswordResetModal } from './PasswordResetModal';
import { apiFetch } from '../utils/apiFetch';
import {
  X,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  KeyRound,
  BadgeCheck,
  CheckCircle2,
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
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPassReadOnly, setIsPassReadOnly] = useState(true);
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
    activation_token?: string;
  } | null>(null);

  useEffect(() => {
    setEmpId('');
    setPassword('');
    setShowPassword(false);
    setIsPassReadOnly(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (isOpen) {
      setShowResetModal(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setEmpId('');
    setPassword('');
    setShowPassword(false);
    setIsPassReadOnly(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

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
            'Password changed successfully! Please sign in with your new password to continue.'
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
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: cleanId,
          password: passToUse.trim(),
        }),
      });

      const data = await res.json();

      // Check if this is a first-login unactivated employee
      if (res.ok && data.success && data.requireFirstLoginChange && data.employee) {
        if (onLogout) onLogout();
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
        setEmpId('');
        setPassword('');
        setShowPassword(false);
        setErrorMessage(null);
        setSuccessMessage(null);
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
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl relative text-slate-800 overflow-hidden">

        {/* ─── Gradient accent bar ─── */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />

        {/* ─── Close Button ─── */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 w-7 h-7 rounded-full hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center z-10"
          aria-label="Close login modal"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="px-5 pt-5 pb-4 space-y-3.5">

          {/* ─── Header ─── */}
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Campus Login Portal
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Campus Study Notes & Resources
              </p>
            </div>
          </div>

          {/* ─── Success Banner ─── */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* ─── Error Banner ─── */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* ─── Login Form ─── */}
          <form
            onSubmit={handleUnifiedLogin}
            className="space-y-3"
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            data-1p-ignore="true"
          >
            {/* Employee ID */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-600" />
                Employee ID
              </label>
              <input
                type="text"
                name="campus_member_id"
                id="campus_member_id"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
                required
                value={empId}
                onChange={(e) => {
                  setEmpId(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. JHS1234 or JHSXXXX"
                className="w-full h-9 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-lg px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
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
                  className="text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="campus_security_token"
                  id="campus_security_token"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                  readOnly={isPassReadOnly}
                  onFocus={() => setIsPassReadOnly(false)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter password or 6-char Quick PIN"
                  className="w-full h-9 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-lg pl-3 pr-9 text-xs font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans placeholder:font-normal outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sign In to Campus Portal</span>
                  <ChevronRight className="w-3.5 h-3.5 -ml-0.5 opacity-60" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
