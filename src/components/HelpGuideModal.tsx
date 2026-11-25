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
  Mail,
  Copy,
  Check,
  MessageSquare,
  Lightbulb,
  Bug,
  HeartHandshake
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
  const [activeTab, setActiveTab] = useState<'workflow' | 'shortcuts' | 'security' | 'contact' | 'terms'>('workflow');
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('akish1928@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-3xl shadow-2xl relative text-slate-800 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        {/* Accent top gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 shrink-0" />

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
                Simple, quick guide for students, faculty, and campus members
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Evenly distributed grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 mt-4">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`w-full py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
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
              className={`w-full py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'shortcuts'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Search & Shortcuts</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Security & PINs</span>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`w-full py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'contact'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Contact Developer</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`w-full py-2 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                activeTab === 'terms'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Guidelines</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1 min-h-0 text-slate-700 text-xs">
          {/* TAB 1: HOW IT WORKS */}
          {activeTab === 'workflow' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Pin Study Notes & Links</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click <strong>Pin New Note</strong> on the board. You can upload study documents (PDFs, PPT slides, worksheets, images) or share educational website links.
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">PDF</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">DOCX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">XLSX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">PPTX</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-semibold text-slate-700">Images</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Read & Open Directly</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Click on any card to view it. <strong>Public notes</strong> open instantly in your browser. <strong>Protected notes</strong> prompt you for a simple 6-character PIN before opening.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Public: Instant</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">Protected: 6-char PIN</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      3
                    </div>
                    <span className="font-bold text-slate-900 text-xs">48-Hour Fresh Board</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    To keep the board clean, each note has a 48-hour countdown. Old notes automatically retire so only current, active materials stay visible.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-cleans after 48 hours</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      4
                    </div>
                    <span className="font-bold text-slate-900 text-xs">Deleting Notes</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Need to remove a note? Click the 3 dots on the card and choose <strong>Delete</strong>. Enter the uploader's password or PIN to remove it immediately from public view.
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Protected with uploader verification</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SEARCH & SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-900 text-xs">Super-Fast Department Filter Shortcut</span>
                </div>
                <p className="text-[11.5px] text-blue-800 leading-relaxed">
                  Type 3 letters in the search bar: <strong>department, grade, section</strong> separated by commas to find study notes in 1 second!
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-blue-200 text-slate-800">
                    <span className="text-blue-600 font-bold">s,6,a</span> → Science, Grade 6, Section A
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-200 text-slate-800">
                    <span className="text-blue-600 font-bold">m,10,b</span> → Math, Grade 10, Section B
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-200 text-slate-800">
                    <span className="text-blue-600 font-bold">ss,8,a</span> → Social Science, Grade 8, Section A
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-200 text-slate-800">
                    <span className="text-blue-600 font-bold">k,6,b</span> → Kannada, Grade 6, Section B
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Table */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">Keyboard Shortcuts</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">Focus search bar</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 text-[10px]">
                      /
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-600">Close modal / Cancel</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 text-[10px]">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PINS */}
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-950 text-xs">Campus Grade Encryption</span>
                </div>
                <p className="text-[11.5px] text-emerald-900 leading-relaxed">
                  Every note uploaded to Vault is encrypted with institutional-grade <strong>AES-256 encryption</strong>. Your study materials and worksheets remain completely secure from unauthorized modification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Public Notes</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Designed for shared homework, syllabus outlines, and common reference sheets. Any campus member can view and download instantly.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span>PIN-Protected Notes</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Designed for question papers, internal marks, and private section materials. Requires an exact 6-character protection PIN to open.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT DEVELOPER (NEW!) */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Inviting Hero Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/60 to-purple-50 border border-blue-200/80 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      We'd Love to Hear From You!
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Reach out directly to help shape the future of Campus Study Vault.
                    </p>
                  </div>
                </div>

                <p className="text-[11.5px] text-slate-700 leading-relaxed">
                  Whether you have an idea for a new feature, a cleaner design suggestion, found a bug, or just want to share feedback or complaints — your thoughts are genuinely appreciated!
                </p>

                {/* Categories of feedback welcomed */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/90 border border-blue-200/80 rounded-xl p-2 text-center shadow-2xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <span className="font-bold text-slate-800 block">Design Ideas</span>
                    <span className="text-[9.5px] text-slate-500">UI & layout thoughts</span>
                  </div>
                  <div className="bg-white/90 border border-blue-200/80 rounded-xl p-2 text-center shadow-2xs">
                    <Sparkles className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <span className="font-bold text-slate-800 block">New Features</span>
                    <span className="text-[9.5px] text-slate-500">What should we add?</span>
                  </div>
                  <div className="bg-white/90 border border-blue-200/80 rounded-xl p-2 text-center shadow-2xs">
                    <Bug className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                    <span className="font-bold text-slate-800 block">Bug Reports</span>
                    <span className="text-[9.5px] text-slate-500">Something not working?</span>
                  </div>
                  <div className="bg-white/90 border border-blue-200/80 rounded-xl p-2 text-center shadow-2xs">
                    <MessageSquare className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <span className="font-bold text-slate-800 block">Complaints</span>
                    <span className="text-[9.5px] text-slate-500">Any issues or friction</span>
                  </div>
                </div>
              </div>

              {/* Developer Direct Contact Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Lead Developer & Architect
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      Akish
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Notes Space Project Lead
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Quick Response Guaranteed</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-medium">Direct Email Address</div>
                      <a
                        href="mailto:akish1928@gmail.com?subject=Campus%20Study%20Vault%20Feedback"
                        className="font-mono text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline truncate block"
                      >
                        akish1928@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>

                    <a
                      href="mailto:akish1928@gmail.com?subject=Campus%20Study%20Vault%20-%20Suggestions%20%26%20Feedback"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Email</span>
                    </a>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-500 leading-relaxed italic">
                  💡 Tip: You can also tap the Foxxy AI Study Helper in the bottom-right corner anytime for instant campus assistance!
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: TERMS & GUIDELINES */}
          {activeTab === 'terms' && (
            <div className="space-y-3.5 text-[11.5px] text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-900 text-xs block">Student Safety & Academic Integrity</span>
                <p>
                  1. <strong>Academic Use Only:</strong> Vault is strictly for learning materials, notes, worksheets, syllabus documents, and class study links.
                </p>
                <p>
                  2. <strong>Zero Tolerance for Explicit Content:</strong> Any adult, obscene, defamatory, or harmful content is automatically blocked and reported in the security audit log.
                </p>
                <p>
                  3. <strong>Respect Campus Privacy:</strong> Do not upload private personal data or confidential passwords.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[10.5px] text-slate-500">
            Campus Study Vault • Designed & Built by Akish
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
