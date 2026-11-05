import React, { useState, useRef } from 'react';
import { UploadCloud, Folder, LockKeyhole, Zap, CheckCircle2, AlertCircle, X, FileText, UserCheck, Shield } from 'lucide-react';

interface SecureUploadCardProps {
  onUploadSuccess: () => void;
  isLoggedIn: boolean;
  isSuperuser?: boolean;
  currentUser?: string;
  onLogin: () => void;
}

export const SecureUploadCard: React.FC<SecureUploadCardProps> = ({
  onUploadSuccess,
  isLoggedIn,
  isSuperuser = true,
  currentUser = 'Akish Kumar',
  onLogin,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'pin' | 'passwordless'>('pin');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle 6-char PIN entry with auto-advancing focus
  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handles pasting full PIN
      const chars = value.slice(0, 6).split('');
      const newDigits = [...pinDigits];
      chars.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setPinDigits(newDigits);
      const nextIndex = Math.min(chars.length, 5);
      pinInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);

    // Auto advance focus
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select or drag at least one file to upload.' });
      return;
    }

    const fullPin = pinDigits.join('');
    if (uploadMode === 'pin') {
      if (fullPin.length !== 6) {
        setStatusMessage({ type: 'error', text: 'Protection PIN must be exactly 6 characters.' });
        return;
      }
      if (!/[a-zA-Z]/.test(fullPin) || !/[0-9]/.test(fullPin)) {
        setStatusMessage({
          type: 'error',
          text: 'Protection PIN must contain at least 1 letter and 1 number (e.g. 12569c or aserc2).'
        });
        return;
      }
    }

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));
      formData.append('is_passwordless', uploadMode === 'passwordless' ? 'true' : 'false');
      formData.append('pin', fullPin);
      formData.append('department', 'IT Dept');
      formData.append('uploader_name', currentUser);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Files uploaded and encrypted successfully.' });
        setSelectedFiles([]);
        setPinDigits(['', '', '', '', '', '']);
        onUploadSuccess();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Upload failed.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Server connection error.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="w-full h-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Secure Upload
        </h2>
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
          <UploadCloud className="w-5 h-5" />
        </div>
      </div>

      {/* If User Not Logged In -> Show Sign In Lock Message */}
      {!isLoggedIn ? (
        <div className="border border-slate-200 bg-slate-50 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 my-auto">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
            <LockKeyhole className="w-7 h-7 text-blue-600 animate-icon-shake" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Authentication Required</h3>
            <p className="text-xs font-medium text-slate-600 max-w-xs">
              Please sign in to upload, encrypt, or share vault files securely.
            </p>
          </div>
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2 mt-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In to Upload / Share Files</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 flex-1">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative shrink-0 min-h-[140px] ${
              dragActive
                ? 'border-blue-500 bg-blue-50/70'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Glowing Folder Icon */}
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
              <Folder className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Drag & Drop files here, or{' '}
                <span className="text-blue-600 underline underline-offset-4 font-bold hover:text-blue-700">
                  click to browse
                </span>
              </p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1 tracking-wide uppercase">
                Allowed: PDF, JPG, PNG, MP4, MP3, DOC, DOCX, XLS, XLSX, TXT, CSV, WAV, PPTX
              </p>
            </div>
          </div>

          {/* Selected Files Queue */}
          {selectedFiles.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 shrink-0">
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Selected Files Queue ({selectedFiles.length})
              </p>
              <div className="grid grid-cols-1 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                {selectedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate">{f.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({(f.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Superuser Mode & PIN Box Combined Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 shrink-0">
            {/* Superuser Mode Options */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Superuser Upload Mode</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="upload_type"
                    checked={uploadMode === 'pin'}
                    onChange={() => setUploadMode('pin')}
                    className="accent-blue-600 w-3.5 h-3.5"
                  />
                  <div className="flex items-center gap-1.5">
                    <LockKeyhole className="w-3.5 h-3.5 text-blue-600" />
                    <span>6-Char PIN Protection</span>
                  </div>
                </label>

                {isSuperuser && (
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-blue-700">
                    <input
                      type="radio"
                      name="upload_type"
                      checked={uploadMode === 'passwordless'}
                      onChange={() => setUploadMode('passwordless')}
                      className="accent-blue-600 w-3.5 h-3.5"
                    />
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Passwordless Public Access</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* 6-Character PIN Input Box */}
            {uploadMode === 'pin' && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                  <div className="flex items-center gap-1.5">
                    <LockKeyhole className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>6-Character Protection PIN</span>
                  </div>
                  <span className="text-[10px] lowercase text-slate-400 font-normal">
                    1 letter & 1 number min
                  </span>
                </div>

                <div className="grid grid-cols-6 gap-2 pt-1">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (pinInputRefs.current[idx] = el)}
                      type="password"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      placeholder="•"
                      className="w-full h-10 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 font-mono font-bold text-base text-center rounded-lg focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 ${
                statusMessage.type === 'success'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            onClick={handleUploadSubmit}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 mt-auto"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            <span>{isUploading ? 'Encrypting & Processing...' : 'Save & Process Upload'}</span>
          </button>
        </div>
      )}
    </section>
  );
};
