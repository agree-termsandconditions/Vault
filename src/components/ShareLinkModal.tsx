import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Globe,
  Lock,
  Zap,
  Tag,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLoggedIn: boolean;
  currentUser: string;
  onLogin?: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isLoggedIn,
  currentUser,
  onLogin
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('IT Dept');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Internal']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isPasswordless, setIsPasswordless] = useState(true);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const departments = ['IT Dept', 'ENG Dept', 'FIN Dept', 'HR Dept', 'OPS Dept', 'ALL Dept'];
  const suggestedTags = ['Internal', 'Documentation', 'Project', 'Tools', 'Reference', 'Confidential', 'Security'];

  // Detect domain automatically as user types
  const getDetectedDomain = (inputUrl: string): string => {
    if (!inputUrl) return '';
    try {
      const formatted = inputUrl.startsWith('http://') || inputUrl.startsWith('https://')
        ? inputUrl
        : `https://${inputUrl}`;
      const parsed = new URL(formatted);
      return parsed.hostname;
    } catch {
      return '';
    }
  };

  const detectedDomain = getDetectedDomain(url);

  // Auto-fill title with friendly domain name if title is empty
  const handleUrlChange = (val: string) => {
    setUrl(val);
    const domain = getDetectedDomain(val);
    if (domain && !title) {
      // capitalize domain name nicely
      const cleanName = domain.replace(/^www\./, '').split('.')[0];
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      setTitle(capitalized);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const clean = customTagInput.trim().replace(/^#/, '');
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl) {
      setErrorMessage('Please enter a website URL.');
      return;
    }

    if (!trimmedTitle) {
      setErrorMessage('Please provide a name/title for this link.');
      return;
    }

    if (
      /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|escort\s*service|adult\s*video)\b/i.test(
        `${trimmedUrl} ${trimmedTitle} ${description} ${selectedTags.join(' ')}`
      )
    ) {
      setErrorMessage(
        'Campus Student Safety Policy: Pornographic, adult, or explicit content and links are strictly prohibited.'
      );
      return;
    }

    if (!isPasswordless) {
      if (!pin || pin.trim().length !== 6) {
        setErrorMessage('Protection PIN must be exactly 6 characters.');
        return;
      }
      if (!/[a-zA-Z]/.test(pin) || !/[0-9]/.test(pin)) {
        setErrorMessage('Protection PIN must contain at least 1 letter and 1 number (e.g. 12569c or aserc2).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: trimmedUrl,
          title: trimmedTitle,
          description: description.trim(),
          department,
          tags: selectedTags,
          is_passwordless: isPasswordless,
          pin: isPasswordless ? '' : pin,
          uploader: currentUser || 'Akish Kumar',
          uploaderEmpId: 'EMP-1001'
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || 'Failed to pin web link.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while sharing link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Share Web Link</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Sticky Note
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Pin any website or documentation URL to the repository board
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Website URL <strong className="text-rose-500">*</strong></span>
              {detectedDomain && (
                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {detectedDomain}
                </span>
              )}
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="https://example.com/docs or intranet link..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          {/* Title & Department in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Link Title <strong className="text-rose-500">*</strong>
              </label>
              <input
                type="text"
                placeholder="e.g. Cloud Console, Figma Design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Summary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Brief note or summary of what this link contains..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Subject & Category Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom tag..."
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Protection Mode Toggle */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Security Access Level</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsPasswordless(true)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  isPasswordless
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Passwordless</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Instant click-to-visit access for all intranet colleagues
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPasswordless(false)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  !isPasswordless
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>PIN Protected</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Requires 6-character PIN to unlock and view the confidential URL
                </p>
              </button>
            </div>

            {/* PIN Input if Protected */}
            {!isPasswordless && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-amber-900 flex items-center justify-between">
                  <span>Set 6-Character Protection PIN (1 letter + 1 number)</span>
                  <span className="text-[10px] font-normal text-amber-700">AES-256</span>
                </label>
                <input
                  type="password"
                  placeholder="e.g. 12569c or aserc2"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={6}
                  required={!isPasswordless}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0e3ec7] hover:bg-[#3559e0] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Pinning...</span>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Pin Link to Board</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
