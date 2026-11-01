import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileCheck2,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
} from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-2xl shadow-2xl relative text-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Accent top gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer z-10"
          aria-label="Close terms modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Campus Terms of Service & Policy
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acceptable use, ephemeral storage guidelines, and campus data security
              </p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 text-slate-700 text-xs">
          {/* Important Notice Banner */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 flex items-start gap-3">
            <Building className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-blue-950 text-xs">Campus Intranet Usage Agreement</span>
              <p className="text-[11px] text-blue-900/90 leading-relaxed font-medium">
                This repository is dedicated to campus academic collaboration. By uploading, downloading, or accessing materials, you acknowledge and agree to the following institutional standards.
              </p>
            </div>
          </div>

          {/* Section 1: Acceptable Use */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>1. Permitted Academic Materials & Upload Standards</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Vault is designed exclusively for educational materials: lecture notes, presentation slides, practice tests, lab worksheets, syllabi, and official campus reference links.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10.5px] font-bold text-rose-700 flex items-center gap-1 uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                Prohibited Content
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Do not upload personally identifiable student records, confidential financial data, private passwords, malware, or unauthorized software executables. All files must comply with campus academic integrity policies.
              </p>
            </div>
          </div>

          {/* Section 2: 48-Hour Ephemeral Retention */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>2. 48-Hour Automatic Purge & Backup Advisory</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Every pinned note operates on an automated <strong>48-hour Time-to-Live (TTL)</strong> lifecycle. When the timer expires, the file and its associated database records are permanently deleted to maintain optimal server storage.
            </p>
            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/90 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                <strong>Advisory:</strong> Vault is an ephemeral distribution system, not a permanent archive. Teachers and students are advised to maintain primary local backups of all important files.
              </p>
            </div>
          </div>

          {/* Section 3: Access Control & Encryption */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Lock className="w-4 h-4 text-indigo-600" />
              <span>3. Access Levels & Cryptographic Protection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-bold text-red-700 flex items-center gap-1 mb-1">
                  Protected Mode
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Files are encrypted at rest with AES-256. A 6-character PIN must be supplied by students to open or download the file.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-bold text-emerald-700 flex items-center gap-1 mb-1">
                  Public Mode
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Files marked as Public are instantly viewable by anyone connected to the campus network without credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Audit Accountability */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>4. Audit Logging & Institutional Accountability</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              To safeguard campus network integrity, cryptographic hashes, upload timestamps, failed PIN attempts, and administrative actions are logged in the immutable Security Audit Trail. The campus IT administration reserves the right to remove any file violating acceptable use policies.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus IT Governance Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
