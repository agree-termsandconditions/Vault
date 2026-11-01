import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_DEPARTMENTS, DepartmentConfig, shortenTag } from '../types';
import { X, Tag, GraduationCap, Layers, Sparkles } from 'lucide-react';
import { ProtectedShieldLockIcon, PublicGlobeCheckIcon } from './RepositoryCard';

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
  currentUser = 'Dr. Meera Nair',
  userDepartment = 'Science',
}) => {
  // Normalize teacher's allocated department (2 options: their allocated Dept or 'Others')
  const normalizedUserDept =
    userDepartment && userDepartment.trim() && userDepartment.toLowerCase() !== 'others'
      ? userDepartment.trim().replace(/\s+Dept$/i, '')
      : 'Science';

  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');

  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProtection, setUploadProtection] = useState<'pin' | 'public'>('pin');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);

  // Web Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');
  const [linkProtection, setLinkProtection] = useState<'pin' | 'public'>('public');
  const [linkPin, setLinkPin] = useState('');

  // Academic Tagging State:
  // 1. Department Tag: Auto-selected to teacher's department; must select 1 of [normalizedUserDept, 'Others']
  // 2. Grade Tag: Unselected by default (''); must select 1 before uploading (1..12, PF, BF, AF)
  // 3. Section Tag: Unselected by default (''); optional (A..G, click again to deselect)
  const [subjectTag, setSubjectTag] = useState<string>(normalizedUserDept);
  const [gradeTag, setGradeTag] = useState<string>('');
  const [sectionTag, setSectionTag] = useState<string>('');

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
    fetch('/api/departments')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.departments)) {
          setDepartments(d.departments);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Handle ESC key
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

  // Compute the up-to-3 tags array with standardized shortened department tag
  const computedTags: string[] = [
    shortenTag(subjectTag || normalizedUserDept),
    ...(gradeTag ? [gradeTag] : []),
    ...(sectionTag ? [sectionTag] : []),
  ]
    .filter(Boolean)
    .slice(0, 3);

  // Compute shortcut hint for the selected tags
  const matchedDeptObj = departments.find(
    (d) => d.name.toLowerCase() === (subjectTag || normalizedUserDept).toLowerCase()
  );
  const deptShortcut = matchedDeptObj ? matchedDeptObj.shortcut : 's';
  const shortcutExample1 = [deptShortcut, gradeTag.toLowerCase() || '6', sectionTag.toLowerCase()]
    .filter(Boolean)
    .join(',');
  const shortcutExample2 = [gradeTag.toLowerCase() || '6', sectionTag.toLowerCase()]
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

      // Check for spoofed executable headers (MZ .exe or ELF binary)
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

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      inspectSelectedFileMagicBytes(next);
      return next;
    });
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

  // Student-safe anti-pornography & explicit content filter
  const containsRestrictedAdultContent = (text: string): boolean => {
    const lower = (text || '').toLowerCase();
    return /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|escort\s*service|adult\s*video|hardcore\s*sex)\b/i.test(
      lower
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (activeTab === 'upload' && selectedFiles.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select or drag a file to upload first.' });
      return;
    }

    if (activeTab === 'upload') {
      const badFile = selectedFiles.find((f) => containsRestrictedAdultContent(f.name));
      if (badFile) {
        setStatusMessage({
          type: 'error',
          text: `Campus Student Safety Policy: File "${badFile.name}" contains restricted adult/pornographic terms and cannot be uploaded.`,
        });
        return;
      }
    }

    if (activeTab === 'link') {
      if (!linkUrl.trim()) {
        setStatusMessage({ type: 'error', text: 'Please enter a valid website URL first.' });
        return;
      }
      if (
        containsRestrictedAdultContent(linkUrl) ||
        containsRestrictedAdultContent(linkTitle) ||
        containsRestrictedAdultContent(linkDesc)
      ) {
        setStatusMessage({
          type: 'error',
          text: 'Campus Student Safety Policy: Pornographic, adult, or explicit URLs and titles are strictly prohibited.',
        });
        return;
      }
    }

    if (!subjectTag) {
      setStatusMessage({
        type: 'error',
        text: `Please select either "${normalizedUserDept}" or "Others" as the department tag.`,
      });
      return;
    }

    if (!gradeTag) {
      setStatusMessage({
        type: 'error',
        text: 'Please select a Grade (1–12, PF, BF, or AF) before uploading.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalDept = subjectTag || normalizedUserDept;
      const finalTags = computedTags.slice(0, 3);

      if (activeTab === 'upload') {
        const fullPin = pinDigits.join('');
        if (uploadProtection === 'pin' && fullPin.length !== 6) {
          setStatusMessage({ type: 'error', text: 'Protection PIN must be exactly 6 characters.' });
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('files', file));
        formData.append('is_passwordless', uploadProtection === 'public' ? 'true' : 'false');
        formData.append('pin', fullPin);
        formData.append('department', finalDept);
        formData.append('uploader_name', currentUser);
        formData.append('tags', JSON.stringify(finalTags));

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const rawText = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            res.ok
              ? 'Received an unexpected server response. Please try again.'
              : `Upload request failed (HTTP ${res.status}). Please try again.`
          );
        }

        if (data.success) {
          setStatusMessage({ type: 'success', text: 'Note published! Auto-purges in 48 hours.' });
          onUploadSuccess();
          setTimeout(() => onClose(), 800);
        } else {
          setStatusMessage({ type: 'error', text: data.error || 'Upload failed.' });
        }
      } else {
        if (linkProtection === 'pin' && linkPin.length !== 6) {
          setStatusMessage({ type: 'error', text: 'Protection PIN must be exactly 6 characters.' });
          setIsSubmitting(false);
          return;
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

        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const rawText = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            res.ok
              ? 'Received an unexpected server response. Please try again.'
              : `Link pin request failed (HTTP ${res.status}). Please try again.`
          );
        }

        if (data.success) {
          setStatusMessage({ type: 'success', text: 'Web link pinned! Auto-purges in 48 hours.' });
          onUploadSuccess();
          setTimeout(() => onClose(), 800);
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

  const currentProtection = activeTab === 'upload' ? uploadProtection : linkProtection;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-xl w-full px-5 py-4 shadow-2xl border border-slate-200/90 relative text-slate-900 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 absolute top-0 left-0 right-0" />
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-3.5 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Compact Modal Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0e3ec7] text-white flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-[18px]">note_add</span>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
              Pin New Note
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight">
              Uploading as <strong className="text-slate-800">{currentUser}</strong> • Allocated Dept:{' '}
              <span className="font-bold text-blue-700">{normalizedUserDept}</span>
            </p>
          </div>
        </div>

        {/* Combined Tabs: Upload File vs Share Web Link */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 mb-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setStatusMessage(null);
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
            <span>Upload Document / File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('link');
              setStatusMessage(null);
            }}
            className={`flex-1 py-1 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">link</span>
            <span>Share Web Link</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* STEP 1: COMPACT FILE DROPZONE OR WEB LINK INPUTS */}
          {activeTab === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-3.5 py-2.5 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                dragActive
                  ? 'border-blue-600 bg-blue-50/60'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[24px] text-blue-600 shrink-0">
                  cloud_upload
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedFiles.length > 0
                      ? selectedFiles.map((f) => f.name).join(', ')
                      : 'Step 1: Click to select study files or drag & drop'}
                  </p>
                  <p
                    className={`text-[10px] truncate font-medium ${
                      magicByteInfo
                        ? magicByteInfo.valid
                          ? 'text-emerald-700 font-bold'
                          : 'text-rose-600 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {magicByteInfo
                      ? magicByteInfo.detail
                      : 'Supports DOCX, XLSX, PPTX, PDF, PNG, JPG, JPEG, TXT • Real-Time Magic Byte Check'}
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
                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  Clear ({selectedFiles.length})
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold shrink-0">
                  Browse
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Website URL *</label>
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
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Title *</label>
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
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Note (Opt)</label>
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

          {/* STEP 2: ACADEMIC CLASSIFICATION TAGS (COMPACT SINGLE-VIEW) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-extrabold text-slate-900">
                  Step 2: Academic Classification Tags (Max 3 Tags)
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {computedTags.length} / 3 Tags Active
              </span>
            </div>

            {/* 1. Department Tag: Must select 1 (either Allocated Dept or Others — no "(Auto)" suffix) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. Department Tag{' '}
                <span className="text-slate-400 font-normal">(Select 1: Department or Others)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSubjectTag(normalizedUserDept)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border transition flex items-center justify-between cursor-pointer ${
                    subjectTag === normalizedUserDept
                      ? 'bg-[#0e3ec7] text-white border-[#0e3ec7] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>#{shortenTag(normalizedUserDept)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      subjectTag === normalizedUserDept ? 'bg-white/20 text-white' : 'text-slate-400'
                    }`}
                  >
                    {subjectTag === normalizedUserDept ? 'Selected' : 'Select'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubjectTag('Others')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-extrabold border transition flex items-center justify-between cursor-pointer ${
                    subjectTag === 'Others'
                      ? 'bg-[#0e3ec7] text-white border-[#0e3ec7] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>#Others</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      subjectTag === 'Others' ? 'bg-white/20 text-white' : 'text-slate-400'
                    }`}
                  >
                    {subjectTag === 'Others' ? 'Selected' : 'Select'}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Grade Tag Selector (Unselected by default; 1-12 + PF, BF, AF) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Select Grade *</span>
                  {!gradeTag && (
                    <span className="text-[10px] font-semibold text-amber-600 ml-1">
                      (Required — select 1 grade)
                    </span>
                  )}
                </label>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-15 gap-1">
                {gradeOptions.map((g) => {
                  const active = gradeTag === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGradeTag(g);
                        if (statusMessage?.type === 'error') setStatusMessage(null);
                      }}
                      className={`h-7 rounded-lg text-[11px] font-extrabold border transition cursor-pointer flex items-center justify-center ${
                        active
                          ? 'bg-[#0e3ec7] text-white border-[#0e3ec7] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Section Tag Selector (Optional: A-G, unselected by default, no None button) */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-0.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    3. Select Section <span className="text-slate-400 font-normal">(Optional — click to toggle)</span>
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  {sectionOptions.map((sec) => {
                    const active = sectionTag === sec;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSectionTag(active ? '' : sec)}
                        className={`w-8 h-7 rounded-lg text-[11px] font-extrabold border transition cursor-pointer flex items-center justify-center ${
                          active
                            ? 'bg-[#0e3ec7] text-white border-[#0e3ec7] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Applied Tags & Shortcut Preview */}
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
                  <span>
                    <strong className="text-slate-900">{shortcutExample1}</strong> /{' '}
                    <strong className="text-slate-900">{shortcutExample2}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: ACCESS LEVEL & LARGE 6-CHAR PIN INPUT */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Step 3: Access Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`border rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                  currentProtection === 'pin'
                    ? 'border-amber-400 bg-amber-50/60 text-amber-950 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  checked={currentProtection === 'pin'}
                  onChange={() =>
                    activeTab === 'upload' ? setUploadProtection('pin') : setLinkProtection('pin')
                  }
                  className="text-amber-500 accent-amber-500"
                />
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-amber-600">
                    <ProtectedShieldLockIcon className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    Protected
                  </span>
                  <span className="text-[10px] text-slate-500">6-char PIN</span>
                </div>
              </label>

              <label
                className={`border rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                  currentProtection === 'public'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  checked={currentProtection === 'public'}
                  onChange={() =>
                    activeTab === 'upload' ? setUploadProtection('public') : setLinkProtection('public')
                  }
                  className="text-emerald-600"
                />
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600">
                    <PublicGlobeCheckIcon className="w-3.5 h-3.5 shrink-0" />
                    Public
                  </span>
                  <span className="text-[10px] text-slate-500">Instant open</span>
                </div>
              </label>
            </div>

            {activeTab === 'upload' && (
              <div
                className={`px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border transition-colors ${
                  uploadProtection === 'pin'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-100 border-slate-200 select-none'
                }`}
              >
                <label
                  className={`text-xs font-extrabold shrink-0 ${
                    uploadProtection === 'pin' ? 'text-amber-900' : 'text-slate-400'
                  }`}
                >
                  Set 6-Character Access PIN:
                </label>
                <div className="flex items-center justify-end gap-2">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (pinInputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      disabled={uploadProtection === 'public'}
                      readOnly={uploadProtection === 'public'}
                      tabIndex={uploadProtection === 'public' ? -1 : 0}
                      value={uploadProtection === 'public' ? '' : digit}
                      placeholder="•"
                      onChange={(e) => {
                        if (uploadProtection === 'pin') {
                          handlePinChange(idx, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (uploadProtection === 'pin') {
                          handlePinKeyDown(idx, e);
                        }
                      }}
                      className={`w-10 h-10 sm:w-11 sm:h-11 text-center font-mono font-extrabold text-base rounded-xl border-2 outline-none shadow-xs transition-colors ${
                        uploadProtection === 'pin'
                          ? 'bg-white border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/25 text-slate-900 placeholder:text-slate-300'
                          : 'bg-slate-200/90 border-slate-300 text-slate-400 placeholder:text-slate-400 cursor-not-allowed pointer-events-none'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'link' && (
              <div
                className={`px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border transition-colors ${
                  linkProtection === 'pin'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-100 border-slate-200 select-none'
                }`}
              >
                <label
                  className={`text-xs font-extrabold shrink-0 ${
                    linkProtection === 'pin' ? 'text-amber-900' : 'text-slate-400'
                  }`}
                >
                  Set 6-Character Access PIN:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  disabled={linkProtection === 'public'}
                  readOnly={linkProtection === 'public'}
                  tabIndex={linkProtection === 'public' ? -1 : 0}
                  value={linkProtection === 'public' ? '' : linkPin}
                  onChange={(e) => {
                    if (linkProtection === 'pin') {
                      setLinkPin(e.target.value);
                    }
                  }}
                  placeholder="6-CHAR PIN"
                  className={`w-full sm:w-72 h-11 px-4 font-mono font-extrabold text-base text-center tracking-[0.35em] rounded-xl border-2 outline-none shadow-xs transition-colors ${
                    linkProtection === 'pin'
                      ? 'bg-white border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/25 text-slate-900 placeholder:text-slate-400 placeholder:tracking-widest'
                      : 'bg-slate-200/90 border-slate-300 text-slate-400 placeholder:text-slate-400 placeholder:tracking-widest cursor-not-allowed pointer-events-none'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Compact Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-[#0e3ec7] hover:bg-blue-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[15px]">
                {activeTab === 'upload' ? 'cloud_upload' : 'push_pin'}
              </span>
              <span>
                {isSubmitting
                  ? 'Publishing...'
                  : activeTab === 'upload'
                  ? 'Publish Note'
                  : 'Pin Web Link'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
