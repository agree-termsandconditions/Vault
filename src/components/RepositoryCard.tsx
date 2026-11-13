import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  VaultFile,
  DEFAULT_DEPARTMENTS,
  DepartmentConfig,
  shortenTag,
  fixMojibake,
} from '../types';
import {
  Lock,
  Key,
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
  Sparkles,
} from 'lucide-react';

interface RepositoryCardProps {
  files: VaultFile[];
  onSelectFile: (file: VaultFile, action: 'decrypt' | 'download' | 'details' | 'delete') => void;
  onRefresh: () => void;
  onOpenUpload?: () => void;
  isAdmin?: boolean;
}

interface ColorTheme {
  typeLabel: string;
  badgeLabel: string;
  swatchName: string;
  hexCode: string;
  iconKey: 'doc' | 'xls' | 'ppt' | 'txt' | 'pdf' | 'png' | 'jpg' | 'jpeg' | 'dir' | 'enc' | 'link';
  cardBg: string;
  headerStripBg: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBoxBg: string;
  iconColor: string;
  tagBg: string;
  tagText: string;
  tagBorder: string;
  divideBorder: string;
}

// Realistic Frosted Adhesive Tape with Finer Custom Zigzag (Serrated) Cuts at Both Top & Bottom Edges
const SerratedFrostedTape: React.FC = () => (
  <div className="frosted-tape" aria-hidden="true">
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="w-full h-full block"
    >
      <polygon
        points="0,3.5 4,0 8,3.5 12,0 16,3.5 20,0 24,3.5 28,0 32,3.5 36,0 40,3.5 44,0 48,3.5 52,0 56,3.5 60,0 64,3.5 68,0 72,3.5 76,0 80,3.5 84,0 88,3.5 92,0 96,3.5 100,0 100,28.5 96,32 92,28.5 88,32 84,28.5 80,32 76,28.5 72,32 68,28.5 64,32 60,28.5 56,32 52,28.5 48,32 44,28.5 40,32 36,28.5 32,32 28,28.5 24,32 20,28.5 16,32 12,28.5 8,32 4,28.5 0,32"
        fill="none"
        stroke="rgba(0, 0, 0, 0.22)"
        strokeWidth="1.3"
        strokeLinejoin="miter"
      />
    </svg>
  </div>
);

// Professional Shield-Lock Icon for Protected Badge
export const ProtectedShieldLockIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
    <path d="M10 11V9a2 2 0 1 1 4 0v2" />
  </svg>
);

// Professional Globe Icon for Public Badge (Clean, sharp geometry matching Image 2)
export const PublicGlobeCheckIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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

// 10 Exact Sticky Note Colors requested by user:
// --color-note-coral:   #FF9A8D
// --color-note-apricot: #FFB366
// --color-note-gold:    #FFCA58
// --color-note-yellow:  #FFF066
// --color-note-mint:    #8EE2A1
// --color-note-grey:    #E1E4E6
// --color-note-pink:    #FFAFCC
// --color-note-lilac:   #CBB2FE
// --color-note-sky:     #66B2FF
// --color-note-aqua:    #5CE1E6
const PASTEL_THEMES: Record<string, ColorTheme> = {
  // Sky Blue (#66B2FF)
  doc: {
    typeLabel: 'Word Document (.doc / .docx)',
    badgeLabel: 'DOCX',
    swatchName: 'Sky Blue',
    hexCode: '#66B2FF',
    iconKey: 'doc',
    cardBg: 'bg-[#66B2FF]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#66B2FF]/35',
    iconColor: 'text-blue-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Mint Green (#8EE2A1)
  xls: {
    typeLabel: 'Excel Spreadsheet (.xls / .xlsx)',
    badgeLabel: 'XLSX',
    swatchName: 'Mint Green',
    hexCode: '#8EE2A1',
    iconKey: 'xls',
    cardBg: 'bg-[#8EE2A1]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#8EE2A1]/35',
    iconColor: 'text-emerald-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Warm Apricot (#FFB366)
  ppt: {
    typeLabel: 'Presentation (.ppt / .pptx)',
    badgeLabel: 'PPTX',
    swatchName: 'Warm Apricot',
    hexCode: '#FFB366',
    iconKey: 'ppt',
    cardBg: 'bg-[#FFB366]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFB366]/35',
    iconColor: 'text-orange-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Canary Yellow (#FFF066)
  txt: {
    typeLabel: 'Text File (.txt / text)',
    badgeLabel: 'TXT',
    swatchName: 'Canary Yellow',
    hexCode: '#FFF066',
    iconKey: 'txt',
    cardBg: 'bg-[#FFF066]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFF066]/50',
    iconColor: 'text-amber-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Coral Pink (#FF9A8D)
  pdf: {
    typeLabel: 'PDF Document (.pdf)',
    badgeLabel: 'PDF',
    swatchName: 'Coral Pink',
    hexCode: '#FF9A8D',
    iconKey: 'pdf',
    cardBg: 'bg-[#FF9A8D]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FF9A8D]/35',
    iconColor: 'text-rose-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Rose Pink (#FFAFCC)
  png: {
    typeLabel: 'PNG Graphic (.png)',
    badgeLabel: 'PNG',
    swatchName: 'Rose Pink',
    hexCode: '#FFAFCC',
    iconKey: 'png',
    cardBg: 'bg-[#FFAFCC]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFAFCC]/35',
    iconColor: 'text-fuchsia-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Golden Marigold (#FFCA58)
  jpg: {
    typeLabel: 'JPG Photo (.jpg)',
    badgeLabel: 'JPG',
    swatchName: 'Golden Marigold',
    hexCode: '#FFCA58',
    iconKey: 'jpg',
    cardBg: 'bg-[#FFCA58]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFCA58]/35',
    iconColor: 'text-amber-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Lilac Purple (#CBB2FE)
  jpeg: {
    typeLabel: 'JPEG Image (.jpeg)',
    badgeLabel: 'JPEG',
    swatchName: 'Lilac Purple',
    hexCode: '#CBB2FE',
    iconKey: 'jpeg',
    cardBg: 'bg-[#CBB2FE]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#CBB2FE]/35',
    iconColor: 'text-purple-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Aqua Teal (#5CE1E6)
  dir: {
    typeLabel: 'Directory Archive (.dir)',
    badgeLabel: 'DIR',
    swatchName: 'Aqua Teal',
    hexCode: '#5CE1E6',
    iconKey: 'dir',
    cardBg: 'bg-[#5CE1E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#5CE1E6]/35',
    iconColor: 'text-cyan-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Soft Grey (#E1E4E6)
  enc: {
    typeLabel: 'Security Key / Encrypted (.enc / .pem)',
    badgeLabel: 'ENC',
    swatchName: 'Soft Grey',
    hexCode: '#E1E4E6',
    iconKey: 'enc',
    cardBg: 'bg-[#E1E4E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-slate-300/60',
    iconColor: 'text-slate-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
  // Aqua Teal (#5CE1E6)
  link: {
    typeLabel: 'Shared Web Link (URL)',
    badgeLabel: 'LINK',
    swatchName: 'Aqua Teal',
    hexCode: '#5CE1E6',
    iconKey: 'link',
    cardBg: 'bg-[#5CE1E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/90',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#5CE1E6]/35',
    iconColor: 'text-cyan-900',
    tagBg: 'bg-white/80',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/10',
    divideBorder: 'border-slate-950/15',
  },
};

const getFileColorTheme = (file: VaultFile): ColorTheme => {
  const ext = (file.file_extension || '').toLowerCase().replace(/^\./, '').trim();
  const mime = (file.mime_type || '').toLowerCase();
  const name = (file.original_name || '').toLowerCase();

  if (file.is_link || ext === 'link' || ext === 'url' || ext === 'web' || mime === 'text/uri-list') {
    return PASTEL_THEMES.link;
  }
  if (
    ext === 'doc' ||
    ext === 'docx' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return PASTEL_THEMES.doc;
  }
  if (
    ext === 'xls' ||
    ext === 'xlsx' ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  ) {
    return PASTEL_THEMES.xls;
  }
  if (
    ext === 'ppt' ||
    ext === 'pptx' ||
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    return PASTEL_THEMES.ppt;
  }
  if (
    ext === 'txt' ||
    ext === 'text' ||
    ext === 'log' ||
    ext === 'rtf' ||
    ext === 'md' ||
    mime === 'text/plain' ||
    name.endsWith('.txt')
  ) {
    return PASTEL_THEMES.txt;
  }
  if (ext === 'pdf' || mime.includes('pdf') || name.endsWith('.pdf')) {
    return PASTEL_THEMES.pdf;
  }
  if (ext === 'png' || name.endsWith('.png')) {
    return PASTEL_THEMES.png;
  }
  if (ext === 'jpg' || name.endsWith('.jpg')) {
    return PASTEL_THEMES.jpg;
  }
  if (ext === 'jpeg' || name.endsWith('.jpeg')) {
    return PASTEL_THEMES.jpeg;
  }
  if (ext === 'dir' || file.is_directory) {
    return PASTEL_THEMES.dir;
  }
  if (['enc', 'pem', 'key', 'cer', 'crt', 'vault'].includes(ext)) {
    return PASTEL_THEMES.enc;
  }
  return PASTEL_THEMES.doc;
};

const calculateHoursLeft = (file: VaultFile, index: number): number => {
  if (file.expires_at) {
    const remaining = Math.round((new Date(file.expires_at).getTime() - Date.now()) / (1000 * 60 * 60));
    if (remaining > 0) return remaining;
  }
  if (file.created_at) {
    const createdTime = new Date(file.created_at).getTime();
    if (!isNaN(createdTime)) {
      const remaining = Math.round((createdTime + 48 * 3600 * 1000 - Date.now()) / (1000 * 60 * 60));
      if (remaining > 0) return remaining;
    }
  }
  const demoHours = [47, 42, 36, 24, 19, 45, 31, 28, 12, 8];
  return demoHours[index % demoHours.length];
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

// Opens a file preview safely with vanity origin masking (hides blob UUIDs and backend API paths)
// Address bar displays only the domain origin (e.g. http://localhost:3000)
export const openMaskedFileInBrowser = async (
  fileId: number,
  pin: string = 'PWDLESS_PUBLIC',
  fileName?: string
) => {
  // Open window immediately synchronously to prevent browser popup blockers
  const newTab = window.open('about:blank', '_blank');
  try {
    const res = await fetch(`/api/preview/${fileId}?pin=${encodeURIComponent(pin)}`);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (newTab) {
        const title = (fileName || 'Vault Document Preview').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
        try {
          // Masks the browser address bar to show only the domain origin without path or blob uuid
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
        // Fallback if popup blocker intercepted newTab: directly download the file so the user receives it
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
      alert(errText ? `Unable to preview file: ${errText}` : 'Unable to load file preview. Please try again.');
    }
  } catch (err) {
    if (newTab) newTab.close();
    console.error('Error opening file preview:', err);
  }
};

// Directly triggers a browser download using a temporary blob URL without exposing /api/preview/... in the URL
export const triggerMaskedFileDownload = async (
  fileId: number,
  pin: string = 'PWDLESS_PUBLIC',
  filename?: string
) => {
  try {
    const res = await fetch(`/api/preview/${fileId}?pin=${encodeURIComponent(pin)}&download=1`);
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
    } else {
      const errText = await res.text().catch(() => '');
      alert(errText ? `Download failed: ${errText}` : 'Unable to download file. Please try again.');
    }
  } catch (err) {
    console.error('Error downloading file:', err);
  }
};

// True if browser can natively open/render the file in a browser tab (Web & Markup, Documents & Text, Images, Audio & Video Media, Links)
const BROWSER_OPENABLE_EXTENSIONS = [
  // Web & Markup Files
  'html',
  'htm',
  'xml',
  'svg',
  'js',
  'css',
  // Documents & Text
  'pdf',
  'txt',
  'text',
  'md',
  'csv',
  'json',
  'log',
  'dir',
  // Images
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'ico',
  // Audio & Video Media
  'mp3',
  'mp4',
  'webm',
  'ogg',
  'ogv',
  '3gp',
  'wav',
];

const isBrowserSupportedFormat = (file: VaultFile): boolean => {
  const ext = (file.file_extension || '').toLowerCase().replace(/^\./, '').trim();
  const mime = (file.mime_type || '').toLowerCase();
  const name = (file.original_name || '').toLowerCase();

  if (file.is_link || file.is_directory) return true;
  if (BROWSER_OPENABLE_EXTENSIONS.includes(ext)) {
    return true;
  }
  if (
    mime.startsWith('image/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime === 'application/pdf' ||
    mime === 'application/xml' ||
    mime.startsWith('text/')
  ) {
    return true;
  }
  if (BROWSER_OPENABLE_EXTENSIONS.some((supportedExt) => name.endsWith(`.${supportedExt}`))) {
    return true;
  }
  return false;
};

// Open Public files directly in a new browser tab (if supported) or trigger direct download (if binary) without opening preview modal
// Masks raw internal URLs and pins so only the domain/blob address is visible
const openOrDownloadPublicFileDirectly = (file: VaultFile) => {
  if (file.is_link && file.link_url) {
    openExternalUrlSafely(file.link_url);
    return;
  }
  if (isBrowserSupportedFormat(file)) {
    openMaskedFileInBrowser(file.id, 'PWDLESS_PUBLIC', file.original_name);
  } else {
    triggerMaskedFileDownload(file.id, 'PWDLESS_PUBLIC', file.original_name);
  }
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEFAULT_DEPARTMENTS);

  const searchInputRef = useRef<HTMLInputElement>(null);

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
        searchInputRef.current?.focus();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetch('/api/departments')
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

  // Show only Department tags in the top Repository filter bar
  const filterPills = useMemo(
    () => departments.map((d) => d.name),
    [departments]
  );

  // Helper to normalize common spelling variations (e.g. "anotomy" -> "anatomy")
  const normalizeSpelling = (str: string) =>
    str
      .toLowerCase()
      .replace(/[_-]/g, ' ')
      .replace(/anotomy/g, 'anatomy');

  // Real-Time Multi-Token & Tag/Name/Shortcut Filter (e.g. "s,6,a", "s 6 a", "6,A", "#Science", or partial filename/tag)
  const matchesSmartQuery = (file: VaultFile, rawQuery: string): boolean => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;

    const cleanFullQ = q.replace(/^#/, '');
    const fileTagsLower = (file.tags || []).map((t) => t.toLowerCase().trim());
    const fileTagsShortLower = (file.tags || []).map((t) => shortenTag(t).toLowerCase().trim());
    const fileDeptLower = (file.department || '').toLowerCase().trim();
    const fileDeptShortLower = shortenTag(file.department || '').toLowerCase().trim();
    const fileNameLower = normalizeSpelling(file.original_name || '');
    const rawFileNameLower = (file.original_name || '').toLowerCase();
    const uploaderLower = (file.uploader_name || '').toLowerCase();
    const extLower = (file.file_extension || '').toLowerCase().replace(/^\./, '');

    const normQ = normalizeSpelling(cleanFullQ);
    if (
      rawFileNameLower.includes(cleanFullQ) ||
      fileNameLower.includes(normQ) ||
      uploaderLower.includes(cleanFullQ) ||
      fileDeptLower.includes(cleanFullQ) ||
      fileDeptShortLower.includes(cleanFullQ) ||
      extLower.includes(cleanFullQ) ||
      fileTagsLower.some((t) => t.includes(cleanFullQ)) ||
      fileTagsShortLower.some((t) => t.includes(cleanFullQ))
    ) {
      return true;
    }

    const tokens = q.split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) return true;

    return tokens.every((tok) => {
      const cleanTok = tok.replace(/^#/, '');

      const matchedShortcutDepts = departments.filter(
        (d) => d.shortcut.toLowerCase() === cleanTok
      );
      const matchesShortcut = matchedShortcutDepts.some((d) => {
        const dName = d.name.toLowerCase();
        const dShort = shortenTag(d.name).toLowerCase();
        return (
          fileDeptLower === dName ||
          fileDeptShortLower === dShort ||
          fileTagsLower.includes(dName) ||
          fileTagsShortLower.includes(dShort)
        );
      });
      if (matchesShortcut) return true;

      const matchesTag =
        fileTagsLower.some(
          (t) =>
            t === cleanTok ||
            t === `grade ${cleanTok}` ||
            t === `sec ${cleanTok}` ||
            t.startsWith(cleanTok) ||
            (cleanTok.length >= 2 && t.includes(cleanTok))
        ) ||
        fileTagsShortLower.some(
          (t) =>
            t === cleanTok ||
            t.startsWith(cleanTok) ||
            (cleanTok.length >= 2 && t.includes(cleanTok))
        );
      if (matchesTag) return true;

      if (
        cleanTok.length >= 2 &&
        (fileDeptLower.includes(cleanTok) || fileDeptShortLower.includes(cleanTok))
      ) {
        return true;
      }

      const isGradeToken = /^\d+$/.test(cleanTok) || ['pf', 'bf', 'af'].includes(cleanTok);
      if (!isGradeToken) {
        const normTok = normalizeSpelling(cleanTok);
        if (
          rawFileNameLower.includes(cleanTok) ||
          fileNameLower.includes(normTok) ||
          uploaderLower.includes(cleanTok) ||
          extLower.includes(cleanTok)
        ) {
          return true;
        }
      }

      return false;
    });
  };

  // Student-safe anti-pornography & explicit content search blocker
  const isRestrictedAdultQuery = (rawQuery: string): boolean => {
    const q = (rawQuery || '').toLowerCase();
    return /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|escort\s*service|adult\s*video|hardcore\s*sex|casual\s*sex|hookup)\b/i.test(
      q
    );
  };

  const isSearchRestricted = isRestrictedAdultQuery(searchTerm);

  const filteredFiles = isSearchRestricted
    ? []
    : files.filter((f) => {
        if (!matchesSmartQuery(f, searchTerm)) return false;
        if (selectedTag === 'All') return true;
        if (selectedTag === 'Protected') return !f.is_passwordless;
        if (selectedTag === 'Public') return f.is_passwordless;

        const selLower = selectedTag.toLowerCase();
        const selShort = shortenTag(selectedTag).toLowerCase();

        return (
          (f.tags &&
            f.tags.some((t) => {
              const tLower = t.toLowerCase();
              const tShort = shortenTag(t).toLowerCase();
              return (
                tLower === selLower ||
                tShort === selLower ||
                tLower === selShort ||
                tShort === selShort
              );
            })) ||
          f.department.toLowerCase() === selLower ||
          shortenTag(f.department).toLowerCase() === selLower ||
          f.department.toLowerCase() === selShort ||
          shortenTag(f.department).toLowerCase() === selShort
        );
      });

  const isFiltering = searchTerm.trim().length > 0 || selectedTag !== 'All';

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
    <div className="w-full flex-1 flex flex-col min-h-0 font-sans">
      {/* ================= CONTROLS & REAL-TIME FILTERS CONTAINER ================= */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/90 shadow-xs px-5 py-3.5 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Repository</h1>
            <span className="bg-blue-50 text-blue-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-200/70 shadow-2xs">
              {isFiltering
                ? `${filteredFiles.length} of ${files.length} study files`
                : `${filteredFiles.length} ${filteredFiles.length === 1 ? 'study file' : 'study files'}`}
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTag('All');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Reset all active filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Real-Time Search Input + Symmetrical Grid/List View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center h-9">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by file name, #tag, or shortcut (s,6,a)..."
                aria-label="Filter repository files by name or tag in real time"
                className="h-9 w-64 sm:w-80 pl-8 pr-12 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd
                  onClick={() => searchInputRef.current?.focus()}
                  className="hidden sm:inline-flex items-center justify-center absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded-md cursor-text select-none"
                  title="Press / to filter"
                >
                  /
                </kbd>
              )}
            </div>

            <div className="h-9 p-1 bg-slate-100 rounded-xl border border-slate-200 inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-7 w-7 rounded-lg inline-flex items-center justify-center border transition-colors duration-150 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-700 border-slate-200/80 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
                title="Sticky Note Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`h-7 w-7 rounded-lg inline-flex items-center justify-center border transition-colors duration-150 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-700 border-slate-200/80 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
                title="Compact List View"
              >
                <List className="w-3.5 h-3.5 stroke-[2.2] shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag & Department Filter Bar */}
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Tags:</span>
          </span>
          <button
            onClick={() => setSelectedTag('All')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedTag === 'All'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            All
          </button>

          {filterPills.map((tag) => {
            const shortTag = shortenTag(tag);
            const isActive =
              selectedTag.toLowerCase() === tag.toLowerCase() ||
              selectedTag.toLowerCase() === shortTag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isActive ? 'All' : shortTag)}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                #{shortTag}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= STICKY NOTE GRID ================= */}
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
        <div className="text-center py-16 text-slate-500 text-xs space-y-3 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <span className="material-symbols-outlined text-[28px]">folder_open</span>
          </div>
          <p className="text-slate-900 font-bold text-sm">No notes pinned yet</p>
          <p className="text-slate-500">Pin your first study note or share a website link to get started.</p>
        </div>
      ) : filteredFiles.length === 0 && isFiltering ? (
        <div className="text-center py-16 text-slate-500 text-xs space-y-3 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <p className="text-slate-900 font-bold text-sm">No matching notes found</p>
          <p className="text-slate-500">
            No files match{' '}
            {searchTerm ? (
              <span className="font-bold text-slate-700">"{searchTerm}"</span>
            ) : null}
            {searchTerm && selectedTag !== 'All' ? ' in ' : ''}
            {selectedTag !== 'All' ? (
              <span className="font-bold text-blue-700">#{selectedTag}</span>
            ) : null}
            . Try another file name, tag, or shortcut (e.g. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">s,6,a</code>).
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTag('All');
            }}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-800 rounded-lg font-bold text-xs hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <main
          className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(154px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-3 xl:gap-x-3.5 2xl:gap-x-4 gap-y-4 xl:gap-y-4.5 2xl:gap-y-5 pt-3 pb-4 overflow-x-hidden"
        >
          {/* 1. Pin New Note Card */}
          {onOpenUpload && (
            <div
              onClick={onOpenUpload}
              className="sticky-card border-2 border-dashed border-blue-400 bg-white hover:bg-blue-50/60 flex flex-col items-center justify-center p-2.5 sm:p-3 lg:p-2.5 xl:p-3 2xl:p-3 text-center cursor-pointer group"
            >
              <SerratedFrostedTape />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-100 group-hover:bg-blue-200 text-blue-700 flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-110 shadow-2xs border border-blue-200/80">
                <span className="material-symbols-outlined text-[18px] sm:text-[19px] leading-none">note_add</span>
              </div>
              <p className="font-hand font-bold text-slate-950 text-[17px] sm:text-[18px] leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">
                Pin New Note
              </p>
              <p className="text-[9px] text-slate-600 font-medium max-w-[125px] leading-snug">
                Upload DOCX, XLSX, PPTX, PDF, images or links
              </p>
            </div>
          )}

          {/* 2. Colour-Switchable Sticky Note Cards (Sample Note Design & 10 Hex Colors + Serrated Top/Bottom Tape) */}
          {filteredFiles.map((file, index) => {
            const theme = getFileColorTheme(file);
            const isLink = !!file.is_link;
            const hoursLeft = calculateHoursLeft(file, index);

            const extLabel = file.file_extension
              ? file.file_extension.toUpperCase().replace(/^\./, '')
              : theme.badgeLabel;

            const displayTags =
              file.tags && file.tags.length > 0
                ? file.tags.slice(0, 3).map(shortenTag)
                : [shortenTag(file.department.replace(/\s+/g, ''))];

            const isMenuOpen = activeMenuId === file.id;

            return (
              <article
                key={file.id}
                data-color-hex={theme.hexCode}
                data-color-name={theme.swatchName}
                onClick={() => {
                  if (file.is_passwordless) {
                    openOrDownloadPublicFileDirectly(file);
                  } else {
                    onSelectFile(file, 'decrypt');
                  }
                }}
                className={`sticky-card ${theme.cardBg} ${
                  isMenuOpen ? 'z-40' : 'z-10'
                } flex flex-col justify-between p-2.5 sm:p-3 lg:p-2.5 xl:p-3 2xl:p-3 select-none group`}
              >
                {/* Realistic Frosted Adhesive Tape Strip with Custom Zigzag (Serrated) Cuts at Both Top and Bottom Edges */}
                <SerratedFrostedTape />

                {/* Top paper adhesive sheen */}
                <div className="adhesive-strip absolute top-0 left-0 right-0 h-[22%]" aria-hidden="true" />

                {/* Top Header Row: File Type Badge + 3-Dots Menu (z-30 so dropdown sits cleanly above title & tags) */}
                <div className="relative z-30 flex items-center justify-between gap-1 pt-0.5">
                  <span
                    className={`pl-1.5 pr-2 py-0.5 rounded-sm font-extrabold text-[9px] xl:text-[9.5px] 2xl:text-[9.5px] leading-none ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder} inline-flex items-center gap-1 shadow-2xs`}
                  >
                    <FileTypeCustomIcon iconKey={theme.iconKey} className="w-3 h-3 shrink-0" />
                    <span className="leading-none tracking-tight">{extLabel}</span>
                  </span>

                  <div className="flex items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : file.id);
                      }}
                      className="w-5 h-5 text-slate-900 hover:text-slate-950 transition-colors rounded-sm hover:bg-black/10 cursor-pointer relative inline-flex items-center justify-center -mr-0.5"
                      title="More options"
                    >
                      <span className="material-symbols-outlined text-[16px] leading-none">more_vert</span>
                    </button>
                  </div>

                  {/* Dropdown Menu: Admin gets all 4 options; Public & Users get ONLY Delete */}
                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-7 w-44 bg-white border border-slate-200/95 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5 text-left text-xs font-sans"
                    >
                      {isAdmin ? (
                        <>
                          {isLink ? (
                            <>
                              <button
                                onClick={(e) => {
                                   e.stopPropagation();
                                   setActiveMenuId(null);
                                   if (file.link_url) {
                                     openExternalUrlSafely(file.link_url);
                                   }
                                }}
                                className="w-full text-left px-2.5 py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-blue-600">open_in_new</span>
                                Open Website
                              </button>
                              <button
                                onClick={(e) => {
                                  setActiveMenuId(null);
                                  handleCopyLink(e, file);
                                }}
                                className="w-full text-left px-2.5 py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-blue-600">content_copy</span>
                                {copiedId === file.id ? 'Copied!' : 'Copy Link URL'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  if (file.is_passwordless) {
                                    openOrDownloadPublicFileDirectly(file);
                                  } else {
                                    onSelectFile(file, 'decrypt');
                                  }
                                }}
                                className="w-full text-left px-2.5 py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-blue-600">open_in_new</span>
                                Open in Browser
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  if (file.is_passwordless) {
                                    triggerMaskedFileDownload(
                                      file.id,
                                      'PWDLESS_PUBLIC',
                                      file.original_name
                                    );
                                  } else {
                                    onSelectFile(file, 'download');
                                  }
                                }}
                                className="w-full text-left px-2.5 py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-blue-600">download</span>
                                Download File
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              onSelectFile(file, 'details');
                            }}
                            className="w-full text-left px-2.5 py-1.5 font-semibold text-slate-900 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                            Technical Specs
                          </button>
                          <div className="h-px bg-slate-200 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              onSelectFile(file, 'delete');
                            }}
                            className="w-full text-left px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Purge Record
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(null);
                            onSelectFile(file, 'delete');
                          }}
                          className="w-full text-left px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Delete Note
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Sticky Note Center Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-start pt-2.5 sm:pt-3 xl:pt-3 min-h-0 overflow-hidden w-full">
                  <h3
                    className="text-[12px] sm:text-[12.5px] xl:text-[13px] 2xl:text-[13px] font-extrabold text-neutral-900 leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis block w-full tracking-tight mb-0.5"
                    title={fixMojibake(file.original_name)}
                  >
                    <HighlightedText text={file.original_name} query={searchTerm} />
                  </h3>

                  <p className="text-[9.5px] xl:text-[10px] 2xl:text-[10px] text-neutral-900/80 font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis block w-full">
                    {isLink ? (
                      <span>Web Link • {file.uploader_name || 'Campus Member'}</span>
                    ) : (
                      <span>{file.file_size_formatted} • {file.uploader_name || 'Campus Member'}</span>
                    )}
                  </p>
                </div>

                {/* Bottom Section: Non-Interactive #Tag Badges & Status Row */}
                <div className="relative z-10 w-full">
                  <div className="flex flex-wrap gap-1 mb-1.5 max-h-[34px] overflow-hidden pointer-events-none select-none">
                    {displayTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-[8.5px] xl:text-[9px] 2xl:text-[9px] font-extrabold px-1.5 xl:px-2 py-0.5 rounded-xs border cursor-default select-none shadow-2xs leading-none truncate max-w-[95px] xl:max-w-[105px] ${theme.tagBg} ${theme.tagText} ${theme.tagBorder}`}
                      >
                        #<HighlightedText text={tag} query={searchTerm} />
                      </span>
                    ))}
                  </div>

                  {/* Footer Row: Pixel-Aligned Protected (Shield-Lock) / Public (Globe-Check) Pill + Auto-Purge Countdown */}
                  <div className={`flex items-center justify-between gap-1 pt-1.5 border-t ${theme.divideBorder} w-full min-w-0`}>
                    {!file.is_passwordless ? (
                      <div
                        className="h-4.5 w-[68px] xl:w-[70px] bg-red-600 text-white font-extrabold text-[8.5px] xl:text-[9px] 2xl:text-[9.5px] leading-none rounded-full inline-flex items-center justify-center gap-1 shadow-xs shrink-0 select-none"
                        title="AES-256 PIN Protected"
                      >
                        <ProtectedShieldLockIcon className="w-3 h-3 shrink-0" />
                        <span className="leading-none">Protected</span>
                      </div>
                    ) : (
                      <div
                        className="h-4.5 w-[68px] xl:w-[70px] bg-emerald-600 text-white font-extrabold text-[8.5px] xl:text-[9px] 2xl:text-[9.5px] leading-none rounded-full inline-flex items-center justify-center gap-1 shadow-xs shrink-0 select-none"
                        title="Public Access - No PIN Required"
                      >
                        <PublicGlobeCheckIcon className="w-3 h-3 shrink-0" />
                        <span className="leading-none">Public</span>
                      </div>
                    )}

                    <div
                      className="text-[8.5px] xl:text-[9px] 2xl:text-[9.5px] font-extrabold text-slate-900 leading-none inline-flex items-center justify-end gap-1 shrink-0 ml-auto"
                      title="Auto-purges after 48h"
                    >
                      <Clock className="w-2.5 h-2.5 xl:w-2.5 xl:h-2.5 text-slate-900 shrink-0 stroke-[2.5]" />
                      <span className="leading-none whitespace-nowrap">{hoursLeft}h left</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </main>
      ) : (
        /* LIST VIEW */
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs mt-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Note / File Name</th>
                  <th className="py-3 px-4">Tags / Dept</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploader</th>
                  <th className="py-3 px-4">Access Level</th>
                  <th className="py-3 px-4">Purge Timer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFiles.map((file, idx) => {
                  const theme = getFileColorTheme(file);
                  const isLink = !!file.is_link;
                  const hoursLeft = calculateHoursLeft(file, idx);
                  const displayTags =
                    file.tags && file.tags.length > 0
                      ? file.tags.slice(0, 3).map(shortenTag)
                      : [shortenTag(file.department)];

                  return (
                    <tr
                      key={file.id}
                      onClick={() => {
                        if (file.is_passwordless) {
                          openOrDownloadPublicFileDirectly(file);
                        } else {
                          onSelectFile(file, 'decrypt');
                        }
                      }}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={`pl-1.5 pr-2.5 py-1 rounded-lg text-[10px] font-extrabold leading-none ${theme.cardBg} text-slate-950 border border-black/10 inline-flex items-center gap-1.5 shadow-2xs`}
                        >
                          <FileTypeCustomIcon iconKey={theme.iconKey} className="w-3 h-3" />
                          <span className="leading-none">
                            {(file.file_extension || theme.badgeLabel).toUpperCase().replace(/^\./, '')}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate group-hover:text-blue-700 transition-colors">
                        <HighlightedText text={file.original_name} query={searchTerm} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {displayTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-slate-100 text-slate-700 border-slate-200 cursor-default select-none shadow-2xs"
                            >
                              #<HighlightedText text={tag} query={searchTerm} />
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {isLink ? 'URL' : file.file_size_formatted}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{file.uploader_name || 'Campus Member'}</td>
                      <td className="py-3 px-4">
                        {!file.is_passwordless ? (
                          <span className="w-[86px] h-6 bg-red-600 text-white font-bold text-[10px] leading-none rounded-full inline-flex items-center justify-center gap-1.5 shadow-xs shrink-0 select-none">
                            <ProtectedShieldLockIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="leading-none">Protected</span>
                          </span>
                        ) : (
                          <span className="w-[86px] h-6 bg-emerald-600 text-white font-bold text-[10px] leading-none rounded-full inline-flex items-center justify-center gap-1.5 shadow-xs shrink-0 select-none">
                            <PublicGlobeCheckIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="leading-none">Public</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold text-[11px]">
                        <span className="inline-flex items-center gap-1 leading-none">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{hoursLeft}h left</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (file.is_passwordless) {
                              openOrDownloadPublicFileDirectly(file);
                            } else {
                              onSelectFile(file, 'decrypt');
                            }
                          }}
                          className="px-3 py-1 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-700 font-bold text-[11px] transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          {isLink ? 'Open' : 'Access'}
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
