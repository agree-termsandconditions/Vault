import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  BadgeCheck,
  Send,
  Clock,
  LockKeyhole,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Zap,
  LogOut,
} from 'lucide-react';

export interface PasswordResetModalProps {
  isOpen: boolean;
  initialMode?: 'request' | 'redeem_token' | 'first_login';
  initialEmpId?: string;
  firstLoginEmployee?: {
    emp_id: string;
    full_name: string;
    department: string;
    designation?: string;
    activation_token?: string;
  } | null;
  onClose: () => void;
  onBackToLogin?: () => void;
  onForceLogout?: () => void;
  onActivationLoginSuccess?: (userData: {
    username: string;
    fullName: string;
    role: string;
    department: string;
    isSuperuser: boolean;
    isAdmin: boolean;
    isMasterAdmin?: boolean;
  }) => void;
  onPasswordResetCompleted?: (empId: string) => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  initialMode = 'request',
  initialEmpId = 'EMP-1003',
  firstLoginEmployee = null,
  onClose,
  onBackToLogin,
  onForceLogout,
  onPasswordResetCompleted,
}) => {
  const [mode, setMode] = useState<'request' | 'redeem_token' | 'first_login' | 'relogin_required'>(
    initialMode
  );
  const [empId, setEmpId] = useState(initialEmpId);
  const [resetReason, setResetReason] = useState('Forgot account password / Locked out');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [quickPinInput, setQuickPinInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [resetStatusInfo, setResetStatusInfo] = useState<{
    status: string;
    hasActiveToken: boolean;
    expiresAt: string | null;
    activeTokenPreview?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setEmpId(firstLoginEmployee?.emp_id || initialEmpId || 'EMP-1003');
      setErrorMessage(null);
      setSuccessMessage(null);
      if (initialMode === 'first_login' && firstLoginEmployee) {
        setSuccessMessage(
          `First login detected for ${firstLoginEmployee.full_name} (${firstLoginEmployee.emp_id}). Please set your permanent Google-policy password and 6-character Quick Login PIN to activate your account.`
        );
      }
    }
  }, [isOpen, initialMode, initialEmpId, firstLoginEmployee]);

  // Live poll password reset request status when in request or redeem_token mode
  useEffect(() => {
    if (!isOpen || mode === 'first_login' || mode === 'relogin_required' || !empId.trim()) return;
    let active = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset-status/${encodeURIComponent(empId.trim())}`
        );
        const data = await res.json();
        if (active && res.ok && data.success) {
          setResetStatusInfo({
            status: data.reset_request_status || 'none',
            hasActiveToken: Boolean(data.has_active_token),
            expiresAt: data.token_expires_at || null,
            activeTokenPreview: data.request?.reset_token || undefined,
          });
        }
      } catch {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, mode, empId]);

  if (!isOpen) return null;

  // Live Google Password Policy Checks
  const passChecks = {
    minLength: newPasswordInput.length >= 8,
    hasUpper: /[A-Z]/.test(newPasswordInput),
    hasLower: /[a-z]/.test(newPasswordInput),
    hasNumber: /[0-9]/.test(newPasswordInput),
    hasSymbol: /[^A-Za-z0-9]/.test(newPasswordInput),
    notDefault:
      newPasswordInput.trim().toLowerCase() !== `${empId.trim().toLowerCase()}@2027`,
  };
  const isGooglePolicyMet =
    passChecks.minLength &&
    passChecks.hasUpper &&
    passChecks.hasLower &&
    passChecks.hasNumber &&
    passChecks.hasSymbol &&
    passChecks.notDefault;

  const isQuickPinValid = quickPinInput.trim().length === 6;

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = empId.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Employee ID to request a password reset.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: cleanId,
          reason: resetReason.trim() || 'Standard employee requested password reset',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          data.message ||
            'Password reset request sent to Master Admin! Once approved, redeem your temporary token in Step 2.'
        );
        setResetStatusInfo({
          status: data.request?.status || 'pending',
          hasActiveToken: data.request?.status === 'token_issued',
          expiresAt: data.request?.token_expires_at || null,
          activeTokenPreview: data.request?.reset_token || undefined,
        });
      } else {
        setErrorMessage(data.error || 'Unable to submit password reset request.');
      }
    } catch {
      setErrorMessage('Network error while submitting password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeemResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = empId.trim();
    const cleanToken = resetTokenInput.trim().toUpperCase();
    const cleanPass = newPasswordInput.trim();
    const cleanPin = quickPinInput.trim();

    if (!cleanId || !cleanToken || !cleanPass) {
      setErrorMessage('Employee ID, Temporary Reset Token, and New Password are required.');
      return;
    }
    if (!isGooglePolicyMet) {
      setErrorMessage(
        'Please ensure your new password meets all Google Password Policy requirements below.'
      );
      return;
    }
    if (cleanPin && cleanPin.length !== 6) {
      setErrorMessage('Quick Login PIN must be exactly 6 characters (or leave blank if already set).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/complete-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: cleanId,
          reset_token: cleanToken,
          new_password: cleanPass,
          quick_pin: cleanPin || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetTokenInput('');
        setNewPasswordInput('');
        setQuickPinInput('');
        // Force logout any current session and require re-login with the new password
        if (onForceLogout) onForceLogout();
        setSuccessMessage('Password changed successfully , please login/signin again to continue');
        setMode('relogin_required');
      } else {
        setErrorMessage(data.error || 'Invalid or expired Temporary Reset Token.');
      }
    } catch {
      setErrorMessage('Network error while verifying reset token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstLoginActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = empId.trim();
    const cleanPass = newPasswordInput.trim();
    const cleanPin = quickPinInput.trim();

    if (!isGooglePolicyMet) {
      setErrorMessage(
        'Your new regular password must satisfy all Google Password Policy rules.'
      );
      return;
    }
    if (!isQuickPinValid) {
      setErrorMessage(
        'Please set your 6-character Quick Login PIN/password (created on first login only).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/first-login-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: cleanId,
          new_password: cleanPass,
          quick_pin: cleanPin,
          activation_token: firstLoginEmployee?.activation_token,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNewPasswordInput('');
        setQuickPinInput('');
        // Do NOT auto-login; forcibly sign out and require login again to continue
        if (onForceLogout) onForceLogout();
        setSuccessMessage('Password changed successfully , please login/signin again to continue');
        setMode('relogin_required');
        return;
      }
      setErrorMessage(data.error || 'Failed to activate account.');
    } catch {
      setErrorMessage('Network error while activating employee account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoutAndReturnToSignIn = () => {
    if (onForceLogout) onForceLogout();
    if (onPasswordResetCompleted) {
      onPasswordResetCompleted(empId.trim());
    } else if (onBackToLogin) {
      onBackToLogin();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-xs z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && mode !== 'relogin_required') onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative text-slate-800 max-h-[94vh] overflow-y-auto">
        {mode !== 'relogin_required' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close password reset modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0e3ec7] border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
            {mode === 'relogin_required' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : mode === 'first_login' ? (
              <Sparkles className="w-5 h-5 text-[#0e3ec7]" />
            ) : (
              <KeyRound className="w-5 h-5 text-[#0e3ec7]" />
            )}
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {mode === 'relogin_required'
              ? 'Password Changed — Sign In Again'
              : mode === 'first_login'
              ? 'First-Login Account Activation'
              : mode === 'request'
              ? 'Request Password Reset'
              : 'Redeem Temporary Reset Token'}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500">
            {mode === 'relogin_required'
              ? 'Account Status Updated to Activated (1) • Mandatory Re-Authentication'
              : mode === 'first_login'
              ? 'Immediate Password Change (Google Policy) + 6-Char Quick Login PIN'
              : 'Master Admin Temporary Reset Token Authorization Flow'}
          </p>
        </div>

        {/* ================= MANDATORY RE-LOGIN CONFIRMATION SCREEN ================= */}
        {mode === 'relogin_required' && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3.5 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-emerald-950 leading-snug">
                Password changed successfully , please login/signin again to continue
              </p>
              <p className="text-xs text-emerald-800 font-medium">
                Employee ID <strong className="font-mono">{empId}</strong> is now activated (<span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono font-bold text-[10px]">1</span>). Please sign out and log in again with your new password or 6-character Quick PIN.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogoutAndReturnToSignIn}
              className="w-full h-10 bg-[#0e3ec7] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout / Sign Out & Login Again</span>
            </button>
          </div>
        )}

        {/* Mode Switcher for Reset Flow */}
        {mode !== 'first_login' && mode !== 'relogin_required' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('request');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                mode === 'request'
                  ? 'bg-white text-[#0e3ec7] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Request Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('redeem_token');
                setErrorMessage(null);
              }}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'redeem_token'
                  ? 'bg-white text-[#0e3ec7] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Enter Reset Token</span>
              {resetStatusInfo?.hasActiveToken && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Banners */}
        {mode !== 'relogin_required' && successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl text-xs font-bold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= 1. REQUEST PASSWORD RESET ================= */}
        {mode === 'request' && (
          <form onSubmit={handleRequestPasswordReset} className="space-y-3">
            <div>
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#0e3ec7]" />
                  <span>Your Employee ID</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Standard Employee</span>
              </label>
              <input
                type="text"
                required
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="e.g. EMP-1002 or EMP-1003"
                className="w-full h-10 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#0e3ec7] rounded-xl px-3.5 text-xs font-extrabold text-slate-900 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">
                Reason for Reset Request
              </label>
              <input
                type="text"
                required
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="e.g. Forgot password / Locked out"
                className="w-full h-10 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#0e3ec7] rounded-xl px-3.5 text-xs font-medium text-slate-800 outline-none transition"
              />
            </div>

            {/* Live Status Indicator */}
            {resetStatusInfo && resetStatusInfo.status !== 'none' && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  resetStatusInfo.hasActiveToken
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-extrabold">
                      {resetStatusInfo.hasActiveToken
                        ? 'Temporary Reset Token Issued!'
                        : 'Pending Master Admin Approval'}
                    </div>
                    <div className="text-[10px] opacity-85">
                      {resetStatusInfo.hasActiveToken
                        ? 'Master Admin approved your request. Click "Enter Token" to set your new password.'
                        : 'Awaiting Master Admin in Team & Role Permissions to generate your token.'}
                    </div>
                  </div>
                </div>
                {resetStatusInfo.hasActiveToken && (
                  <button
                    type="button"
                    onClick={() => {
                      if (resetStatusInfo.activeTokenPreview) {
                        setResetTokenInput(resetStatusInfo.activeTokenPreview);
                      }
                      setMode('redeem_token');
                    }}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-[10px] shrink-0 cursor-pointer"
                  >
                    Enter Token →
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {onBackToLogin && (
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="px-3.5 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 bg-[#0e3ec7] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Reset Request'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= 2. REDEEM RESET TOKEN OR 3. FIRST-LOGIN ACTIVATION ================= */}
        {(mode === 'redeem_token' || mode === 'first_login') && (
          <form
            onSubmit={mode === 'first_login' ? handleFirstLoginActivate : handleRedeemResetToken}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between mb-1">
                <span>Employee ID</span>
                {mode === 'first_login' && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold border border-amber-300">
                    Status: 0 (Not Activated) → 1
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                readOnly={mode === 'first_login'}
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full h-9 bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-mono font-extrabold text-slate-900 outline-none"
              />
            </div>

            {mode === 'redeem_token' && (
              <div>
                <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <LockKeyhole className="w-3.5 h-3.5 text-amber-600" />
                    <span>Temporary Reset Token *</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Issued by Master Admin</span>
                </label>
                <input
                  type="text"
                  required
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value.toUpperCase())}
                  placeholder="e.g. RST-8F4B2A"
                  className="w-full h-9 bg-amber-50/60 focus:bg-white border border-amber-300 focus:border-[#0e3ec7] rounded-xl px-3 text-xs font-mono font-extrabold text-slate-900 tracking-wider uppercase outline-none"
                />
              </div>
            )}

            {/* New Regular Password with Live Google Password Policy Checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0e3ec7]" />
                  <span>New Regular Password (Google Policy) *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput(`Campus#${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="text-[10px] font-extrabold text-[#0e3ec7] hover:underline cursor-pointer"
                >
                  Suggest Strong
                </button>
              </label>
              <input
                type="text"
                required
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Min 8 chars, A-Z, a-z, 0-9, symbol (!@#$)"
                className="w-full h-9 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#0e3ec7] rounded-xl px-3 text-xs font-mono text-slate-900 outline-none"
              />

              {/* Google Password Policy Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                <div className={passChecks.minLength ? 'text-emerald-700' : 'text-slate-400'}>
                  {passChecks.minLength ? '✓' : '○'} 8+ Characters
                </div>
                <div className={passChecks.hasUpper ? 'text-emerald-700' : 'text-slate-400'}>
                  {passChecks.hasUpper ? '✓' : '○'} Uppercase (A–Z)
                </div>
                <div className={passChecks.hasLower ? 'text-emerald-700' : 'text-slate-400'}>
                  {passChecks.hasLower ? '✓' : '○'} Lowercase (a–z)
                </div>
                <div className={passChecks.hasNumber ? 'text-emerald-700' : 'text-slate-400'}>
                  {passChecks.hasNumber ? '✓' : '○'} Number (0–9)
                </div>
                <div className={`col-span-2 ${passChecks.hasSymbol ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {passChecks.hasSymbol ? '✓' : '○'} Symbol (!@#$%^&*) & not default {empId}@2027
                </div>
              </div>
            </div>

            {/* 6-Character Quick Login PIN/Password (Created on First Login) */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    6-Char Quick Login PIN/Password {mode === 'first_login' ? '*' : '(First Login)'}
                  </span>
                </label>
                <span className="text-[10px] font-mono font-bold text-blue-700">
                  {quickPinInput.trim().length}/6 chars
                </span>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">
                Created on first login only. Once activated, you can sign in using <strong>either</strong> your regular password <strong>or</strong> this 6-character Quick PIN.
              </p>
              <input
                type="text"
                required={mode === 'first_login'}
                maxLength={6}
                value={quickPinInput}
                onChange={(e) => setQuickPinInput(e.target.value.slice(0, 6))}
                placeholder="Enter 6-char Quick PIN (e.g. 789456)"
                className="w-full h-9 bg-white border border-blue-300 focus:border-[#0e3ec7] rounded-xl px-3 text-xs font-mono font-extrabold tracking-widest text-slate-900 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onBackToLogin && (
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="px-3.5 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Updating Password...'
                    : mode === 'first_login'
                    ? 'Save New Password & Activate Account'
                    : 'Verify Token & Update Password'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
