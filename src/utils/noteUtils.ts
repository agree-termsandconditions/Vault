import { VaultFile, DepartmentConfig, DEFAULT_DEPARTMENTS, shortenTag, fixMojibake } from '../types';

export interface ColorTheme {
  key: string;
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

// 10 Exact Stitch Sticky Note Colors:
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
export const PASTEL_THEMES: Record<string, ColorTheme> = {
  doc: {
    key: 'doc',
    typeLabel: 'Word Document (.doc / .docx)',
    badgeLabel: 'DOCX',
    swatchName: 'Sky Blue',
    hexCode: '#66B2FF',
    iconKey: 'doc',
    cardBg: 'bg-[#66B2FF]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#66B2FF]/35',
    iconColor: 'text-blue-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  xls: {
    key: 'xls',
    typeLabel: 'Excel Spreadsheet (.xls / .xlsx)',
    badgeLabel: 'XLSX',
    swatchName: 'Mint Green',
    hexCode: '#8EE2A1',
    iconKey: 'xls',
    cardBg: 'bg-[#8EE2A1]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#8EE2A1]/35',
    iconColor: 'text-emerald-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  ppt: {
    key: 'ppt',
    typeLabel: 'Presentation (.ppt / .pptx)',
    badgeLabel: 'PPTX',
    swatchName: 'Warm Apricot',
    hexCode: '#FFB366',
    iconKey: 'ppt',
    cardBg: 'bg-[#FFB366]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFB366]/35',
    iconColor: 'text-orange-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  txt: {
    key: 'txt',
    typeLabel: 'Text Study Note (.txt / .md)',
    badgeLabel: 'NOTE',
    swatchName: 'Canary Yellow',
    hexCode: '#FFF066',
    iconKey: 'txt',
    cardBg: 'bg-[#FFF066]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFF066]/50',
    iconColor: 'text-amber-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  pdf: {
    key: 'pdf',
    typeLabel: 'PDF Document (.pdf)',
    badgeLabel: 'PDF',
    swatchName: 'Coral Pink',
    hexCode: '#FF9A8D',
    iconKey: 'pdf',
    cardBg: 'bg-[#FF9A8D]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FF9A8D]/35',
    iconColor: 'text-rose-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  png: {
    key: 'png',
    typeLabel: 'PNG Graphic (.png)',
    badgeLabel: 'PNG',
    swatchName: 'Rose Pink',
    hexCode: '#FFAFCC',
    iconKey: 'png',
    cardBg: 'bg-[#FFAFCC]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFAFCC]/35',
    iconColor: 'text-fuchsia-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  jpg: {
    key: 'jpg',
    typeLabel: 'JPG Photo (.jpg)',
    badgeLabel: 'JPG',
    swatchName: 'Golden Marigold',
    hexCode: '#FFCA58',
    iconKey: 'jpg',
    cardBg: 'bg-[#FFCA58]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#FFCA58]/35',
    iconColor: 'text-amber-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  jpeg: {
    key: 'jpeg',
    typeLabel: 'JPEG Image (.jpeg)',
    badgeLabel: 'JPEG',
    swatchName: 'Lilac Purple',
    hexCode: '#CBB2FE',
    iconKey: 'jpeg',
    cardBg: 'bg-[#CBB2FE]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#CBB2FE]/35',
    iconColor: 'text-purple-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  dir: {
    key: 'dir',
    typeLabel: 'Directory Archive (.dir)',
    badgeLabel: 'DIR',
    swatchName: 'Aqua Teal',
    hexCode: '#5CE1E6',
    iconKey: 'dir',
    cardBg: 'bg-[#5CE1E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#5CE1E6]/35',
    iconColor: 'text-cyan-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  enc: {
    key: 'enc',
    typeLabel: 'Security Key / Encrypted (.enc / .pem)',
    badgeLabel: 'ENC',
    swatchName: 'Soft Grey',
    hexCode: '#E1E4E6',
    iconKey: 'enc',
    cardBg: 'bg-[#E1E4E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-slate-300/60',
    iconColor: 'text-slate-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
  link: {
    key: 'link',
    typeLabel: 'Shared Web Link (URL)',
    badgeLabel: 'LINK',
    swatchName: 'Aqua Teal',
    hexCode: '#5CE1E6',
    iconKey: 'link',
    cardBg: 'bg-[#5CE1E6]',
    headerStripBg: 'bg-black/[0.035]',
    borderClass: 'border border-black/10',
    badgeBg: 'bg-white/92',
    badgeText: 'text-slate-950',
    badgeBorder: 'border-black/15',
    iconBoxBg: 'bg-[#5CE1E6]/35',
    iconColor: 'text-cyan-900',
    tagBg: 'bg-white/85',
    tagText: 'text-slate-950',
    tagBorder: 'border-black/12',
    divideBorder: 'border-slate-950/15',
  },
};

export interface StitchColorSwatch {
  id: string;
  name: string;
  hex: string;
  cardBg: string;
  themeKey: string;
}

export const STITCH_NOTE_SWATCHES: StitchColorSwatch[] = [
  { id: 'yellow', name: 'Canary Yellow', hex: '#FFF066', cardBg: 'bg-[#FFF066]', themeKey: 'txt' },
  { id: 'coral', name: 'Coral Pink', hex: '#FF9A8D', cardBg: 'bg-[#FF9A8D]', themeKey: 'pdf' },
  { id: 'sky', name: 'Sky Blue', hex: '#66B2FF', cardBg: 'bg-[#66B2FF]', themeKey: 'doc' },
  { id: 'mint', name: 'Mint Green', hex: '#8EE2A1', cardBg: 'bg-[#8EE2A1]', themeKey: 'xls' },
  { id: 'apricot', name: 'Warm Apricot', hex: '#FFB366', cardBg: 'bg-[#FFB366]', themeKey: 'ppt' },
  { id: 'gold', name: 'Golden Marigold', hex: '#FFCA58', cardBg: 'bg-[#FFCA58]', themeKey: 'jpg' },
  { id: 'pink', name: 'Rose Pink', hex: '#FFAFCC', cardBg: 'bg-[#FFAFCC]', themeKey: 'png' },
  { id: 'lilac', name: 'Lilac Purple', hex: '#CBB2FE', cardBg: 'bg-[#CBB2FE]', themeKey: 'jpeg' },
  { id: 'aqua', name: 'Aqua Teal', hex: '#5CE1E6', cardBg: 'bg-[#5CE1E6]', themeKey: 'dir' },
  { id: 'grey', name: 'Soft Grey', hex: '#E1E4E6', cardBg: 'bg-[#E1E4E6]', themeKey: 'enc' },
];

export function getFileColorTheme(file: VaultFile): ColorTheme {
  // First resolve base theme for iconKey and badgeLabel
  const ext = (file.file_extension || '').toLowerCase().replace(/^\./, '').trim();
  const mime = (file.mime_type || '').toLowerCase();
  const name = (file.original_name || '').toLowerCase();

  let baseTheme: ColorTheme = PASTEL_THEMES.doc;

  if (file.is_link || ext === 'link' || ext === 'url' || ext === 'web' || mime === 'text/uri-list') {
    baseTheme = PASTEL_THEMES.link;
  } else if (
    ext === 'doc' ||
    ext === 'docx' ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    baseTheme = PASTEL_THEMES.doc;
  } else if (
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv' ||
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  ) {
    baseTheme = PASTEL_THEMES.xls;
  } else if (
    ext === 'ppt' ||
    ext === 'pptx' ||
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  ) {
    baseTheme = PASTEL_THEMES.ppt;
  } else if (
    ext === 'txt' ||
    ext === 'text' ||
    ext === 'log' ||
    ext === 'rtf' ||
    ext === 'md' ||
    ext === 'note' ||
    mime === 'text/plain' ||
    name.endsWith('.txt') ||
    name.endsWith('.md')
  ) {
    baseTheme = PASTEL_THEMES.txt;
  } else if (ext === 'pdf' || mime.includes('pdf') || name.endsWith('.pdf')) {
    baseTheme = PASTEL_THEMES.pdf;
  } else if (ext === 'png' || name.endsWith('.png')) {
    baseTheme = PASTEL_THEMES.png;
  } else if (ext === 'jpg' || name.endsWith('.jpg')) {
    baseTheme = PASTEL_THEMES.jpg;
  } else if (ext === 'jpeg' || name.endsWith('.jpeg')) {
    baseTheme = PASTEL_THEMES.jpeg;
  } else if (ext === 'dir' || file.is_directory) {
    baseTheme = PASTEL_THEMES.dir;
  } else if (['enc', 'pem', 'key', 'cer', 'crt', 'vault'].includes(ext)) {
    baseTheme = PASTEL_THEMES.enc;
  }

  // If user selected a custom Stitch note color swatch, apply its surface color while keeping the file's iconKey
  if (file.custom_color) {
    const cleanColor = file.custom_color.trim().toUpperCase();
    const matchedSwatch = STITCH_NOTE_SWATCHES.find(
      (s) => s.hex.toUpperCase() === cleanColor || s.id.toUpperCase() === cleanColor
    );
    if (matchedSwatch && PASTEL_THEMES[matchedSwatch.themeKey]) {
      const colorTheme = PASTEL_THEMES[matchedSwatch.themeKey];
      return {
        ...baseTheme,
        swatchName: colorTheme.swatchName,
        hexCode: colorTheme.hexCode,
        cardBg: colorTheme.cardBg,
        iconBoxBg: colorTheme.iconBoxBg,
      };
    }
  }

  return baseTheme;
}

export function normalizeSpelling(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/anotomy/g, 'anatomy');
}

export function isRestrictedAdultQuery(rawQuery: string): boolean {
  const q = (rawQuery || '').toLowerCase();
  return /\b(porn|pornography|pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|stripchat|camgirl|nsfw|xxx|hentai|rule34|erotic|erotica|nude|nudes|nudity|sex\s*tape|sex\s*video|blowjob|handjob|orgasm|masturbat|fetish|bdsm|incest|escort\s*service|adult\s*video|hardcore\s*sex|casual\s*sex|hookup)\b/i.test(
    q
  );
}

export function matchesSmartQuery(
  file: VaultFile,
  rawQuery: string,
  departments: DepartmentConfig[] = DEFAULT_DEPARTMENTS
): boolean {
  const q = (rawQuery || '').trim().toLowerCase();
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
}

export interface FilterVaultOptions {
  searchTerm: string;
  selectedTag: string;
  selectedColorHex?: string;
  accessFilter?: 'all' | 'public' | 'protected';
  departments?: DepartmentConfig[];
}

export function filterVaultFiles(
  files: VaultFile[],
  options: FilterVaultOptions
): VaultFile[] {
  const {
    searchTerm = '',
    selectedTag = 'All',
    selectedColorHex = 'All',
    accessFilter = 'all',
    departments = DEFAULT_DEPARTMENTS,
  } = options;

  if (isRestrictedAdultQuery(searchTerm)) {
    return [];
  }

  return files.filter((f) => {
    if (!matchesSmartQuery(f, searchTerm, departments)) return false;

    if (accessFilter === 'public' && !f.is_passwordless) return false;
    if (accessFilter === 'protected' && f.is_passwordless) return false;

    if (selectedColorHex && selectedColorHex !== 'All') {
      const theme = getFileColorTheme(f);
      if (theme.hexCode.toUpperCase() !== selectedColorHex.toUpperCase()) {
        return false;
      }
    }

    if (selectedTag === 'All') return true;
    if (selectedTag === 'Protected') return !f.is_passwordless;
    if (selectedTag === 'Public') return f.is_passwordless;

    const selLower = selectedTag.toLowerCase().replace(/^#/, '');
    const selShort = shortenTag(selectedTag).toLowerCase();

    return (
      (f.tags &&
        f.tags.some((t) => {
          const tLower = t.toLowerCase().replace(/^#/, '');
          const tShort = shortenTag(t).toLowerCase();
          return (
            tLower === selLower ||
            tShort === selLower ||
            tLower === selShort ||
            tShort === selShort
          );
        })) ||
      (f.department || '').toLowerCase() === selLower ||
      shortenTag(f.department || '').toLowerCase() === selLower ||
      (f.department || '').toLowerCase() === selShort ||
      shortenTag(f.department || '').toLowerCase() === selShort
    );
  });
}

export interface TagFacetSummary {
  departmentCounts: Record<string, number>;
  customTopicTags: { tag: string; count: number }[];
  gradeTags: { grade: string; count: number }[];
  publicCount: number;
  protectedCount: number;
}

export function extractTagFacets(
  files: VaultFile[],
  departments: DepartmentConfig[] = DEFAULT_DEPARTMENTS
): TagFacetSummary {
  const departmentCounts: Record<string, number> = {};
  const topicCounter = new Map<string, number>();
  const gradeCounter = new Map<string, number>();
  let publicCount = 0;
  let protectedCount = 0;

  const deptShortSet = new Set(departments.map((d) => shortenTag(d.name).toLowerCase()));
  const deptNameSet = new Set(departments.map((d) => d.name.toLowerCase()));
  const gradeOptionSet = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'pf', 'bf', 'af']);
  const sectionOptionSet = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g']);

  for (const d of departments) {
    departmentCounts[shortenTag(d.name)] = 0;
  }

  for (const file of files) {
    if (file.is_passwordless) publicCount++;
    else protectedCount++;

    const deptShort = shortenTag(file.department || '');
    if (deptShort) {
      departmentCounts[deptShort] = (departmentCounts[deptShort] || 0) + 1;
    }

    for (const rawTag of file.tags || []) {
      const clean = shortenTag(rawTag);
      if (!clean) continue;
      const lower = clean.toLowerCase();

      if (deptShortSet.has(lower) || deptNameSet.has(lower)) {
        // Counted via department
        continue;
      }
      if (gradeOptionSet.has(lower)) {
        const gKey = clean.toUpperCase();
        gradeCounter.set(gKey, (gradeCounter.get(gKey) || 0) + 1);
      } else if (!sectionOptionSet.has(lower)) {
        topicCounter.set(clean, (topicCounter.get(clean) || 0) + 1);
      }
    }
  }

  const customTopicTags = Array.from(topicCounter.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const gradeTags = Array.from(gradeCounter.entries())
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const numA = parseInt(a.grade, 10);
      const numB = parseInt(b.grade, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.grade.localeCompare(b.grade);
    });

  return {
    departmentCounts,
    customTopicTags,
    gradeTags,
    publicCount,
    protectedCount,
  };
}

export function calculateHoursLeft(file: VaultFile, index: number = 0): number {
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
}

/**
 * Strips the file extension from a file name or note title for display purposes.
 * Leaves web links / URLs untouched.
 * Examples:
 * - "foxxy-christmas.png" -> "foxxy-christmas"
 * - "Human_Body_Anatomy.pdf" -> "Human Body Anatomy"
 * - "CS301_Data_Structures.txt" -> "CS301 Data Structures"
 */
export function stripFileExtension(fileName: string, isLink?: boolean, fileExtension?: string): string {
  if (!fileName) return '';
  if (isLink) return fileName;

  let cleaned = fixMojibake(fileName);

  // If a specific fileExtension is known (e.g. '.png' or 'png'), strip that specific extension
  if (fileExtension) {
    const normExt = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`;
    const extRegex = new RegExp(`${normExt.replace('.', '\\.')}$`, 'i');
    if (extRegex.test(cleaned)) {
      cleaned = cleaned.replace(extRegex, '');
    }
  }

  // Strip standard trailing file extensions (.png, .txt, .pdf, .docx, .pptx, .xlsx, .jpg, etc.)
  cleaned = cleaned.replace(/\.[a-zA-Z0-9]{1,8}$/i, '');

  return cleaned.trim();
}

/**
 * Formats a file or note name for clean display on sticky note cards and lists:
 * - Strips file extension
 * - Converts underscores to spaces
 */
export function getDisplayNoteTitle(fileName: string, isLink?: boolean, fileExtension?: string): string {
  if (!fileName) return '';
  if (isLink) return fileName;

  const withoutExt = stripFileExtension(fileName, isLink, fileExtension);
  return withoutExt.replace(/_/g, ' ').trim();
}

export interface NoteTitleFontInfo {
  fontFamily: string;
  className: string;
  language: 'english' | 'hindi' | 'other';
  fontSizeClass: string;
}

/**
 * Returns language-specific font styling for note titles:
 * - English: Caveat (handwriting font)
 * - Hindi: Kalam / Kamal (Devanagari handwriting font)
 * - Other languages (Kannada, Tamil, Telugu, etc.): Noto Sans
 *
 * ONLY the file / note name font changes; other elements retain standard sans fonts.
 */
export function getNoteTitleFontInfo(title: string, tags?: string[]): NoteTitleFontInfo {
  const cleanTitle = title || '';
  const tagList = (tags || []).map((t) => t.replace(/^#+/, '').trim().toLowerCase());

  // 1. Hindi: Contains Devanagari Unicode characters (U+0900 to U+097F) or has Hindi tag
  const isHindiScript = /[\u0900-\u097F]/.test(cleanTitle);
  const isHindiTag = tagList.some((t) => t === 'hindi' || t === 'hin');
  if (isHindiScript || isHindiTag) {
    return {
      fontFamily: "'Kalam', 'Kamal', cursive, sans-serif",
      className: 'font-title-hindi font-bold',
      language: 'hindi',
      fontSizeClass: 'text-[16.5px] sm:text-[17.5px] min-[1025px]:text-[19px] xl:text-[21px]',
    };
  }

  // 2. Other languages: Contains non-Latin script characters (Kannada \u0C80-\u0CFF, Tamil \u0B80-\u0BFF, Telugu \u0C00-\u0C7F, etc.)
  // or has tags for other language subjects (#Kan, #Kannada, #Tamil, #Telugu, #Sanskrit, etc.)
  const isOtherScript = /[\u0400-\u04FF\u0600-\u06FF\u0980-\u0DFF\u3000-\u9FFF\uAC00-\uD7AF]/.test(cleanTitle);
  const isOtherLanguageTag = tagList.some((t) =>
    ['kan', 'kannada', 'tamil', 'tam', 'telugu', 'tel', 'malayalam', 'mal', 'sanskrit', 'san', 'french', 'german', 'spanish'].includes(t)
  );
  if (isOtherScript || isOtherLanguageTag) {
    return {
      fontFamily: "'Noto Sans', 'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', sans-serif",
      className: 'font-title-other font-bold',
      language: 'other',
      fontSizeClass: 'text-[14px] sm:text-[14.5px] min-[1025px]:text-[15px] xl:text-[16px]',
    };
  }

  // 3. English / Latin script: Caveat (significantly enlarged for mobile and large screens for bold, prominent handwriting appearance)
  return {
    fontFamily: "'Caveat', cursive, sans-serif",
    className: 'font-title-english font-bold',
    language: 'english',
    fontSizeClass: 'text-[17px] min-[400px]:text-[18px] sm:text-[19px] min-[1025px]:text-[23px] xl:text-[25px]',
  };
}
