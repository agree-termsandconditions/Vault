export interface VaultFile {
  id: number;
  file_uuid: string;
  batch_id: string;
  uploaded_by_emp_id: string;
  uploader_name: string;
  department: string;
  original_name: string;
  mime_type: string;
  file_extension: string;
  file_size: number;
  file_size_formatted: string;
  storage_path: string;
  encryption_salt: string;
  encryption_iv: string;
  is_passwordless: boolean;
  is_directory: boolean;
  item_count?: number;
  tags?: string[];
  download_count: number;
  is_deleted: boolean;
  expires_at: string;
  created_at: string;
  is_link?: boolean;
  link_url?: string;
  link_description?: string;
}

export interface DepartmentConfig {
  id: number;
  name: string;
  shortName?: string;
  shortcut: string;
  description: string;
}

export const DEFAULT_DEPARTMENTS: DepartmentConfig[] = [
  { id: 1, name: 'Science', shortName: 'Sci', shortcut: 's', description: 'Physics, Chemistry & Biology Faculty' },
  { id: 2, name: 'Social Science', shortName: 'SS', shortcut: 'ss', description: 'History, Geography, Civics & Economics' },
  { id: 3, name: 'Mathematics', shortName: 'Math', shortcut: 'm', description: 'Algebra, Geometry & Applied Mathematics' },
  { id: 4, name: 'Arts', shortName: 'Arts', shortcut: 'a', description: 'Fine Arts, Visual Arts, Music & Performing Arts' },
  { id: 5, name: 'Physical Education', shortName: 'PE', shortcut: 'pe', description: 'Sports, Athletics, Health & Fitness' },
  { id: 6, name: 'Kannada', shortName: 'Kan', shortcut: 'k', description: 'Kannada Language, Sahitya & Grammar' },
  { id: 7, name: 'English', shortName: 'Eng', shortcut: 'e', description: 'English Literature, Grammar & Communication' },
  { id: 8, name: 'IT', shortName: 'IT', shortcut: 'it', description: 'Information Technology & Computer Science' },
  { id: 9, name: 'Others', shortName: 'Others', shortcut: 'o', description: 'General Administration & Interdisciplinary' },
];

/**
 * Standardizes and shortens academic department tags for campus study notes:
 * - Mathematics -> Math
 * - Science -> Sci
 * - Physical Education -> PE
 * - Social Science -> SS
 * - Arts -> Arts
 * - IT -> IT
 * - Kannada -> Kan
 * - Others -> Others
 * - English -> Eng
 */
export function shortenTag(tag: string): string {
  if (!tag) return '';
  const trimmed = tag.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'mathematics' || lower === 'maths' || lower === 'math') return 'Math';
  if (lower === 'science' || lower === 'sci') return 'Sci';
  if (lower === 'physical education' || lower === 'physical edu' || lower === 'physical edu..' || lower === 'pe') return 'PE';
  if (lower === 'social science' || lower === 'social studies' || lower === 's sci' || lower === 's. sci' || lower === 'ss') return 'SS';
  if (lower === 'arts' || lower === 'art') return 'Arts';
  if (lower === 'it' || lower === 'information technology') return 'IT';
  if (lower === 'kannada' || lower === 'kannda' || lower === 'kan') return 'Kan';
  if (lower === 'others' || lower === 'other') return 'Others';
  if (lower === 'english' || lower === 'engilish' || lower === 'eng') return 'Eng';

  return trimmed;
}

/**
 * Automatically decodes UTF-8 strings that were misinterpreted as ISO-8859-1 (Latin-1)
 * e.g., "à®µà®¿à®Ÿà¯ à®¤à®²à¯ˆ" -> "விடுதலை"
 */
export function fixMojibake(text: string): string {
  if (!text || typeof text !== 'string') return '';
  if (/[\u00C0-\u00FF][\u0080-\u00BF]/.test(text)) {
    try {
      const bytes = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i) & 0xff;
      }
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (!decoded.includes('\ufffd') && decoded.length > 0) {
        return decoded;
      }
    } catch {}
  }
  return text;
}

export interface Employee {
  id: number;
  emp_id: string;
  full_name: string;
  department: string;
  email: string;
  designation: string;
  user_type: "regular" | "superuser" | "admin" | "master_admin";
  is_admin?: boolean;
  is_master_admin?: boolean;
  passwordless_allowed: boolean;
  printer_access_allowed: boolean;
  password?: string;
  quick_pin?: string;
  is_activated?: boolean;
  must_change_password?: boolean;
  last_password_reset?: string;
  reset_request_status?: "none" | "pending" | "token_issued";
  active_reset_token?: string;
  reset_token_expires_at?: string;
  is_active: boolean;
}

export interface PasswordResetRequest {
  id: number;
  emp_id: string;
  full_name: string;
  department: string;
  email: string;
  reason: string;
  status: "pending" | "token_issued" | "completed" | "rejected";
  reset_token?: string;
  token_expires_at?: string;
  issued_by?: string;
  requested_at: string;
  completed_at?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  emp_id: string;
  file_name: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  details: string;
  created_at: string;
}

export interface AllowedExt {
  id: number;
  extension: string;
  mime_type: string;
  category: string;
  is_allowed: boolean;
}
