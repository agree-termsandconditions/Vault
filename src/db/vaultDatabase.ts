import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SiteTheme } from '../types';
import { WINTER_WONDERLAND_THEME } from '../theme/defaultTheme';

export interface DbUserRecord {
  id: number;
  emp_id: string;
  full_name: string;
  department: string;
  email: string;
  designation: string;
  user_type: 'regular' | 'superuser' | 'admin' | 'master_admin';
  is_admin: boolean;
  is_master_admin: boolean;
  passwordless_allowed: boolean;
  printer_access_allowed: boolean;
  password_hash: string;
  password_salt: string;
  quick_pin_hash: string;
  quick_pin_salt: string;
  is_activated: boolean;
  must_change_password: boolean;
  last_password_reset: string;
  reset_request_status: 'none' | 'pending' | 'token_issued';
  active_reset_token: string;
  reset_token_expires_at: string;
  first_login_token?: string;
  is_active: boolean;
}

export interface DbUploadHistoryRecord {
  id: number;
  file_id: number;
  file_uuid: string;
  batch_id: string;
  original_name: string;
  file_extension: string;
  file_size: number;
  file_size_formatted: string;
  department: string;
  tags: string[];
  uploaded_by_emp_id: string;
  uploader_name: string;
  access_mode: 'Public' | 'PIN Protected';
  upload_type: 'Document' | 'Quick Note' | 'Web Link' | 'Directory';
  status: 'ACTIVE' | 'DELETED' | 'EXPIRED';
  uploaded_at: string;
}

const DB_DIR = path.join(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const SQLITE_DB_PATH = path.join(DB_DIR, 'vault.sqlite');
export const SHARED_USERS_JSON_PATH = path.join(DB_DIR, 'users_db.json');
export const FULL_DB_JSON_PATH = path.join(DB_DIR, 'vault_shared_db.json');

const db = new DatabaseSync(SQLITE_DB_PATH);

// Initialize SQLite Relational Schema for Users, Files, File Upload History, Audit Logs & Sessions
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    emp_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT NOT NULL,
    designation TEXT NOT NULL,
    user_type TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_master_admin INTEGER NOT NULL DEFAULT 0,
    passwordless_allowed INTEGER NOT NULL DEFAULT 0,
    printer_access_allowed INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    quick_pin_hash TEXT NOT NULL DEFAULT '',
    quick_pin_salt TEXT NOT NULL DEFAULT '',
    is_activated INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    last_password_reset TEXT NOT NULL DEFAULT '',
    reset_request_status TEXT NOT NULL DEFAULT 'none',
    active_reset_token TEXT NOT NULL DEFAULT '',
    reset_token_expires_at TEXT NOT NULL DEFAULT '',
    first_login_token TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    file_uuid TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    uploaded_by_emp_id TEXT NOT NULL,
    uploader_name TEXT NOT NULL,
    department TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_extension TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    file_size_formatted TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    encryption_salt TEXT NOT NULL DEFAULT '',
    encryption_iv TEXT NOT NULL DEFAULT '',
    encryption_pin TEXT NOT NULL DEFAULT 'PWDLESS_PUBLIC',
    is_passwordless INTEGER NOT NULL DEFAULT 1,
    is_directory INTEGER NOT NULL DEFAULT 0,
    item_count INTEGER NOT NULL DEFAULT 0,
    tags_json TEXT NOT NULL DEFAULT '[]',
    custom_color TEXT NOT NULL DEFAULT '',
    download_count INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at TEXT NOT NULL DEFAULT '',
    deleted_by TEXT NOT NULL DEFAULT '',
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_link INTEGER NOT NULL DEFAULT 0,
    link_url TEXT NOT NULL DEFAULT '',
    link_description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS file_upload_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    file_uuid TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_extension TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    file_size_formatted TEXT NOT NULL,
    department TEXT NOT NULL,
    tags_json TEXT NOT NULL DEFAULT '[]',
    uploaded_by_emp_id TEXT NOT NULL,
    uploader_name TEXT NOT NULL,
    access_mode TEXT NOT NULL,
    upload_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    uploaded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    emp_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    emp_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_master_admin INTEGER NOT NULL DEFAULT 0,
    is_superuser INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kv_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Safe schema migrations for deleted_at and deleted_by
try { db.exec("ALTER TABLE files ADD COLUMN deleted_at TEXT NOT NULL DEFAULT ''"); } catch (_e) {}
try { db.exec("ALTER TABLE files ADD COLUMN deleted_by TEXT NOT NULL DEFAULT ''"); } catch (_e) {}

export function getOrCreateHmacSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 32) {
    return process.env.SESSION_SECRET.trim();
  }
  const row = db.prepare(`SELECT value FROM kv_meta WHERE key = 'hmac_secret'`).get() as { value?: string } | undefined;
  if (row && row.value) return row.value;
  const secret = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('hmac_secret', ?)`).run(secret);
  return secret;
}

export function syncUsersFromDb(seedUsers: DbUserRecord[]): DbUserRecord[] {
  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM users`).get() as { cnt: number };
  if (!countRow || countRow.cnt === 0) {
    saveUsersToDb(seedUsers);
    return seedUsers;
  }

  const rows = db.prepare(`SELECT * FROM users ORDER BY id ASC`).all() as any[];
  const loaded: DbUserRecord[] = rows.map((r) => ({
    id: Number(r.id),
    emp_id: String(r.emp_id),
    full_name: String(r.full_name),
    department: String(r.department),
    email: String(r.email),
    designation: String(r.designation),
    user_type: r.user_type as DbUserRecord['user_type'],
    is_admin: Boolean(r.is_admin),
    is_master_admin: Boolean(r.is_master_admin),
    passwordless_allowed: Boolean(r.passwordless_allowed),
    printer_access_allowed: Boolean(r.printer_access_allowed),
    password_hash: String(r.password_hash),
    password_salt: String(r.password_salt),
    quick_pin_hash: String(r.quick_pin_hash || ''),
    quick_pin_salt: String(r.quick_pin_salt || ''),
    is_activated: Boolean(r.is_activated),
    must_change_password: Boolean(r.must_change_password),
    last_password_reset: String(r.last_password_reset || ''),
    reset_request_status: (r.reset_request_status || 'none') as DbUserRecord['reset_request_status'],
    active_reset_token: String(r.active_reset_token || ''),
    reset_token_expires_at: String(r.reset_token_expires_at || ''),
    first_login_token: String(r.first_login_token || ''),
    is_active: Boolean(r.is_active),
  }));

  // Ensure default seed users (Akish, test, Meera) exist in DB
  let modified = false;
  for (const seed of seedUsers) {
    if (!loaded.some((u) => u.emp_id.toLowerCase() === seed.emp_id.toLowerCase())) {
      loaded.push(seed);
      modified = true;
    }
  }
  if (modified) {
    saveUsersToDb(loaded);
  } else {
    exportSharedJsonSnapshots();
  }
  return loaded;
}

export function saveUsersToDb(users: DbUserRecord[]): void {
  const now = new Date().toISOString();
  db.exec('BEGIN TRANSACTION');
  try {
    db.exec('DELETE FROM users');
    const stmt = db.prepare(`
      INSERT INTO users (
        id, emp_id, full_name, department, email, designation, user_type,
        is_admin, is_master_admin, passwordless_allowed, printer_access_allowed,
        password_hash, password_salt, quick_pin_hash, quick_pin_salt,
        is_activated, must_change_password, last_password_reset,
        reset_request_status, active_reset_token, reset_token_expires_at,
        first_login_token, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of users) {
      stmt.run(
        u.id,
        u.emp_id,
        u.full_name,
        u.department,
        u.email,
        u.designation,
        u.user_type,
        u.is_admin ? 1 : 0,
        u.is_master_admin ? 1 : 0,
        u.passwordless_allowed ? 1 : 0,
        u.printer_access_allowed ? 1 : 0,
        u.password_hash,
        u.password_salt,
        u.quick_pin_hash || '',
        u.quick_pin_salt || '',
        u.is_activated ? 1 : 0,
        u.must_change_password ? 1 : 0,
        u.last_password_reset || '',
        u.reset_request_status || 'none',
        u.active_reset_token || '',
        u.reset_token_expires_at || '',
        u.first_login_token || '',
        u.is_active ? 1 : 0,
        now
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Failed saving users to SQLite:', err);
  }
  exportSharedJsonSnapshots();
}

export function syncFilesFromDb(seedFiles: any[], pinMap: Map<number, string>): any[] {
  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM files`).get() as { cnt: number };
  if (!countRow || countRow.cnt === 0) {
    if (Array.isArray(seedFiles) && seedFiles.length > 0) {
      saveFilesToDb(seedFiles, pinMap);
      // Seed initial upload history if empty
      const histCount = db.prepare(`SELECT COUNT(*) as cnt FROM file_upload_history`).get() as { cnt: number };
      if (!histCount || histCount.cnt === 0) {
        for (const f of seedFiles) {
          recordUploadHistory(f, f.is_directory ? 'Directory' : f.is_link ? 'Web Link' : 'Document');
        }
      }
      return seedFiles;
    }
    return [];
  }

  const rows = db.prepare(`SELECT * FROM files ORDER BY id DESC`).all() as any[];
  const loaded = rows.map((r) => {
    const id = Number(r.id);
    const pin = String(r.encryption_pin || (r.is_passwordless ? 'PWDLESS_PUBLIC' : ''));
    pinMap.set(id, pin);
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(r.tags_json || '[]');
    } catch {
      parsedTags = [];
    }
    // Strip legacy topic tags (Revision, Homework, Anatomy, Formula, Lab, Exam) so only 2-3 tags (Subject/Dept, Class, Section) remain
    const legacyTopics = new Set(['revision', 'homework', 'anatomy', 'formula', 'lab', 'exam']);
    const cleanTags = parsedTags.filter((t) => !legacyTopics.has(String(t).toLowerCase())).slice(0, 3);

    return {
      id,
      file_uuid: String(r.file_uuid),
      batch_id: String(r.batch_id),
      uploaded_by_emp_id: String(r.uploaded_by_emp_id),
      uploader_name: String(r.uploader_name),
      department: String(r.department),
      original_name: String(r.original_name),
      mime_type: String(r.mime_type),
      file_extension: String(r.file_extension),
      file_size: Number(r.file_size),
      file_size_formatted: String(r.file_size_formatted),
      storage_path: String(r.storage_path),
      encryption_salt: String(r.encryption_salt || ''),
      encryption_iv: String(r.encryption_iv || ''),
      is_passwordless: Boolean(r.is_passwordless),
      is_directory: Boolean(r.is_directory),
      item_count: Number(r.item_count || 0),
      tags: cleanTags,
      custom_color: r.custom_color ? String(r.custom_color) : undefined,
      download_count: Number(r.download_count || 0),
      is_deleted: Boolean(r.is_deleted),
      deleted_at: r.deleted_at ? String(r.deleted_at) : undefined,
      deleted_by: r.deleted_by ? String(r.deleted_by) : undefined,
      expires_at: String(r.expires_at),
      created_at: String(r.created_at),
      is_link: Boolean(r.is_link),
      link_url: String(r.link_url || ''),
      link_description: String(r.link_description || ''),
    };
  });

  // If all files expired or were deleted, re-seed active study notes
  const activeCount = loaded.filter((f) => !f.is_deleted && new Date(f.expires_at).getTime() > Date.now()).length;
  if (activeCount === 0) {
    saveFilesToDb(seedFiles, pinMap);
    return seedFiles;
  }

  return loaded;
}

export function saveFilesToDb(files: any[], pinMap: Map<number, string>): void {
  db.exec('BEGIN TRANSACTION');
  try {
    db.exec('DELETE FROM files');
    const stmt = db.prepare(`
      INSERT INTO files (
        id, file_uuid, batch_id, uploaded_by_emp_id, uploader_name, department,
        original_name, mime_type, file_extension, file_size, file_size_formatted,
        storage_path, encryption_salt, encryption_iv, encryption_pin,
        is_passwordless, is_directory, item_count, tags_json, custom_color,
        download_count, is_deleted, deleted_at, deleted_by, expires_at, created_at, is_link, link_url, link_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of files) {
      const pin = pinMap.get(Number(f.id)) || (f.is_passwordless ? 'PWDLESS_PUBLIC' : '12569c');
      stmt.run(
        f.id,
        f.file_uuid || crypto.randomUUID(),
        f.batch_id || `BATCH-${f.id}`,
        f.uploaded_by_emp_id || 'EMP-1001',
        f.uploader_name || 'Campus Member',
        f.department || 'Science',
        f.original_name,
        f.mime_type || 'application/octet-stream',
        f.file_extension || 'FILE',
        Number(f.file_size || 0),
        f.file_size_formatted || '0 B',
        f.storage_path || '',
        f.encryption_salt || '',
        f.encryption_iv || '',
        pin,
        f.is_passwordless ? 1 : 0,
        f.is_directory ? 1 : 0,
        Number(f.item_count || 0),
        JSON.stringify(Array.isArray(f.tags) ? f.tags.slice(0, 3) : []),
        f.custom_color || '',
        Number(f.download_count || 0),
        f.is_deleted ? 1 : 0,
        f.deleted_at || '',
        f.deleted_by || '',
        f.expires_at,
        f.created_at,
        f.is_link ? 1 : 0,
        f.link_url || '',
        f.link_description || ''
      );
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Failed saving files to SQLite:', err);
  }
  exportSharedJsonSnapshots();
}

export function recordUploadHistory(
  file: any,
  uploadType: 'Document' | 'Quick Note' | 'Web Link' | 'Directory' = 'Document'
): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO file_upload_history (
        file_id, file_uuid, batch_id, original_name, file_extension,
        file_size, file_size_formatted, department, tags_json,
        uploaded_by_emp_id, uploader_name, access_mode, upload_type, status, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      Number(file.id),
      String(file.file_uuid || crypto.randomUUID()),
      String(file.batch_id || `BATCH-${file.id}`),
      String(file.original_name),
      String(file.file_extension || 'FILE'),
      Number(file.file_size || 0),
      String(file.file_size_formatted || '0 B'),
      String(file.department || 'Science'),
      JSON.stringify(Array.isArray(file.tags) ? file.tags.slice(0, 3) : []),
      String(file.uploaded_by_emp_id || 'EMP-1001'),
      String(file.uploader_name || 'Campus Member'),
      file.is_passwordless ? 'Public' : 'PIN Protected',
      uploadType,
      file.is_deleted ? 'DELETED' : 'ACTIVE',
      String(file.created_at || new Date().toISOString())
    );
    exportSharedJsonSnapshots();
  } catch (err) {
    console.error('Failed recording upload history:', err);
  }
}

export function markUploadHistoryStatus(fileId: number, status: 'ACTIVE' | 'DELETED' | 'EXPIRED'): void {
  try {
    db.prepare(`UPDATE file_upload_history SET status = ? WHERE file_id = ?`).run(status, Number(fileId));
    exportSharedJsonSnapshots();
  } catch {}
}

export function getUploadHistoryFromDb(): DbUploadHistoryRecord[] {
  try {
    const rows = db.prepare(`SELECT * FROM file_upload_history ORDER BY id DESC LIMIT 500`).all() as any[];
    return rows.map((r) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(r.tags_json || '[]');
      } catch {}
      return {
        id: Number(r.id),
        file_id: Number(r.file_id),
        file_uuid: String(r.file_uuid),
        batch_id: String(r.batch_id),
        original_name: String(r.original_name),
        file_extension: String(r.file_extension),
        file_size: Number(r.file_size),
        file_size_formatted: String(r.file_size_formatted),
        department: String(r.department),
        tags,
        uploaded_by_emp_id: String(r.uploaded_by_emp_id),
        uploader_name: String(r.uploader_name),
        access_mode: r.access_mode as 'Public' | 'PIN Protected',
        upload_type: r.upload_type as DbUploadHistoryRecord['upload_type'],
        status: r.status as DbUploadHistoryRecord['status'],
        uploaded_at: String(r.uploaded_at),
      };
    });
  } catch {
    return [];
  }
}

export function syncExtensionsFromDb(seedExtensions: any[]): any[] {
  try {
    const row = db.prepare(`SELECT value FROM kv_meta WHERE key = 'allowed_extensions'`).get() as { value?: string } | undefined;
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  saveExtensionsToDb(seedExtensions);
  return seedExtensions;
}

export function saveExtensionsToDb(extensions: any[]): void {
  try {
    db.prepare(`INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('allowed_extensions', ?)`).run(
      JSON.stringify(extensions)
    );
  } catch {}
}

export function syncAuditLogsFromDb(seedLogs: any[]): any[] {
  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM audit_logs`).get() as { cnt: number };
  if (!countRow || countRow.cnt < seedLogs.length) {
    const existing = getAuditLogsFromDb();
    const existingActions = new Set(existing.map((e) => `${e.action}:${e.file_name}`));
    for (let i = seedLogs.length - 1; i >= 0; i--) {
      const l = seedLogs[i];
      if (!existingActions.has(`${l.action}:${l.file_name}`)) {
        insertAuditLogToDb(l.action, l.emp_id, l.file_name, l.status, l.details, l.created_at);
      }
    }
  }
  return getAuditLogsFromDb();
}

export function insertAuditLogToDb(
  action: string,
  emp_id: string,
  file_name: string,
  status: string,
  details: string,
  created_at: string = new Date().toISOString()
): any {
  try {
    const res = db
      .prepare(
        `INSERT INTO audit_logs (action, emp_id, file_name, status, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(action, emp_id, file_name, status, details, created_at);
    exportSharedJsonSnapshots();
    return {
      id: Number(res.lastInsertRowid),
      action,
      emp_id,
      file_name,
      status,
      details,
      created_at,
    };
  } catch {
    return {
      id: Date.now(),
      action,
      emp_id,
      file_name,
      status,
      details,
      created_at,
    };
  }
}

export function getAuditLogsFromDb(): any[] {
  try {
    const rows = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500`).all() as any[];
    return rows.map((r) => ({
      id: Number(r.id),
      action: String(r.action),
      emp_id: String(r.emp_id),
      file_name: String(r.file_name),
      status: String(r.status),
      details: String(r.details),
      created_at: String(r.created_at),
    }));
  } catch {
    return [];
  }
}

export function clearAuditLogsInDb(adminActor: string): any[] {
  try {
    db.exec(`DELETE FROM audit_logs`);
    insertAuditLogToDb('AUDIT_RESET', adminActor, '-', 'SUCCESS', 'Audit log history cleared by Administrator.');
    return getAuditLogsFromDb();
  } catch {
    return [];
  }
}

export function saveSessionToDb(session: {
  token: string;
  emp_id: string;
  full_name: string;
  department: string;
  is_admin: boolean;
  is_master_admin: boolean;
  is_superuser: boolean;
  created_at: number;
  expires_at: number;
}): void {
  try {
    db.prepare(
      `INSERT OR REPLACE INTO sessions (token, emp_id, full_name, department, is_admin, is_master_admin, is_superuser, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      session.token,
      session.emp_id,
      session.full_name,
      session.department,
      session.is_admin ? 1 : 0,
      session.is_master_admin ? 1 : 0,
      session.is_superuser ? 1 : 0,
      session.created_at,
      session.expires_at
    );
  } catch {}
}

export function deleteSessionFromDb(token: string): void {
  try {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  } catch {}
}

export function loadActiveSessionsFromDb(): Map<string, any> {
  const map = new Map<string, any>();
  try {
    const now = Date.now();
    db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(now);
    const rows = db.prepare(`SELECT * FROM sessions WHERE expires_at > ?`).all(now) as any[];
    for (const r of rows) {
      map.set(String(r.token), {
        token: String(r.token),
        emp_id: String(r.emp_id),
        full_name: String(r.full_name),
        department: String(r.department),
        is_admin: Boolean(r.is_admin),
        is_master_admin: Boolean(r.is_master_admin),
        is_superuser: Boolean(r.is_superuser),
        created_at: Number(r.created_at),
        expires_at: Number(r.expires_at),
      });
    }
  } catch {}
  return map;
}

export function exportSharedJsonSnapshots(): void {
  try {
    const users = db.prepare(`SELECT * FROM users ORDER BY id ASC`).all() as any[];
    const files = db.prepare(`SELECT * FROM files ORDER BY id DESC`).all() as any[];
    const uploadHistory = db.prepare(`SELECT * FROM file_upload_history ORDER BY id DESC LIMIT 500`).all() as any[];
    const logs = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500`).all() as any[];

    const portableUsers = {
      schema_version: '1.0',
      exported_at: new Date().toISOString(),
      description: 'Portable Vault Users Database — Reusable across external campus & web applications',
      users: users.map((u) => ({
        id: Number(u.id),
        emp_id: u.emp_id,
        full_name: u.full_name,
        department: u.department,
        email: u.email,
        designation: u.designation,
        user_type: u.user_type,
        is_admin: Boolean(u.is_admin),
        is_master_admin: Boolean(u.is_master_admin),
        passwordless_allowed: Boolean(u.passwordless_allowed),
        printer_access_allowed: Boolean(u.printer_access_allowed),
        password_hash: u.password_hash,
        password_salt: u.password_salt,
        quick_pin_hash: u.quick_pin_hash,
        quick_pin_salt: u.quick_pin_salt,
        is_activated: Boolean(u.is_activated),
        is_active: Boolean(u.is_active),
        updated_at: u.updated_at,
      })),
    };

    fs.writeFileSync(SHARED_USERS_JSON_PATH, JSON.stringify(portableUsers, null, 2), 'utf-8');

    const fullSnapshot = {
      schema_version: '1.0',
      exported_at: new Date().toISOString(),
      sqlite_path: SQLITE_DB_PATH,
      users: portableUsers.users,
      files: files.map(({ encryption_pin, storage_path, ...rest }) => rest),
      file_upload_history: uploadHistory,
      audit_logs: logs,
    };

    fs.writeFileSync(FULL_DB_JSON_PATH, JSON.stringify(fullSnapshot, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed exporting shared JSON snapshots:', err);
  }
}

export function getDatabaseSummary() {
  const usersCount = (db.prepare(`SELECT COUNT(*) as cnt FROM users`).get() as any)?.cnt || 0;
  const activeFilesCount = (db.prepare(`SELECT COUNT(*) as cnt FROM files WHERE is_deleted = 0`).get() as any)?.cnt || 0;
  const totalFilesCount = (db.prepare(`SELECT COUNT(*) as cnt FROM files`).get() as any)?.cnt || 0;
  const uploadHistoryCount = (db.prepare(`SELECT COUNT(*) as cnt FROM file_upload_history`).get() as any)?.cnt || 0;
  const logsCount = (db.prepare(`SELECT COUNT(*) as cnt FROM audit_logs`).get() as any)?.cnt || 0;

  let sqliteBytes = 0;
  try {
    if (fs.existsSync(SQLITE_DB_PATH)) {
      sqliteBytes = fs.statSync(SQLITE_DB_PATH).size;
    }
  } catch {}

  return {
    engine: 'SQLite 3 (WAL Mode) + Portable JSON Mirror',
    sqlite_file: '/database/vault.sqlite',
    shared_users_json: '/database/users_db.json',
    full_db_json: '/database/vault_shared_db.json',
    cross_app_auth_endpoint: 'POST /api/db/auth-verify',
    sqlite_size_bytes: sqliteBytes,
    tables: {
      users: Number(usersCount),
      active_files: Number(activeFilesCount),
      total_files: Number(totalFilesCount),
      file_upload_history: Number(uploadHistoryCount),
      audit_logs: Number(logsCount),
    },
  };
}

// ================= SITE THEMES & SEASONAL OVERLAYS (SQLite kv_meta) =================
export function syncThemesFromDb(): { themes: SiteTheme[]; activeThemeId: string } {
  try {
    let themes: SiteTheme[] = [];
    const themesRow = db.prepare(`SELECT value FROM kv_meta WHERE key = 'site_themes'`).get() as { value?: string } | undefined;
    if (themesRow && themesRow.value) {
      try {
        const parsed = JSON.parse(themesRow.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          themes = parsed;
        }
      } catch {}
    }
    if (themes.length === 0) {
      themes = [WINTER_WONDERLAND_THEME];
      saveThemesToDb(themes);
    } else {
      // Ensure the built-in Winter Wonderland theme is always preserved and updated with latest definitions
      const existingIdx = themes.findIndex((t: SiteTheme) => t.id === WINTER_WONDERLAND_THEME.id);
      if (existingIdx === -1) {
        themes.unshift(WINTER_WONDERLAND_THEME);
        saveThemesToDb(themes);
      } else {
        themes[existingIdx] = {
          ...WINTER_WONDERLAND_THEME,
          ...themes[existingIdx],
          mascotOverride: WINTER_WONDERLAND_THEME.mascotOverride,
          navbar: {
            ...themes[existingIdx].navbar,
            ...WINTER_WONDERLAND_THEME.navbar,
          },
          ambient: {
            ...themes[existingIdx].ambient,
            ...WINTER_WONDERLAND_THEME.ambient,
          },
          corners: {
            ...themes[existingIdx].corners,
            ...WINTER_WONDERLAND_THEME.corners,
            bottomRightSvg: '',
          },
          cardSkins: WINTER_WONDERLAND_THEME.cardSkins,
        };
        saveThemesToDb(themes);
      }
    }

    let activeThemeId = '';
    const activeRow = db.prepare(`SELECT value FROM kv_meta WHERE key = 'active_theme_id'`).get() as { value?: string } | undefined;
    if (activeRow !== undefined && activeRow.value !== undefined) {
      activeThemeId = activeRow.value;
    } else {
      activeThemeId = 'winter-wonderland';
      setActiveThemeIdInDb(activeThemeId);
    }

    return { themes, activeThemeId };
  } catch (err) {
    console.error('Error syncing themes from DB:', err);
    return { themes: [WINTER_WONDERLAND_THEME], activeThemeId: 'winter-wonderland' };
  }
}

export function saveThemesToDb(themes: SiteTheme[]): void {
  try {
    db.prepare(`INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('site_themes', ?)`).run(
      JSON.stringify(themes)
    );
  } catch (err) {
    console.error('Failed saving themes to DB:', err);
  }
}

export function getActiveThemeIdFromDb(): string {
  try {
    const row = db.prepare(`SELECT value FROM kv_meta WHERE key = 'active_theme_id'`).get() as { value?: string } | undefined;
    return row && row.value ? row.value : '';
  } catch {
    return '';
  }
}

export function setActiveThemeIdInDb(themeId: string): void {
  try {
    db.prepare(`INSERT OR REPLACE INTO kv_meta (key, value) VALUES ('active_theme_id', ?)`).run(
      themeId || ''
    );
  } catch (err) {
    console.error('Failed updating active theme ID in DB:', err);
  }
}

export function addOrUpdateThemeInDb(theme: SiteTheme): SiteTheme[] {
  const { themes } = syncThemesFromDb();
  const existingIdx = themes.findIndex((t: SiteTheme) => t.id === theme.id);
  if (existingIdx >= 0) {
    themes[existingIdx] = { ...theme, isBuiltIn: themes[existingIdx].isBuiltIn };
  } else {
    themes.unshift(theme);
  }
  saveThemesToDb(themes);
  return themes;
}

export function deleteThemeFromDb(themeId: string): { themes: SiteTheme[]; activeThemeId: string } {
  let { themes, activeThemeId } = syncThemesFromDb();
  themes = themes.filter((t: SiteTheme) => t.id !== themeId);
  if (activeThemeId === themeId) {
    activeThemeId = '';
    setActiveThemeIdInDb('');
  }
  saveThemesToDb(themes);
  return { themes, activeThemeId };
}

