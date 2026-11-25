import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_DEPARTMENTS, DepartmentConfig, shortenTag } from '../types';
import {
  X,
  Tag,
  GraduationCap,
  Layers,
  Sparkles,
  FilePlus,
  FileEdit,
  UploadCloud,
  Link2,
  Lock,
  LogIn,
  Pin,
} from 'lucide-react';
import { ProtectedShieldLockIcon, PublicGlobeCheckIcon } from './RepositoryCard';
import { apiFetch } from '../utils/apiFetch';
import { validateProtectionPin } from '../utils/pinValidation';

interface UploadWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  isLoggedIn: boolean;
  isSuperuser?: boolean;
  currentUser?: string;
  userDepartment?: string;
  onLogin: () => void;
}

export const UploadWizardModal: React.FC<UploadWizardModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  isLoggedIn = false,
  currentUser = 'Dr. Meera Nair',
  userDepartment = 'Science',
  onLogin,
}) => {
  const normalizedUserDept =
    userDepartment && userDepartment.trim() && userDepartment.toLowerCase() !== 'others'
      ? userDepartment.trim().replace(/\s+Dept$/i, '')
      : 'Science';

  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<'note' | 'upload' | 'link'>('note');

  // Quick Note State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteProtection, setNoteProtection] = useState<'pin' | 'public'>('public');
  const [notePin, setNotePin] = useState('');

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProtection, setUploadProtection] = useState<'pin' | 'public'>('public');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);

  // Web Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkProtection, setLinkProtection] = useState<'pin' | 'public'>('public');
  const [linkPin, setLinkPin] = useState('');

  // Academic Tagging State (Subject/Dept required, Class & Section optional)
  // Neither Class nor Section is preselected by default
  const [subjectTag, setSubjectTag] = useState<string>(normalizedUserDept);
  const [gradeTag, setGradeTag] = useState<string>('');
  const [sectionTag, setSectionTag] = useState<string>('');
  const [allowedExtList, setAllowedExtList] = useState<string[]>([
    'CSV', 'DOC', 'DOCX', 'ENC', 'JPEG', 'JPG', 'MP3', 'MP4', 'PDF', 'PEM', 'PNG', 'PPTX', 'TXT', 'WAV', 'XLS', 'XLSX', 'ZIP'
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [magicByteInfo, setMagicByteInfo] = useState<{
    valid: boolean;
    hex: string;
    detail: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'PF', 'BF', 'AF'];
  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  useEffect(() => {
    if (isOpen) {
      setSubjectTag(normalizedUserDept);
      setGradeTag('');
      setSectionTag('');
      setNoteTitle('');
      setNoteContent('');
      setNotePin('');
      setSelectedFiles([]);
      setMagicByteInfo(null);
      setPinDigits(['', '', '', '', '', '']);
      setLinkUrl('');
      setLinkTitle('');
      setLinkDesc('');
      setLinkPin('');
      setStatusMessage(null);
    }
  }, [isOpen, normalizedUserDept]);

  useEffect(() => {
    if (!isOpen) return;
    apiFetch('/api/departments')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.departments)) {
          setDepartments(d.departments);
        }
      })
      .catch(() => {});
    apiFetch('/api/extensions')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.extensions)) {
          const activeExts = d.extensions
            .filter((e: any) => e.is_allowed)
            .map((e: any) => String(e.extension).toUpperCase())
            .sort();
          if (activeExts.length > 0) setAllowedExtList(activeExts);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Strictly 2 to 3 tags: Subject/Dept, Class (Grade), and Section
  const computedTags: string[] = [
    shortenTag(subjectTag || normalizedUserDept),
    ...(gradeTag ? [gradeTag] : []),
    ...(sectionTag ? [sectionTag] : []),
  ]
    .filter(Boolean)
    .slice(0, 3);

  const matchedDeptObj = departments.find(
    (d) => d.name.toLowerCase() === (subjectTag || normalizedUserDept).toLowerCase()
  );
  const deptShortcut = matchedDeptObj ? matchedDeptObj.shortcut : 's';
  const shortcutExample1 = [deptShortcut, gradeTag.toLowerCase() || '6', sectionTag.toLowerCase()]
    .filter(Boolean)
    .join(',');

  // Instant Client-Side 8-Byte Magic Signature Inspector
  const inspectSelectedFileMagicBytes = async (filesList: File[]) => {
    if (!filesList || filesList.length === 0) {
      setMagicByteInfo(null);
      return;
    }
    try {
      const file = filesList[0];
      const ext = (file.name.split('.').pop() || '').toUpperCase();
      const sliceBuf = await file.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(sliceBuf);
      const hexArr = Array.from(bytes).map((b) => b.toString(16).toUpperCase().padStart(2, '0'));
      const rawHex = hexArr.join('');
      const spacedHex = hexArr.join(' ') || 'EMPTY';

      if (rawHex.startsWith('4D5A') || rawHex.startsWith('7F454C46')) {
        setMagicByteInfo({
          valid: false,
          hex: spacedHex,
          detail: `Spoofed Executable Detected (${spacedHex}) — Will be rejected (HTTP 400)`,
        });
        return;
      }

      const expectedMap: Record<string, { prefixes: string[]; label: string }> = {
        JPG: { prefixes: ['FFD8FF'], label: 'JPEG (FF D8 FF)' },
        JPEG: { prefixes: ['FFD8FF'], label: 'JPEG (FF D8 FF)' },
        PNG: { prefixes: ['89504E47'], label: 'PNG (89 50 4E 47)' },
        PDF: { prefixes: ['25504446'], label: 'PDF (%PDF / 25 50 44 46)' },
        DOCX: { prefixes: ['504B0304', '504B0506', '504B0708'], label: 'DOCX/ZIP (50 4B 03 04)' },
        XLSX: { prefixes: ['504B0304', '504B0506', '504B0708'], label: 'XLSX/ZIP (50 4B 03 04)' },
        PPTX: { prefixes: ['504B0304', '504B0506', '504B0708'], label: 'PPTX/ZIP (50 4B 03 04)' },
        ZIP: { prefixes: ['504B0304', '504B0506', '504B0708'], label: 'ZIP (50 4B 03 04)' },
      };

      const rule = expectedMap[ext];
      if (rule) {
        const ok = rule.prefixes.some((p) => rawHex.startsWith(p));
        setMagicByteInfo({
          valid: ok,
          hex: spacedHex,
          detail: ok
            ? `Magic Bytes Verified: [${spacedHex.slice(0, 11)}] matches ${rule.label}`
            : `Signature Spoof Alert: .${ext} requires ${rule.label}, found [${spacedHex.slice(0, 11)}]`,
        });
      } else {
        setMagicByteInfo({
          valid: true,
          hex: spacedHex,
          detail: `Magic Bytes Inspected: [${spacedHex.slice(0, 11)}] (.${ext || 'FILE'})`,
        });
      }
    } catch {
      setMagicByteInfo(null);
    }
  };

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
      const next = [...selectedFiles, ...filesArray];
      setSelectedFiles(next);
      inspectSelectedFileMagicBytes(next);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files);
      const next = [...selectedFiles, ...filesArray];
      setSelectedFiles(next);
      inspectSelectedFileMagicBytes(next);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
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

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleUrlChange = (val: string) => {
    setLinkUrl(val);
    if (!linkTitle && val.includes('.')) {
      try {
        const formatted = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
        const domain = new URL(formatted).hostname.replace(/^www\./, '').split('.')[0];
        if (domain) {
          setLinkTitle(domain.charAt(0).toUpperCase() + domain.slice(1));
        }
      } catch {}
    }
  };

  const containsRestrictedAdultContent = (text: string): boolean => {
    const lower = (text || '').toLowerCase();
    return /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|escort\s*service|adult\s*video|hardcore\s*sex)\b/i.test(
      lower
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!isLoggedIn) {
      setStatusMessage({
        type: 'error',
        text: 'Authentication Required: Please sign in with your campus account to publish study notes.',
      });
      if (onLogin) onLogin();
      return;
    }

    if (!subjectTag) {
      setStatusMessage({
        type: 'error',
        text: `Please select a Subject / Department tag before publishing.`,
      });
      return;
    }

    // Subject tag is required; Class and Section tags are optional
    if (!subjectTag && !normalizedUserDept) {
      setStatusMessage({
        type: 'error',
        text: `Please select a Subject / Department tag before publishing.`,
      });
      return;
    }

    const finalDept = subjectTag || normalizedUserDept;
    const finalTags = computedTags.slice(0, 3);

    setIsSubmitting(true);

    try {
      if (activeTab === 'note') {
        if (!noteTitle.trim() || !noteContent.trim()) {
          setStatusMessage({
            type: 'error',
            text: 'Please enter both a Note Title and Study Note Content.',
          });
          setIsSubmitting(false);
          return;
        }
        if (noteProtection === 'pin') {
          const pinCheck = validateProtectionPin(notePin);
          if (!pinCheck.valid) {
            setStatusMessage({
              type: 'error',
              text: pinCheck.error || 'Invalid PIN.',
            });
            setIsSubmitting(false);
            return;
          }
        }

        const res = await apiFetch('/api/notes/quick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: noteTitle.trim(),
            content: noteContent.trim(),
            department: finalDept,
            tags: finalTags,
            is_passwordless: noteProtection === 'public',
            pin: noteProtection === 'pin' ? notePin : '',
          }),
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage({ type: 'success', text: 'Study note pinned to board! Auto-purges in 48 hours.' });
          onUploadSuccess();
          setTimeout(() => onClose(), 500);
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Failed to pin study note.' });
        }
      } else if (activeTab === 'upload') {
        if (selectedFiles.length === 0) {
          setStatusMessage({ type: 'error', text: 'Please select or drag a file to upload first.' });
          setIsSubmitting(false);
          return;
        }

        const badFile = selectedFiles.find((f) => containsRestrictedAdultContent(f.name));
        if (badFile) {
          setStatusMessage({
            type: 'error',
            text: `Campus Student Safety Policy: File "${badFile.name}" contains restricted terms.`,
          });
          setIsSubmitting(false);
          return;
        }

        const fullPin = pinDigits.join('');
        if (uploadProtection === 'pin') {
          const pinCheck = validateProtectionPin(fullPin);
          if (!pinCheck.valid) {
            setStatusMessage({
              type: 'error',
              text: pinCheck.error || 'Invalid PIN.',
            });
            setIsSubmitting(false);
            return;
          }
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files', file));
        formData.append('is_passwordless', uploadProtection === 'public' ? 'true' : 'false');
        formData.append('pin', fullPin);
        formData.append('department', finalDept);
        formData.append('uploader_name', currentUser);
        formData.append('tags', JSON.stringify(finalTags));

        const res = await apiFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage({ type: 'success', text: 'Document published! Auto-purges in 48 hours.' });
          onUploadSuccess();
          setTimeout(() => onClose(), 500);
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Upload failed.' });
        }
      } else {
        if (!linkUrl.trim()) {
          setStatusMessage({ type: 'error', text: 'Please enter a valid website URL first.' });
          setIsSubmitting(false);
          return;
        }
        if (linkProtection === 'pin') {
          const pinCheck = validateProtectionPin(linkPin);
          if (!pinCheck.valid) {
            setStatusMessage({
              type: 'error',
              text: pinCheck.error || 'Invalid PIN.',
            });
            setIsSubmitting(false);
            return;
          }
        }

        const payload = {
          url: linkUrl.trim(),
          title: linkTitle.trim() || linkUrl.trim(),
          description: linkDesc.trim(),
          department: finalDept,
          tags: finalTags,
          is_passwordless: linkProtection === 'public',
          pin: linkProtection === 'pin' ? linkPin : '',
          uploader: currentUser,
        };

        const res = await apiFetch('/api/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setStatusMessage({ type: 'success', text: 'Web link pinned! Auto-purges in 48 hours.' });
          onUploadSuccess();
          setTimeout(() => onClose(), 500);
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Failed to pin link.' });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Server error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProtection =
    activeTab === 'note'
      ? noteProtection
      : activeTab === 'upload'
      ? uploadProtection
      : linkProtection;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-[540px] w-full px-4 sm:px-5 py-3.5 shadow-2xl border border-slate-200/90 relative text-slate-900 my-auto">
        {/* Top Accent Gradient Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 absolute top-0 left-0 right-0 rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-7.5 h-7.5 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FilePlus className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              Pin Study Note to Board
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              Publishing as <strong className="text-slate-800">{currentUser}</strong> • Allocated Dept:{' '}
              <span className="font-bold text-blue-700">{normalizedUserDept}</span>
            </p>
          </div>
        </div>

        {/* 3 Mode Tabs: Write Quick Note | Upload File | Share Web Link */}
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 mb-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('note');
              setStatusMessage(null);
            }}
            className={`py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'note'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Write Note</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setStatusMessage(null);
            }}
            className={`py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('link');
              setStatusMessage(null);
            }}
            className={`py-1 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Web Link</span>
          </button>
        </div>

        {!isLoggedIn ? (
          <div className="py-8 px-4 text-center space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl my-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6 text-blue-700" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Sign In Required to Pin Notes</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Guest visitors have instant read and download access. To pin study notes, upload documents, or share links, please sign in with a campus account (e.g. <strong>Meera</strong> or <strong>Akish</strong>).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogin) onLogin();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Campus Portal</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* STEP 1: CONTENT INPUT (QUICK NOTE, FILE UPLOAD, OR LINK) */}
            {activeTab === 'note' ? (
              <div className="bg-[#FFF066] p-2.5 rounded-xl border border-black/15 shadow-2xs space-y-1.5 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note Title (e.g. Thermodynamics Laws & Key Formulas)..."
                    className="w-full px-2.5 py-1 bg-white/92 border border-black/15 rounded-lg text-[11.5px] font-extrabold text-slate-950 placeholder:text-slate-500 placeholder:font-medium outline-none focus:ring-1 focus:ring-slate-900/20"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write key study points, formulas, definitions, or summary..."
                  className="w-full px-2.5 py-1.5 bg-white/92 border border-black/15 rounded-lg text-[11.5px] font-medium text-slate-950 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-slate-900/20 resize-none"
                />
              </div>
            ) : activeTab === 'upload' ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  dragActive
                    ? 'border-blue-600 bg-blue-50/60'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3 min-w-0">
                  <UploadCloud className="w-6.5 h-6.5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFiles.length > 0
                        ? selectedFiles.map((f) => f.name).join(', ')
                        : 'Click to select study files or drag & drop'}
                    </p>
                    <p
                      className={`text-[10.5px] truncate font-medium ${
                        magicByteInfo
                          ? magicByteInfo.valid
                            ? 'text-emerald-700 font-bold'
                            : 'text-rose-600 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {magicByteInfo
                        ? magicByteInfo.detail
                        : `Allowed Extensions (${allowedExtList.length}): ${allowedExtList.map((ext) => `.${ext}`).join(', ')}`}
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles([]);
                      setMagicByteInfo(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    Clear ({selectedFiles.length})
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold shrink-0">
                    Browse
                  </span>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="sm:col-span-5">
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Website URL *</label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.edu/notes"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Resource Title"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Note (Opt)</label>
                  <input
                    type="text"
                    value={linkDesc}
                    onChange={(e) => setLinkDesc(e.target.value)}
                    placeholder="Short note"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: ACADEMIC TAGS (SUBJECT/DEPT, CLASS, AND SECTION) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Academic Classification Tags (Subject/Dept, Class & Section)
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 tabular-nums">
                  {computedTags.length} Tags Active
                </span>
              </div>

              {/* 1. Subject / Department Tag */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Subject / Department Tag
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubjectTag(normalizedUserDept)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold border transition flex items-center justify-between cursor-pointer ${
                      subjectTag === normalizedUserDept
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>#{shortenTag(normalizedUserDept)}</span>
                    <span className="text-[10px] opacity-75">Dept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectTag('Others')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold border transition flex items-center justify-between cursor-pointer ${
                      subjectTag === 'Others'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>#Others</span>
                    <span className="text-[10px] opacity-75">General</span>
                  </button>
                </div>
              </div>

              {/* 2. Class / Grade Tag Selector (Optional) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Class / Grade</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </span>
                  {gradeTag && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9.5px] font-extrabold">
                      Class {gradeTag}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-15 gap-1">
                  {gradeOptions.map((g) => {
                    const active = gradeTag === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGradeTag(active ? '' : g)}
                        className={`h-7 rounded-lg text-[11px] font-extrabold border transition cursor-pointer flex items-center justify-center ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Section Tag Selector (Optional) */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-0.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Section</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    {sectionTag && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9.5px] font-extrabold">
                        Section {sectionTag} Selected
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    {sectionOptions.map((sec) => {
                      const active = sectionTag === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSectionTag(active ? '' : sec)}
                          className={`w-7 h-7 rounded-lg text-[11px] font-extrabold border transition cursor-pointer flex items-center justify-center ${
                            active
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs ring-2 ring-blue-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Tags:</span>
                    {computedTags.map((t, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-[10px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono shrink-0">
                    <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
                    <strong className="text-slate-900">{shortcutExample1}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: ACCESS LEVEL */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`border rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                    currentProtection === 'public'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    checked={currentProtection === 'public'}
                    onChange={() =>
                      activeTab === 'note'
                        ? setNoteProtection('public')
                        : activeTab === 'upload'
                        ? setUploadProtection('public')
                        : setLinkProtection('public')
                    }
                    className="text-emerald-600"
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-700">
                      <PublicGlobeCheckIcon className="w-3.5 h-3.5 shrink-0" />
                      Public Note
                    </span>
                    <span className="text-[10px] text-slate-500">Instant open</span>
                  </div>
                </label>

                <label
                  className={`border rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                    currentProtection === 'pin'
                      ? 'border-amber-400 bg-amber-50/60 text-amber-950 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    checked={currentProtection === 'pin'}
                    onChange={() =>
                      activeTab === 'note'
                        ? setNoteProtection('pin')
                        : activeTab === 'upload'
                        ? setUploadProtection('pin')
                        : setLinkProtection('pin')
                    }
                    className="text-amber-500 accent-amber-500"
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-amber-700">
                      <ProtectedShieldLockIcon className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      PIN Protected
                    </span>
                    <span className="text-[10px] text-slate-500">6-char PIN</span>
                  </div>
                </label>
              </div>

              {currentProtection === 'pin' && activeTab === 'upload' && (
                <div className="px-3 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border bg-amber-50/50 border-amber-200">
                  <div className="flex flex-col">
                    <label className="text-xs font-extrabold text-amber-900">
                      Set 6-Character Access PIN:
                    </label>
                    <span className="text-[10px] text-amber-700/80 font-medium">
                      Letters and numbers required (no series or login PINs)
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          pinInputRefs.current[idx] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        placeholder="•"
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className="w-8 h-8 text-center font-mono font-extrabold text-xs rounded-lg border-2 bg-white border-amber-300 focus:border-amber-500 text-slate-900 outline-none"
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentProtection === 'pin' && (activeTab === 'note' || activeTab === 'link') && (
                <div className="px-3 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border bg-amber-50/50 border-amber-200">
                  <div className="flex flex-col">
                    <label className="text-xs font-extrabold text-amber-900">
                      Set 6-Character Access PIN:
                    </label>
                    <span className="text-[10px] text-amber-700/80 font-medium">
                      Letters and numbers required (no series or login PINs)
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={activeTab === 'note' ? notePin : linkPin}
                    onChange={(e) =>
                      activeTab === 'note' ? setNotePin(e.target.value) : setLinkPin(e.target.value)
                    }
                    placeholder="••••••"
                    className="w-full sm:w-36 h-8 px-2.5 font-mono font-extrabold text-xs text-center tracking-widest rounded-lg border-2 bg-white border-amber-300 focus:border-amber-500 text-slate-900 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Pin className="w-4 h-4 shrink-0" />
                <span>
                  {isSubmitting
                    ? 'Publishing...'
                    : activeTab === 'note'
                    ? 'Pin Quick Note'
                    : activeTab === 'upload'
                    ? 'Publish Document'
                    : 'Pin Web Link'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
