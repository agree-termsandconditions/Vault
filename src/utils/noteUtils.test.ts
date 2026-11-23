import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFileColorTheme,
  matchesSmartQuery,
  filterVaultFiles,
  extractTagFacets,
  STITCH_NOTE_SWATCHES,
  stripFileExtension,
  getDisplayNoteTitle,
  getNoteTitleFontInfo,
} from './noteUtils';
import { shortenTag, VaultFile, DEFAULT_DEPARTMENTS } from '../types';

const mockFiles: VaultFile[] = [
  {
    id: 1,
    file_uuid: 'uuid-1',
    batch_id: 'BATCH-1',
    uploaded_by_emp_id: 'EMP-1001',
    uploader_name: 'Dr. Meera Nair',
    department: 'Science',
    original_name: 'Human_Body_Anatomy_Grade6.pdf',
    mime_type: 'application/pdf',
    file_extension: 'PDF',
    file_size: 245000,
    file_size_formatted: '240.0 KB',
    storage_path: '/tmp/1.enc',
    encryption_salt: 'salt',
    encryption_iv: 'iv',
    is_passwordless: true,
    is_directory: false,
    tags: ['Sci', '6', 'A', 'Anatomy'],
    download_count: 4,
    is_deleted: false,
    expires_at: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    file_uuid: 'uuid-2',
    batch_id: 'BATCH-2',
    uploaded_by_emp_id: 'EMP-1002',
    uploader_name: 'Prof. Rajesh Sharma',
    department: 'Mathematics',
    original_name: 'Algebra_Geometry_Workbook_G7.xlsx',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    file_extension: 'XLSX',
    file_size: 180000,
    file_size_formatted: '175.8 KB',
    storage_path: '/tmp/2.enc',
    encryption_salt: 'salt',
    encryption_iv: 'iv',
    is_passwordless: false,
    is_directory: false,
    tags: ['Math', '7', 'B', 'Formula'],
    download_count: 9,
    is_deleted: false,
    expires_at: new Date(Date.now() + 44 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    file_uuid: 'uuid-3',
    batch_id: 'BATCH-3',
    uploaded_by_emp_id: 'EMP-1001',
    uploader_name: 'Akish',
    department: 'IT',
    original_name: 'CS301_Data_Structures_QuickNote.txt',
    mime_type: 'text/plain',
    file_extension: 'TXT',
    file_size: 12400,
    file_size_formatted: '12.1 KB',
    storage_path: '/tmp/3.enc',
    encryption_salt: 'salt',
    encryption_iv: 'iv',
    is_passwordless: true,
    is_directory: false,
    tags: ['IT', '8', 'A', 'Exam'],
    custom_color: '#CBB2FE',
    download_count: 12,
    is_deleted: false,
    expires_at: new Date(Date.now() + 47 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

test('shortenTag standardizes academic department names', () => {
  assert.equal(shortenTag('Mathematics'), 'Math');
  assert.equal(shortenTag('#Science'), 'Sci');
  assert.equal(shortenTag('Social Science'), 'SS');
  assert.equal(shortenTag('Physical Education'), 'PE');
  assert.equal(shortenTag('Kannada'), 'Kan');
  assert.equal(shortenTag('Information Technology'), 'IT');
});

test('getFileColorTheme maps file extensions and custom Stitch colors accurately', () => {
  assert.equal(STITCH_NOTE_SWATCHES.length, 10);
  const pdfTheme = getFileColorTheme(mockFiles[0]);
  assert.equal(pdfTheme.hexCode, '#FF9A8D');
  assert.equal(pdfTheme.swatchName, 'Coral Pink');

  const xlsTheme = getFileColorTheme(mockFiles[1]);
  assert.equal(xlsTheme.hexCode, '#8EE2A1');
  assert.equal(xlsTheme.swatchName, 'Mint Green');

  // File 3 has custom_color '#CBB2FE' (Lilac Purple)
  const customTheme = getFileColorTheme(mockFiles[2]);
  assert.equal(customTheme.hexCode, '#CBB2FE');
  assert.equal(customTheme.swatchName, 'Lilac Purple');
  assert.equal(customTheme.iconKey, 'txt');
});

test('matchesSmartQuery supports multi-token shortcuts like s,6,a and typo tolerance', () => {
  assert.equal(matchesSmartQuery(mockFiles[0], 's,6,a', DEFAULT_DEPARTMENTS), true);
  assert.equal(matchesSmartQuery(mockFiles[0], 's 6 a', DEFAULT_DEPARTMENTS), true);
  assert.equal(matchesSmartQuery(mockFiles[0], 'anotomy', DEFAULT_DEPARTMENTS), true);
  assert.equal(matchesSmartQuery(mockFiles[1], 's,6,a', DEFAULT_DEPARTMENTS), false);
  assert.equal(matchesSmartQuery(mockFiles[1], 'm,7,b', DEFAULT_DEPARTMENTS), true);
});

test('filterVaultFiles filters by tag, access mode, and Stitch note color', () => {
  const sciOnly = filterVaultFiles(mockFiles, {
    searchTerm: '',
    selectedTag: 'Sci',
  });
  assert.equal(sciOnly.length, 1);
  assert.equal(sciOnly[0].id, 1);

  const protectedOnly = filterVaultFiles(mockFiles, {
    searchTerm: '',
    selectedTag: 'All',
    accessFilter: 'protected',
  });
  assert.equal(protectedOnly.length, 1);
  assert.equal(protectedOnly[0].id, 2);

  const lilacOnly = filterVaultFiles(mockFiles, {
    searchTerm: '',
    selectedTag: 'All',
    selectedColorHex: '#CBB2FE',
  });
  assert.equal(lilacOnly.length, 1);
  assert.equal(lilacOnly[0].id, 3);
});

test('extractTagFacets computes department, grade, and topic tag counts', () => {
  const facets = extractTagFacets(mockFiles, DEFAULT_DEPARTMENTS);
  assert.equal(facets.departmentCounts['Sci'], 1);
  assert.equal(facets.departmentCounts['Math'], 1);
  assert.equal(facets.departmentCounts['IT'], 1);
  assert.equal(facets.publicCount, 2);
  assert.equal(facets.protectedCount, 1);
  assert.equal(facets.gradeTags.length, 3);
  assert.equal(facets.customTopicTags.some((t) => t.tag === 'Exam' && t.count === 1), true);
});

test('stripFileExtension and getDisplayNoteTitle strip extensions and format titles cleanly', () => {
  assert.equal(stripFileExtension('foxxy-christmas.png'), 'foxxy-christmas');
  assert.equal(stripFileExtension('Human_Body_Anatomy_Grade6.pdf'), 'Human_Body_Anatomy_Grade6');
  assert.equal(stripFileExtension('CS301_Data_Structures_QuickNote.txt'), 'CS301_Data_Structures_QuickNote');
  assert.equal(stripFileExtension('presentation.pptx'), 'presentation');
  assert.equal(stripFileExtension('workbook.xlsx'), 'workbook');
  assert.equal(stripFileExtension('photo.jpg'), 'photo');
  assert.equal(stripFileExtension('note_without_ext'), 'note_without_ext');

  // getDisplayNoteTitle converts underscores to spaces
  assert.equal(getDisplayNoteTitle('foxxy-christmas.png'), 'foxxy-christmas');
  assert.equal(getDisplayNoteTitle('Human_Body_Anatomy_Grade6.pdf'), 'Human Body Anatomy Grade6');
  assert.equal(getDisplayNoteTitle('CS301_Data_Structures_QuickNote.txt'), 'CS301 Data Structures QuickNote');

  // Web links retain their URL
  assert.equal(getDisplayNoteTitle('https://en.wikipedia.org/wiki/React', true), 'https://en.wikipedia.org/wiki/React');
});

test('getNoteTitleFontInfo accurately assigns fonts for English, Hindi, and other languages', () => {
  // English -> Caveat
  const enInfo1 = getNoteTitleFontInfo('foxxy-christmas');
  assert.equal(enInfo1.language, 'english');
  assert.match(enInfo1.fontFamily, /Caveat/);

  const enInfo2 = getNoteTitleFontInfo('Human Body Anatomy Grade6', ['Sci', '6', 'A']);
  assert.equal(enInfo2.language, 'english');
  assert.match(enInfo2.fontFamily, /Caveat/);

  // Hindi -> Kalam / Kamal
  const hiInfo1 = getNoteTitleFontInfo('हिंदी व्याकरण और साहित्य');
  assert.equal(hiInfo1.language, 'hindi');
  assert.match(hiInfo1.fontFamily, /Kalam/);

  const hiInfo2 = getNoteTitleFontInfo('Hindi Literature Notes', ['Hin', '7', 'A']);
  assert.equal(hiInfo2.language, 'hindi');
  assert.match(hiInfo2.fontFamily, /Kalam/);

  // Other languages (Kannada, Tamil, etc.) -> Noto Sans
  const knInfo1 = getNoteTitleFontInfo('ಕನ್ನಡ ವ್ಯಾಕರಣ');
  assert.equal(knInfo1.language, 'other');
  assert.match(knInfo1.fontFamily, /Noto Sans/);

  const knInfo2 = getNoteTitleFontInfo('Kannada Vyakarana Sahitya', ['Kan', '6', 'B']);
  assert.equal(knInfo2.language, 'other');
  assert.match(knInfo2.fontFamily, /Noto Sans/);
});
