import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  VaultFile,
  DEFAULT_DEPARTMENTS,
  DepartmentConfig,
  shortenTag,
  fixMojibake,
  SiteTheme,
} from '../types';
import {
  ColorTheme,
  getFileColorTheme,
  filterVaultFiles,
  extractTagFacets,
  calculateHoursLeft,
  isRestrictedAdultQuery,
  getDisplayNoteTitle,
  getNoteTitleFontInfo,
} from '../utils/noteUtils';
import { apiFetch } from '../utils/apiFetch';
import {
  Clock,
  Search,
  LayoutGrid,
  List,
  X,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Image as ImageIcon,
  FolderOpen,
  ShieldCheck,
  Globe,
  FileBadge,
  Tag,
  ChevronDown,
} from 'lucide-react';

interface RepositoryCardProps {
  files: VaultFile[];
  onSelectFile: (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => void;
  onRefresh: () => void;
  onOpenUpload?: () => void;
  onUpdateFileMeta?: (fileId: number, tags: string[], customColor?: string) => Promise<void> | void;
  isAdmin?: boolean;
  activeTheme?: SiteTheme | null;
}

const LEGACY_TOPIC_TAGS = new Set(['revision', 'homework', 'anatomy', 'formula', 'lab', 'exam']);

const getAcademicTagsOnly = (file: VaultFile): string[] => {
  const raw = Array.isArray(file.tags) ? file.tags : [];
  const filtered = raw
    .map((t) => shortenTag(String(t || '').trim()))
    .filter((t) => t && !LEGACY_TOPIC_TAGS.has(t.toLowerCase()));
  if (filtered.length > 0) {
    return filtered.slice(0, 3);
  }
  return [shortenTag((file.department || 'Sci').replace(/\s+/g, ''))];
};

interface StickedTapeProps {
  isEven?: boolean;
}

// Straight serrated-edge translucent dispenser tape strip centered with shadow border
const StickedTape: React.FC<StickedTapeProps> = () => (
  <div
    aria-hidden="true"
    className="sticked-tape absolute -top-[7.5px] min-[1025px]:-top-2.5 inset-x-0 mx-auto w-[35px] h-[17.5px] min-[1025px]:w-12 min-[1025px]:h-6 rotate-0 z-20 pointer-events-none select-none flex items-center justify-center backdrop-blur-[1px]"
  >
    <svg
      viewBox="0 0 48 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block pointer-events-none select-none"
      style={{
        filter:
          'drop-shadow(0 0 0.8px rgba(0, 0, 0, 0.35)) drop-shadow(0 1.5px 2px rgba(0, 0, 0, 0.14))',
      }}
    >
      <defs>
        <linearGradient id="tapeSerratedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.94" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.58" />
        </linearGradient>
      </defs>
      <polygon
        points="0,2.5 1.5,0.5 3,2.5 4.5,0.5 6,2.5 7.5,0.5 9,2.5 10.5,0.5 12,2.5 13.5,0.5 15,2.5 16.5,0.5 18,2.5 19.5,0.5 21,2.5 22.5,0.5 24,2.5 25.5,0.5 27,2.5 28.5,0.5 30,2.5 31.5,0.5 33,2.5 34.5,0.5 36,2.5 37.5,0.5 39,2.5 40.5,0.5 42,2.5 43.5,0.5 45,2.5 46.5,0.5 48,2.5 48,21.5 46.5,23.5 45,21.5 43.5,23.5 42,21.5 40.5,23.5 39,21.5 37.5,23.5 36,21.5 34.5,23.5 33,21.5 31.5,23.5 30,21.5 28.5,23.5 27,21.5 25.5,23.5 24,21.5 22.5,23.5 21,21.5 19.5,23.5 18,21.5 16.5,23.5 15,21.5 13.5,23.5 12,21.5 10.5,23.5 9,21.5 7.5,23.5 6,21.5 4.5,23.5 3,21.5 1.5,23.5 0,21.5"
        fill="url(#tapeSerratedGrad)"
        stroke="rgba(0, 0, 0, 0.12)"
        strokeWidth="0.75"
      />
    </svg>
  </div>
);

// Padlock Icon with Keyhole Dot for Protected Badge (matches user reference image)
export const ProtectedShieldLockIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

// Horizontal Key Icon for Public Badge (matches user reference image)
export const PublicGlobeCheckIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="7.5" cy="12" r="4" />
    <path d="M11.5 12H21" />
    <path d="M18.5 12v3" />
    <path d="M15.5 12v2.5" />
  </svg>
);

// Crisp, High-Craft File Type Icon Component
const FileTypeCustomIcon: React.FC<{
  iconKey: ColorTheme['iconKey'];
  className?: string;
}> = ({ iconKey, className = 'w-3.5 h-3.5 shrink-0' }) => {
  switch (iconKey) {
    case 'doc':
      return <FileText className={`${className} text-blue-900 stroke-[2.3]`} />;
    case 'xls':
      return <FileSpreadsheet className={`${className} text-emerald-900 stroke-[2.3]`} />;
    case 'ppt':
      return <Presentation className={`${className} text-orange-900 stroke-[2.3]`} />;
    case 'pdf':
      return <FileBadge className={`${className} text-rose-900 stroke-[2.3]`} />;
    case 'txt':
      return <FileCode className={`${className} text-amber-900 stroke-[2.3]`} />;
    case 'png':
      return <ImageIcon className={`${className} text-fuchsia-900 stroke-[2.3]`} />;
    case 'jpg':
      return <ImageIcon className={`${className} text-amber-900 stroke-[2.3]`} />;
    case 'jpeg':
      return <ImageIcon className={`${className} text-purple-900 stroke-[2.3]`} />;
    case 'dir':
      return <FolderOpen className={`${className} text-cyan-900 stroke-[2.3]`} />;
    case 'enc':
      return <ShieldCheck className={`${className} text-slate-800 stroke-[2.3]`} />;
    case 'link':
      return <Globe className={`${className} text-cyan-900 stroke-[2.3]`} />;
  }
};

// Safe external link opener without window.open
export const openExternalUrlSafely = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Directly triggers a browser download using a temporary blob URL
export const triggerMaskedFileDownload = async (
  fileId: number,
  pin: string = 'PWDLESS_PUBLIC',
  filename?: string
) => {
  try {
    const res = await apiFetch(`/api/preview/${fileId}?pin=${encodeURIComponent(pin)}&download=1`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      if (filename) a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }
  } catch (err) {
    console.error('Error downloading file:', err);
  }
};

// Opens a file preview safely with vanity origin / about:blank masking
// The address bar shows about:blank or domain origin to eliminate pentest path attacks
export const openMaskedFileInBrowser = async (
  fileId: number,
  pin: string = 'PWDLESS_PUBLIC',
  fileName?: string
) => {
  // Open window immediately synchronously to prevent browser popup blockers
  const newTab = window.open('about:blank', '_blank');
  try {
    const res = await apiFetch(`/api/preview/${fileId}?pin=${encodeURIComponent(pin)}`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (newTab) {
        const title = (fileName || 'Vault Document Preview').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
        try {
          // Masks the browser address bar to show about:blank or origin without backend API path
          newTab.history.replaceState(null, title, window.location.origin);
        } catch {}

        newTab.document.open();
        newTab.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="icon" href="/vite.svg">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background-color: #0f172a;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
  </style>
</head>
<body>
  <iframe src="${blobUrl}" allowfullscreen></iframe>
</body>
</html>`);
        newTab.document.close();
      } else {
        // Fallback if popup blocker intercepted newTab
        const a = document.createElement('a');
        a.href = blobUrl;
        if (fileName) a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } else {
      if (newTab) newTab.close();
      const errText = await res.text().catch(() => '');
      console.warn('Unable to load file preview:', errText);
    }
  } catch (err) {
    if (newTab) newTab.close();
    console.error('Error opening file preview:', err);
  }
};

// Directly opens a file or link in a new browser tab with path-masking to prevent pentest path exposure
export const openFileDirectly = (
  file: VaultFile,
  pin: string = 'PWDLESS_PUBLIC'
) => {
  if (file.is_link && file.link_url) {
    openExternalUrlSafely(file.link_url);
    return;
  }
  openMaskedFileInBrowser(file.id, pin, file.original_name);
};

// Highlights real-time search query matches inside filenames or tags
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const displayText = fixMojibake(text);
  const cleanQ = query.trim().replace(/^#/, '');
  if (!cleanQ) return <>{displayText}</>;

  const tokens = cleanQ
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, '').trim())
    .filter((t) => t.length >= 1)
    .sort((a, b) => b.length - a.length);

  if (tokens.length === 0) return <>{displayText}</>;

  const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const parts = displayText.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        tokens.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={i}
            className="bg-yellow-300/95 text-slate-950 rounded-xs px-0.5 font-extrabold"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

export const RepositoryCard: React.FC<RepositoryCardProps> = ({
  files,
  onSelectFile,
  onOpenUpload,
  isAdmin = false,
  activeTheme = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [accessFilter, setAccessFilter] = useState<'all' | 'public' | 'protected'>('all');
  const [isAccessDropdownOpen, setIsAccessDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const accessDropdownRef = useRef<HTMLDivElement>(null);

  // Close access filter dropdown on outside click or escape key
  useEffect(() => {
    if (!isAccessDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        accessDropdownRef.current &&
        !accessDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAccessDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccessDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccessDropdownOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Keyboard shortcut "/" or Ctrl+K to focus real-time filter input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isInputFocused && e.key === '/') {
        e.preventDefault();
        if (window.innerWidth > 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          setIsSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth > 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          setIsSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    apiFetch('/api/departments')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.departments)) {
          setDepartments(d.departments);
        }
      })
      .catch(() => {});
  }, [files]);

  const handleCopyLink = (e: React.MouseEvent, file: VaultFile) => {
    e.stopPropagation();
    if (file.link_url) {
      navigator.clipboard.writeText(file.link_url);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Exclude shared directories for now
  const nonDirectoryFiles = useMemo(
    () =>
      files.filter(
        (f) => !f.is_directory && String(f.file_extension || '').toUpperCase() !== 'DIR'
      ),
    [files]
  );

  // Facet counts for departments
  const facets = useMemo(
    () => extractTagFacets(nonDirectoryFiles, departments),
    [nonDirectoryFiles, departments]
  );

  const isSearchRestricted = isRestrictedAdultQuery(searchTerm);

  const filteredFiles = useMemo(
    () =>
      filterVaultFiles(nonDirectoryFiles, {
        searchTerm,
        selectedTag,
        selectedColorHex: 'All',
        accessFilter,
        departments,
      }),
    [nonDirectoryFiles, searchTerm, selectedTag, accessFilter, departments]
  );

  const isFiltering =
    searchTerm.trim().length > 0 ||
    selectedTag !== 'All' ||
    accessFilter !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedTag('All');
    setAccessFilter('all');
  };

  const handleTagChipClick = (e: React.MouseEvent, tagValue: string) => {
    e.stopPropagation();
    const shortVal = shortenTag(tagValue);
    if (
      selectedTag.toLowerCase() === tagValue.toLowerCase() ||
      selectedTag.toLowerCase() === shortVal.toLowerCase()
    ) {
      setSelectedTag('All');
    } else {
      setSelectedTag(shortVal);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full flex-1 flex flex-col min-h-0 font-sans">
      {/* ================= NOTES SPACE COMPACT SINGLE-ROW FILTER BAR ================= */}
      <section
        aria-label="Notes Space Single-Row Filter Bar"
        className="notes-filter-bar w-full bg-white/95 backdrop-blur-md rounded-2xl border border-blue-200/60 shadow-[0_4px_24px_-2px_rgba(59,130,246,0.18),0_2px_8px_-1px_rgba(15,23,42,0.05)] px-2.5 sm:px-3 py-0.5 sm:py-0.5 min-[1025px]:py-1.5 mb-1.5 min-[1025px]:mb-2.5 flex items-center justify-between gap-1.5 sm:gap-2 transition-all relative z-30"
      >
        {/* Left Section: Tag Icon + Horizontally Scrollable Subject Tags */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar shrink min-w-0 pr-1 py-0">
          <Tag className="w-3 h-3 text-slate-400 shrink-0 ml-0.5 mr-0.5" />

          {/* All Subjects Tag Pill */}
          <button
            type="button"
            onClick={() => setSelectedTag('All')}
            className={`filter-tag-pill h-5.5 min-[1025px]:h-6 px-2.5 rounded-full text-[9px] sm:text-[9.5px] min-[1025px]:text-[10px] font-bold transition-all shrink-0 cursor-pointer inline-flex items-center ${
              selectedTag === 'All'
                ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            All
          </button>

          {/* Department / Subject Tags */}
          {departments.map((dept) => {
            const shortTag = shortenTag(dept.name);
            const count = facets.departmentCounts[shortTag] || 0;
            const isActive =
              selectedTag.toLowerCase() === dept.name.toLowerCase() ||
              selectedTag.toLowerCase() === shortTag.toLowerCase();
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => setSelectedTag(isActive ? 'All' : shortTag)}
                className={`filter-tag-pill h-5.5 min-[1025px]:h-6 px-2 sm:px-2.5 rounded-full text-[9px] sm:text-[9.5px] min-[1025px]:text-[10px] font-semibold transition-all shrink-0 cursor-pointer inline-flex items-center gap-1 ${
                  isActive
                    ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                    : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700'
                }`}
                aria-label={`${dept.name} filter`}
              >
                <span>#{shortTag}</span>
                {count > 0 && (
                  <span
                    className={`text-[8.5px] px-1 py-0 rounded-full font-mono font-bold tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Reset Button when filters are active */}
          {isFiltering && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="filter-tag-pill h-5.5 min-[1025px]:h-6 text-[8.5px] sm:text-[9px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 rounded-full inline-flex items-center gap-0.5 transition-all cursor-pointer shrink-0 ml-1"
              aria-label="Clear all active search and tag filters"
            >
              <X className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right Section: Responsive Search + Access Level Filter + Grid/List View Switcher */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto pl-1">
          {/* ================= SEARCH BAR ================= */}
          {/* Screens <= 1024x768 (Mobile, Tablets, 972x654, 1024x768): Compact Search Icon Button (Expands inline) */}
          <div className="min-[1025px]:hidden flex items-center">
            {isSearchOpen || searchTerm.trim().length > 0 ? (
              <div className="relative flex items-center w-36 sm:w-44 transition-all duration-200 animate-in fade-in zoom-in-95 shrink-0">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 pointer-events-none shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes (/)..."
                  aria-label="Filter repository notes in real time"
                  className="filter-action-btn-dropdown h-5.5 min-[1025px]:h-6.5 w-full pl-6 pr-5 bg-slate-50/90 focus:bg-white border border-blue-500 ring-1 ring-blue-500/20 rounded-full text-[10.5px] min-[1025px]:text-[11px] font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-1.5 text-slate-400 hover:text-slate-700 flex items-center justify-center p-0.5 cursor-pointer"
                  aria-label="Clear and close search"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="filter-action-btn h-5.5 w-5.5 min-[1025px]:h-6.5 min-[1025px]:w-6.5 rounded-full border border-slate-200/80 bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all shrink-0 active:scale-95"
                aria-label="Search notes"
              >
                <Search className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Screens > 1024x768 (Laptops & Desktops 1280x800, 1440x900, etc.): Permanent Expanded Search Bar */}
          <div className="hidden min-[1025px]:flex relative items-center w-36 sm:w-44 lg:w-52 shrink-0">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 pointer-events-none shrink-0" />
            <input
              ref={desktopSearchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search... (/)"
              aria-label="Filter repository notes in real time"
              className="h-6.5 w-full pl-7 pr-6 bg-slate-50/90 focus:bg-white border border-slate-200/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 placeholder:text-[10.5px] placeholder:font-normal outline-none transition-all"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  desktopSearchInputRef.current?.focus();
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>

          {/* ================= ACCESS LEVEL FILTER ================= */}
          {/* Screens <= 1024x768 (Mobile, Tablets, 972x654, 1024x768): Compact Dropdown Filter */}
          <div className="relative shrink-0 min-[1025px]:hidden" ref={accessDropdownRef}>
            <button
              type="button"
              onClick={() => setIsAccessDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isAccessDropdownOpen}
              className={`filter-action-btn-dropdown h-5.5 min-[1025px]:h-6.5 px-2 bg-slate-100/90 hover:bg-slate-200/80 active:scale-95 border rounded-lg text-[8.5px] sm:text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
                isAccessDropdownOpen
                  ? 'bg-white border-blue-400 shadow-2xs text-slate-900 ring-1 ring-blue-400/20'
                  : accessFilter === 'public'
                  ? 'border-emerald-300 bg-emerald-50/70 text-emerald-800'
                  : accessFilter === 'protected'
                  ? 'border-rose-300 bg-rose-50/70 text-rose-800'
                  : 'border-slate-200/80 text-slate-700'
              }`}
              aria-label="Filter notes by access level"
            >
              {accessFilter === 'all' && (
                <span>All ({nonDirectoryFiles.length})</span>
              )}
              {accessFilter === 'public' && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Public ({facets.publicCount})</span>
                </span>
              )}
              {accessFilter === 'protected' && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>PIN ({facets.protectedCount})</span>
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-150 shrink-0 ${
                  isAccessDropdownOpen ? 'rotate-180 text-slate-700' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Popover */}
            {isAccessDropdownOpen && (
              <div
                role="listbox"
                aria-label="Access Level Options"
                className="absolute right-0 top-full mt-1.5 w-38 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.18),0_4px_10px_-2px_rgba(15,23,42,0.08)] p-1 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={accessFilter === 'all'}
                  onClick={() => {
                    setAccessFilter('all');
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-left flex items-center justify-between cursor-pointer transition-colors ${
                    accessFilter === 'all'
                      ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>All Notes</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      accessFilter === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {nonDirectoryFiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  role="option"
                  aria-selected={accessFilter === 'public'}
                  onClick={() => {
                    setAccessFilter('public');
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-left flex items-center justify-between cursor-pointer transition-colors ${
                    accessFilter === 'public'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-2xs'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        accessFilter === 'public' ? 'bg-white' : 'bg-emerald-500'
                      }`}
                    />
                    <span>Public</span>
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      accessFilter === 'public'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {facets.publicCount}
                  </span>
                </button>

                <button
                  type="button"
                  role="option"
                  aria-selected={accessFilter === 'protected'}
                  onClick={() => {
                    setAccessFilter('protected');
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-left flex items-center justify-between cursor-pointer transition-colors ${
                    accessFilter === 'protected'
                      ? 'bg-rose-600 text-white font-extrabold shadow-2xs'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        accessFilter === 'protected' ? 'bg-white' : 'bg-rose-500'
                      }`}
                    />
                    <span>PIN</span>
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full tabular-nums font-mono ${
                      accessFilter === 'protected'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {facets.protectedCount}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Screens > 1024x768 (Laptops & Desktops 1280x800, 1440x900, etc.): Previous Segmented Pill */}
          <div
            role="group"
            aria-label="Filter by access level"
            className="hidden min-[1025px]:inline-flex h-6.5 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/80 items-center gap-0.5 text-xs font-bold shrink-0"
          >
            <button
              type="button"
              onClick={() => setAccessFilter('all')}
              className={`px-2 h-full rounded-md text-[8.5px] transition-all cursor-pointer tabular-nums whitespace-nowrap ${
                accessFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({nonDirectoryFiles.length})
            </button>
            <button
              type="button"
              onClick={() => setAccessFilter(accessFilter === 'public' ? 'all' : 'public')}
              className={`px-2 h-full rounded-md text-[8.5px] transition-all cursor-pointer inline-flex items-center gap-0.5 tabular-nums whitespace-nowrap ${
                accessFilter === 'public'
                  ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              <span>Public ({facets.publicCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setAccessFilter(accessFilter === 'protected' ? 'all' : 'protected')}
              className={`px-2 h-full rounded-md text-[8.5px] transition-all cursor-pointer inline-flex items-center gap-0.5 tabular-nums whitespace-nowrap ${
                accessFilter === 'protected'
                  ? 'bg-white text-rose-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
              <span>PIN ({facets.protectedCount})</span>
            </button>
          </div>

          {/* 3. Grid / List View Switcher */}
          <div className="filter-view-switcher h-5.5 min-[1025px]:h-6.5 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/80 inline-flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`h-4.5 w-4.5 min-[1025px]:h-5.5 min-[1025px]:w-5.5 rounded-md inline-flex items-center justify-center border transition-colors duration-150 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 border-slate-200/80 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
              aria-label="Sticky Note Grid View"
            >
              <LayoutGrid className="w-2.5 h-2.5 min-[1025px]:w-3 min-[1025px]:h-3 stroke-[2.2] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`h-4.5 w-4.5 min-[1025px]:h-5.5 min-[1025px]:w-5.5 rounded-md inline-flex items-center justify-center border transition-colors duration-150 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 border-slate-200/80 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
              aria-label="Structured Table List View"
            >
              <List className="w-2.5 h-2.5 min-[1025px]:w-3 min-[1025px]:h-3 stroke-[2.2] shrink-0" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= STICKY NOTE PINBOARD GRID ================= */}
      {isSearchRestricted ? (
        <div className="text-center py-14 px-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-2.5 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
            <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
          </div>
          <p className="text-rose-950 font-extrabold text-sm">
            Campus Student Safety Policy — Restricted Search Blocked
          </p>
          <p className="text-rose-800 max-w-md font-medium">
            Pornography, adult content, and sexually explicit search queries and results are strictly prohibited on this student & faculty repository.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-lg font-bold text-xs hover:bg-rose-50 transition cursor-pointer shadow-xs"
          >
            Clear Search
          </button>
        </div>
      ) : filteredFiles.length === 0 && !isFiltering ? (
        <div className="text-center py-12 text-slate-500 text-xs space-y-3 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <span className="material-symbols-outlined text-[28px]">folder_open</span>
          </div>
          <p className="text-slate-900 font-bold text-sm">No notes pinned yet</p>
          <p className="text-slate-500">Pin your first study note or share a website link to get started.</p>
          {onOpenUpload && (
            <div className="pt-4 w-full max-w-[210px]">
              <div
                onClick={onOpenUpload}
                className="sticky-card border-2 border-dashed border-blue-400/90 bg-white hover:bg-white flex flex-col items-center justify-center p-4 text-center cursor-pointer group mx-auto relative overflow-visible min-w-0"
              >
                <StickedTape isEven={true} />
                <div className="w-10 h-10 rounded-2xl bg-blue-50 group-hover:bg-blue-100 text-blue-700 flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 border border-blue-200/80 opacity-100">
                  <span className="material-symbols-outlined text-[22px] leading-none text-blue-700">note_add</span>
                </div>
                <p className="font-hand font-bold text-slate-950 text-[20px] leading-tight mb-1 group-hover:text-blue-700 transition-colors">
                  Pin New Note
                </p>
                <p className="text-[11px] text-slate-600 font-medium max-w-[145px] leading-snug">
                  Write a quick study note, upload docs, or share a web link
                </p>
              </div>
            </div>
          )}
        </div>
      ) : filteredFiles.length === 0 && isFiltering ? (
        <div className="text-center py-16 text-slate-500 text-xs space-y-3 flex flex-col items-center bg-white/70 rounded-2xl border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <p className="text-slate-900 font-bold text-base">No matching study notes found</p>
          <p className="text-slate-500 max-w-md">
            No notes match your active filter criteria. Try clearing the tag filter, or search using a department shortcut like{' '}
            <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">s,6,a</code>.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition cursor-pointer shadow-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <main className="notes-grid-layout pt-3 pb-6">
          {/* 1. Pin New Note Card */}
          {onOpenUpload && (
            <div
              onClick={onOpenUpload}
              className="sticky-card border-2 border-dashed border-blue-400/90 bg-white hover:bg-white flex flex-col items-center justify-center p-2.5 sm:p-3 text-center cursor-pointer group relative overflow-visible"
            >
              <StickedTape isEven={true} />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 text-blue-700 flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110 border border-blue-200/80">
                <span className="material-symbols-outlined text-[18px] sm:text-[20px] leading-none">note_add</span>
              </div>
              <p className="font-hand font-bold text-slate-950 text-[16px] min-[400px]:text-[17px] sm:text-[18px] min-[1025px]:text-[22px] xl:text-[24px] leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">
                Pin New Note
              </p>
              <p className="text-[8.5px] sm:text-[9.5px] text-slate-600 font-medium max-w-[120px] sm:max-w-[130px] leading-tight">
                Write a quick study note, upload docs, or share a web link
              </p>
            </div>
          )}

          {/* 2. Stitch Pastel Sticky Note Cards */}
          {filteredFiles.map((file, index) => {
            const theme = getFileColorTheme(file);
            const isLink = !!file.is_link;
            const hoursLeft = calculateHoursLeft(file, index);

            // Active Seasonal Theme Card Skin (rotates across variants)
            const activeSkin =
              activeTheme?.cardSkins && activeTheme.cardSkins.length > 0
                ? activeTheme.cardSkins[index % activeTheme.cardSkins.length]
                : null;

            const extLabel = file.file_extension
              ? file.file_extension.toUpperCase().replace(/^\./, '')
              : theme.badgeLabel;

            // Only 2 to 3 tags: Subject/Dept, Class, and Section
            const displayTags = getAcademicTagsOnly(file);

            const isMenuOpen = activeMenuId === file.id;
            const displayTitle = getDisplayNoteTitle(file.original_name, isLink, file.file_extension);
            const titleFont = getNoteTitleFontInfo(displayTitle, file.tags);

            return (
              <article
                key={file.id}
                data-color-hex={activeSkin?.bgColor || theme.hexCode}
                data-color-name={activeSkin?.name || theme.swatchName}
                style={
                  activeSkin
                    ? {
                        backgroundColor: activeSkin.bgColor,
                        borderColor: activeSkin.borderColor || 'transparent',
                      }
                    : undefined
                }
                onClick={() => {
                  if (file.is_passwordless) {
                    openFileDirectly(file, 'PWDLESS_PUBLIC');
                  } else {
                    onSelectFile(file, 'decrypt');
                  }
                }}
                className={`sticky-card ${activeSkin ? '' : theme.cardBg} ${
                  isMenuOpen ? 'z-40' : 'z-10'
                } flex flex-col justify-between p-2.5 sm:p-3 select-none group relative overflow-visible`}
              >
                {/* Seasonal Card Edge & Corner SVGs (Non-blocking, pointer-events: none) */}
                {activeSkin?.decorations?.topLeftSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.topLeftSvg }}
                  />
                )}
                {activeSkin?.decorations?.topSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.topSvg }}
                  />
                )}
                {activeSkin?.decorations?.topRightSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.topRightSvg }}
                  />
                )}
                {activeSkin?.decorations?.bottomLeftSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.bottomLeftSvg }}
                  />
                )}
                {activeSkin?.decorations?.bottomSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 inset-x-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.bottomSvg }}
                  />
                )}
                {activeSkin?.decorations?.bottomRightSvg && (
                  <div
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 pointer-events-none select-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeSkin.decorations.bottomRightSvg }}
                  />
                )}

                {/* Sticked Adhesive Tape Strip (Alternating tilts for natural pinned look) */}
                <StickedTape isEven={onOpenUpload ? index % 2 === 1 : index % 2 === 0} />

                {/* Top paper adhesive sheen */}
                <div className="adhesive-strip absolute top-0 left-0 right-0 h-[22%]" aria-hidden="true" />

                {/* Top Header Row: File Type Badge + 3-Dots Menu */}
                <div className="relative z-30 flex items-center justify-between gap-1 pt-0.5">
                  <span
                    className={`pl-1.5 pr-2 py-0.5 rounded-md font-bold text-[9px] sm:text-[9.5px] leading-none ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} inline-flex items-center gap-1 shadow-2xs`}
                  >
                    <FileTypeCustomIcon iconKey={theme.iconKey} className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-none tracking-tight">{extLabel}</span>
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : file.id);
                      }}
                      className="w-5.5 h-5.5 text-slate-900 hover:text-slate-950 transition-colors rounded-md hover:bg-black/10 cursor-pointer relative inline-flex items-center justify-center -mr-0.5 p-0.5"
                      aria-label="More note options"
                    >
                      <span className="material-symbols-outlined text-[16px] leading-none">more_vert</span>
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-7 w-48 bg-white border border-slate-200/95 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5 text-left text-xs font-sans"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          if (file.is_passwordless) {
                            openFileDirectly(file, 'PWDLESS_PUBLIC');
                          } else {
                            onSelectFile(file, 'decrypt');
                          }
                        }}
                        className="w-full text-left px-2.5 py-2 sm:py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-600">open_in_new</span>
                        <span>{file.is_passwordless ? 'Open Note Directly' : 'Unlock & Open Note'}</span>
                      </button>

                      {isLink ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            setActiveMenuId(null);
                            handleCopyLink(e, file);
                          }}
                          className="w-full text-left px-2.5 py-2 sm:py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-blue-600">content_copy</span>
                          <span>{copiedId === file.id ? 'Copied!' : 'Copy Link URL'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            if (file.is_passwordless) {
                              triggerMaskedFileDownload(file.id, 'PWDLESS_PUBLIC', file.original_name);
                            } else {
                              onSelectFile(file, 'download');
                            }
                          }}
                          className="w-full text-left px-2.5 py-2 sm:py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
                          <span>Download File</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            onSelectFile(file, 'details');
                          }}
                          className="w-full text-left px-2.5 py-2 sm:py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                          <span>Technical Specs</span>
                        </button>
                      )}

                      <div className="h-px bg-slate-200 my-1" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(null);
                          onSelectFile(file, 'delete');
                        }}
                        className="w-full text-left px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>{isAdmin ? 'Purge Record' : 'Delete Note'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sticky Note Title & Author Content (generously spaced, non-collapsing) */}
                <div className="relative z-10 flex flex-col justify-start my-0.5 min-w-0 w-full shrink-0">
                  <h3
                    className={`font-bold text-slate-900 leading-[1.12] line-clamp-2 break-words tracking-normal mb-0.5 ${titleFont.fontSizeClass} ${titleFont.className}`}
                    style={{ fontFamily: titleFont.fontFamily }}
                  >
                    <HighlightedText text={displayTitle} query={searchTerm} />
                  </h3>

                  <p className="text-[8px] sm:text-[8.5px] lg:text-[9px] text-slate-500 font-medium truncate block w-full font-sans">
                    {isLink ? (
                      <span>Web Link • {file.uploader_name || 'Campus Member'}</span>
                    ) : (
                      <span>
                        {file.file_size_formatted} • {file.uploader_name || 'Campus Member'}
                      </span>
                    )}
                  </p>
                </div>

                {/* Bottom Section: Interactive Clickable #Tag Badges (Subject/Dept, Class, Section) & Status Row */}
                <div className="relative z-20 w-full mt-auto pt-0.5">
                  <div className="flex flex-wrap gap-0.5 mb-1 max-h-[19px] overflow-hidden">
                    {displayTags.map((tag, tIdx) => {
                      const isTagSelected =
                        selectedTag.toLowerCase() === tag.toLowerCase() ||
                        shortenTag(selectedTag).toLowerCase() === tag.toLowerCase();
                      return (
                        <button
                          key={tIdx}
                          type="button"
                          onClick={(e) => handleTagChipClick(e, tag)}
                          className={`text-[7.5px] sm:text-[8px] font-semibold px-1.5 py-0.5 rounded border transition-all cursor-pointer leading-none truncate max-w-[65px] sm:max-w-[75px] ${
                            isTagSelected
                              ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                              : `${theme.tagBg} ${theme.tagText} ${theme.tagBorder} hover:bg-white`
                          }`}
                        >
                          #<HighlightedText text={tag} query={searchTerm} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer Row: Access Badge + Auto-Purge Countdown */}
                  <div
                    className={`flex items-center justify-between gap-0.5 pt-1 border-t ${theme.divideBorder} w-full min-w-0`}
                  >
                    {!file.is_passwordless ? (
                      <div
                        className="w-[52px] sm:w-[56px] h-[16px] sm:h-[18px] bg-[#ef4444] text-white font-bold text-[7px] sm:text-[7.5px] leading-none rounded-full inline-flex items-center justify-center gap-0.5 shadow-2xs shrink-0 select-none"
                      >
                        <ProtectedShieldLockIcon className="w-2 h-2 shrink-0" />
                        <span className="leading-none">Protected</span>
                      </div>
                    ) : (
                      <div
                        className="w-[46px] sm:w-[50px] h-[16px] sm:h-[18px] bg-emerald-600 text-white font-bold text-[7px] sm:text-[7.5px] leading-none rounded-full inline-flex items-center justify-center gap-0.5 shadow-2xs shrink-0 select-none"
                      >
                        <PublicGlobeCheckIcon className="w-2 h-2 shrink-0" />
                        <span className="leading-none">Public</span>
                      </div>
                    )}

                    <div
                      className="text-[7.5px] sm:text-[8px] font-bold text-slate-700 tabular-nums leading-none inline-flex items-center justify-end gap-0.5 shrink-0 ml-auto"
                    >
                      <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0 stroke-[2.5]" />
                      <span className="leading-none whitespace-nowrap">{hoursLeft}h left</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </main>
      ) : (
        /* STRUCTURED DESKTOP TABLE LIST VIEW (Refined, Compact & Proportional) */
        <div className="w-full bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs mt-2 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/95 text-slate-500 font-bold border-b border-slate-200 uppercase text-[9.5px] tracking-wider">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Note Title</th>
                  <th className="py-2.5 px-3">Tags</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Access</th>
                  <th className="py-2.5 px-3">TTL</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFiles.map((file, idx) => {
                  const theme = getFileColorTheme(file);
                  const isLink = !!file.is_link;
                  const hoursLeft = calculateHoursLeft(file, idx);
                  const displayTags = getAcademicTagsOnly(file);
                  const tableDisplayTitle = getDisplayNoteTitle(file.original_name, isLink, file.file_extension);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => {
                        if (file.is_passwordless) {
                          openFileDirectly(file, 'PWDLESS_PUBLIC');
                        } else {
                          onSelectFile(file, 'decrypt');
                        }
                      }}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2 px-3 font-mono font-bold">
                        <span
                          className={`pl-1.5 pr-2 py-0.5 rounded-md text-[9px] font-extrabold leading-none ${theme.cardBg} text-slate-950 border border-black/15 inline-flex items-center gap-1 shadow-2xs`}
                        >
                          <FileTypeCustomIcon iconKey={theme.iconKey} className="w-3 h-3" />
                          <span className="leading-none">
                            {(file.file_extension || theme.badgeLabel).toUpperCase().replace(/^\./, '')}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 max-w-xs truncate group-hover:text-blue-700 transition-colors text-[11.5px] sm:text-xs">
                        <HighlightedText text={tableDisplayTitle} query={searchTerm} />
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {displayTags.map((tag, tIdx) => (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={(e) => handleTagChipClick(e, tag)}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border-slate-200 cursor-pointer transition-colors leading-none"
                            >
                              #<HighlightedText text={tag} query={searchTerm} />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[10.5px] tabular-nums">
                        {isLink ? 'URL' : file.file_size_formatted}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-medium text-[11px] truncate max-w-[120px]">
                        {file.uploader_name || 'Campus Member'}
                      </td>
                      <td className="py-2 px-3">
                        {!file.is_passwordless ? (
                          <span className="w-[68px] h-[19px] bg-[#ef4444] text-white font-bold text-[8.5px] leading-none rounded-full inline-flex items-center justify-center gap-0.5 shadow-2xs shrink-0 select-none">
                            <ProtectedShieldLockIcon className="w-2.5 h-2.5 shrink-0" />
                            <span className="leading-none">Protected</span>
                          </span>
                        ) : (
                          <span className="w-[60px] h-[19px] bg-emerald-600 text-white font-bold text-[8.5px] leading-none rounded-full inline-flex items-center justify-center gap-0.5 shadow-2xs shrink-0 select-none">
                            <PublicGlobeCheckIcon className="w-2.5 h-2.5 shrink-0" />
                            <span className="leading-none">Public</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-semibold text-[10.5px] tabular-nums">
                        <span className="inline-flex items-center gap-1 leading-none">
                          <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{hoursLeft}h left</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.is_passwordless) {
                              openFileDirectly(file, 'PWDLESS_PUBLIC');
                            } else {
                              onSelectFile(file, 'decrypt');
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-800 font-bold text-[10.5px] transition-all cursor-pointer inline-flex items-center gap-1 leading-none shadow-2xs"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
