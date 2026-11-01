import React, { useState } from 'react';
import { DepartmentConfig, shortenTag } from '../types';
import {
  X,
  BookOpen,
  Search,
  Tag,
  Clock,
  Lock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Command,
  FileText,
  KeyRound,
  Layers,
  ChevronRight,
  FileCheck2,
  AlertCircle,
  Building,
  AlertTriangle,
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentConfig[];
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'shortcuts' | 'security' | 'terms'>('workflow');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-3xl shadow-2xl relative text-slate-800 overflow-hidden flex flex-col h-[640px] max-h-[92vh]">
        {/* Accent top gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer z-10"
          aria-label="Close guide"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Help & User Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-bold">
                  Campus Study Vault
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick reference for faculty, students, and administrators
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Evenly distributed grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'workflow'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">How It Works</span>
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'shortcuts'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Smart Search & Shortcuts</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Security & Policies</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`w-full py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'terms'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Terms & Guidelines</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 min-h-0 text-slate-700 text-xs">
          {/* TAB 1: WORKFLOW */}
          {activeTab === 'workflow' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Upload & Pin Notes</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click <strong>Pin New Note</strong> on the repository board. Upload study files (PDF, DOCX, XLSX, PPTX, images) or share an educational website link.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">PDF</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">DOCX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">XLSX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">PPTX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">Images</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">Web Links</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Structured Academic Tagging</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Notes are tagged with up to 3 structured identifiers so students can instantly locate resources:
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span><strong>Department:</strong> Faculty subject dept (e.g. <code>#Science</code>)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span><strong>Grade (Required):</strong> Class level (1–12, PF, BF, AF)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                      <span><strong>Section (Optional):</strong> Class division (A–G)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 & 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Access Control: PIN vs Public</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
                      <span className="w-[68px] h-5 bg-red-600 text-white font-extrabold text-[9px] rounded-full inline-flex items-center justify-center shrink-0 gap-1 mt-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Protected
                      </span>
                      <span className="text-[10.5px]">Requires the 6-character PIN set by the teacher to decrypt or download.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/80">
                      <span className="w-[68px] h-5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-full inline-flex items-center justify-center shrink-0 gap-1 mt-0.5">
                        <Globe className="w-2.5 h-2.5" />
                        Public
                      </span>
                      <span className="text-[10.5px]">Open to everyone on campus immediately without requiring any password.</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      4
                    </div>
                    <span className="font-bold text-slate-900 text-xs">48-Hour Ephemeral Lifecycle</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    To maintain storage hygiene and prevent stale materials, all notes feature an active TTL timer and are <strong>automatically purged after 48 hours</strong>.
                  </p>
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Always keep local copies of notes you want to preserve.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900 text-xs">Instant Filter Syntax</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Type combinations of department shortcuts, grade numbers, and section letters separated by commas or spaces:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <code className="text-blue-700 font-bold text-xs font-mono">s,6,a &nbsp;or&nbsp; s 6 a</code>
                    <p className="text-[10.5px] text-slate-500 mt-1">Filters for Science department, Grade 6, Section A.</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <code className="text-blue-700 font-bold text-xs font-mono">6,a &nbsp;or&nbsp; 6,A</code>
                    <p className="text-[10.5px] text-slate-500 mt-1">Filters across all subjects for Grade 6 Section A.</p>
                  </div>
                </div>
              </div>

              {/* Department Shortcut Codes Reference Table */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span>Department Shortcut Reference</span>
                  <span className="text-[10.5px] font-normal text-slate-500">Case-insensitive</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate mr-1.5">
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1 rounded">
                          #{shortenTag(d.name)}
                        </span>
                      </div>
                      <code className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-[10px] shrink-0">
                        {d.shortcut}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Command className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800">Quick Search Shortcut</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 rounded border border-slate-300 bg-white font-mono text-[11px] font-bold text-slate-700 shadow-2xs">
                    /
                  </kbd>
                  <span className="text-slate-400">or</span>
                  <kbd className="px-2 py-0.5 rounded border border-slate-300 bg-white font-mono text-[11px] font-bold text-slate-700 shadow-2xs">
                    Ctrl + K
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & POLICIES */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Magic Signature Verification & Anti-Tamper Security</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every uploaded file is inspected at byte level to confirm its authentic file format before it is accepted. Disguised executable files or unauthorized scripts are automatically rejected by the server pipeline.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    AES-256-CBC Encryption
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Protected study materials are encrypted at rest. Without the teacher’s PIN, files cannot be decrypted or opened.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    15-Min Auto Session Timeout
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    To protect shared classroom displays and terminals, faculty sessions automatically log out after 15 minutes. A live countdown timer is shown near the logout button.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Tamper-Evident Audit Trail
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    All upload, decryption, failed PIN attempts, and file purges are recorded in the security audit log for faculty accountability.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                  <strong>Student Safety Guardrails:</strong> The Foxxy academic assistant and search bar are reinforced with content safety filters to maintain a clean educational environment.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TERMS OF SERVICE & CAMPUS POLICIES */}
          {activeTab === 'terms' && (
            <div className="space-y-3.5">
              {/* Important Notice Banner */}
              <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50 flex items-start gap-3">
                <Building className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-blue-950 text-xs">Campus Intranet Usage Agreement</span>
                  <p className="text-[11px] text-blue-900/90 leading-relaxed font-medium">
                    This repository is dedicated to campus academic collaboration. By uploading, downloading, or accessing materials, you acknowledge and agree to institutional standards.
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
                  Every pinned note operates on an automated <strong>48-hour Time-to-Live (TTL)</strong> lifecycle. When the timer expires, the file and its associated records are permanently deleted to maintain optimal server storage.
                </p>
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                    <strong>Advisory:</strong> Vault is an ephemeral distribution system, not a permanent archive. Teachers and students are advised to maintain primary local backups of all important files.
                  </p>
                </div>
              </div>

              {/* Section 3: Access Levels & Cryptographic Protection */}
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

              {/* Section 4: Audit Accountability & Terminal Security */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>4. Audit Accountability & Terminal Session Security</span>
                </div>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  All upload, decryption, failed PIN attempts, and file purges are recorded in the security audit log for faculty accountability. Terminal sessions enforce strict 15-minute inactivity timeouts with automatic screen blur protection.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Study Vault v2.5</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0e3ec7] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
