/**
 * backup.ts — export / import of everything the user has created in GridDown.
 *
 * Produces a single JSON file (kits, checklists, gear, family plan, map points,
 * saved repeaters, quiz history, readiness scans, bookmarks, settings) that the
 * user shares wherever they like — a USB drive, email, cloud folder — and can
 * restore onto a new phone. GridDown never uploads this file anywhere itself.
 *
 * Deliberately excluded: `user_tier` (purchases are restored through the store),
 * `translations` (a cache), and downloaded AI/translation models (re-downloadable).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSharedDb } from '../db/contentLoader';

export const BACKUP_FORMAT = 'griddown-backup';
export const BACKUP_VERSION = 1;

/** Tables copied verbatim. Order matters on import (parents before children). */
const USER_TABLES = [
  'bookmarks',
  'recently_viewed',
  'checklist_state',
  'quiz_results',
  'daily_drill_state',
  'kits',
  'kit_guides',
  'kit_checklists',
  'readiness_scan',
  'gear_items',
  'family_members',
  'rally_points',
  'emergency_contacts',
  'pets',
  'saved_repeaters',
  'map_points',
] as const;

type TableName = (typeof USER_TABLES)[number];

/** AsyncStorage keys that hold user preferences worth carrying over. */
const PREF_KEYS = [
  'griddown_advisor_model',
  'griddown_language_pref',
  'griddown_translate_content',
  'griddown_drill_reminder',
  '@griddown_docs_checklist',
  'nightOps',
  'onboardingCompleted',
  'userProfile',
  'userRegion',
];

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  app: { name: string; platform: string };
  tables: Partial<Record<TableName, Record<string, unknown>[]>>;
  prefs: Record<string, string>;
}

export interface BackupSummary {
  kits: number;
  gearItems: number;
  familyMembers: number;
  mapPoints: number;
  checklistItems: number;
  quizResults: number;
  tables: number;
}

async function tableExists(name: string): Promise<boolean> {
  const db = await getSharedDb();
  const row = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name = ?",
    [name],
  );
  return (row?.c ?? 0) > 0;
}

/** Column names of a table (used to whitelist imported keys). */
async function tableColumns(name: TableName): Promise<string[]> {
  const db = await getSharedDb();
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${name})`);
  return rows.map((r) => r.name);
}

export function summarize(b: BackupFile): BackupSummary {
  const n = (t: TableName) => b.tables[t]?.length ?? 0;
  return {
    kits: n('kits'),
    gearItems: n('gear_items'),
    familyMembers: n('family_members'),
    mapPoints: n('map_points'),
    checklistItems: n('checklist_state'),
    quizResults: n('quiz_results'),
    tables: Object.keys(b.tables).length,
  };
}

/** Snapshot every user table + prefs into a BackupFile object. */
export async function createBackup(): Promise<BackupFile> {
  const db = await getSharedDb();
  const tables: BackupFile['tables'] = {};
  for (const t of USER_TABLES) {
    if (!(await tableExists(t))) continue;
    tables[t] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
  }
  const prefs: Record<string, string> = {};
  try {
    const pairs = await AsyncStorage.multiGet(PREF_KEYS);
    for (const [k, v] of pairs) if (v != null) prefs[k] = v;
  } catch {
    /* prefs are optional */
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    app: { name: 'GridDown', platform: Platform.OS },
    tables,
    prefs,
  };
}

/** Throws with a readable message when the file is not a GridDown backup. */
export function parseBackup(json: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const b = data as Partial<BackupFile>;
  if (!b || b.format !== BACKUP_FORMAT) throw new Error('That file is not a GridDown backup.');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of GridDown. Update the app and try again.');
  }
  if (!b.tables || typeof b.tables !== 'object') throw new Error('Backup is missing its data section.');
  for (const [name, rows] of Object.entries(b.tables)) {
    if (!(USER_TABLES as readonly string[]).includes(name)) throw new Error(`Backup contains an unknown table: ${name}`);
    if (!Array.isArray(rows)) throw new Error(`Backup table ${name} is malformed.`);
  }
  return b as BackupFile;
}

/**
 * Restore a backup. `merge` keeps existing rows and adds/overwrites by primary
 * key; otherwise each table in the backup is cleared first.
 */
export async function restoreBackup(b: BackupFile, opts: { merge?: boolean } = {}): Promise<BackupSummary> {
  const db = await getSharedDb();
  await db.execAsync('BEGIN');
  try {
    for (const t of USER_TABLES) {
      const rows = b.tables[t];
      if (!rows || !(await tableExists(t))) continue;
      const cols = await tableColumns(t);
      if (!opts.merge) await db.runAsync(`DELETE FROM ${t}`);
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => cols.includes(k));
        if (keys.length === 0) continue;
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => {
          const v = row[k];
          return v === undefined ? null : (v as string | number | null);
        });
        await db.runAsync(
          `INSERT OR REPLACE INTO ${t} (${keys.join(', ')}) VALUES (${placeholders})`,
          values,
        );
      }
    }
    await db.execAsync('COMMIT');
  } catch (err) {
    await db.execAsync('ROLLBACK');
    throw err;
  }
  try {
    const pairs = Object.entries(b.prefs ?? {}).filter(([k]) => PREF_KEYS.includes(k)) as [string, string][];
    if (pairs.length) await AsyncStorage.multiSet(pairs);
  } catch {
    /* prefs are optional */
  }
  return summarize(b);
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/**
 * Write the backup to the app cache and open the system share sheet so the user
 * picks where it goes. Returns the local file URI.
 */
export async function exportBackupToShareSheet(): Promise<{ uri: string; summary: BackupSummary }> {
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const backup = await createBackup();
  const uri = `${FileSystem.cacheDirectory}GridDown-backup-${stamp()}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 1));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your GridDown backup',
      UTI: 'public.json',
    });
  }
  return { uri, summary: summarize(backup) };
}

/** Let the user pick a backup file and return it parsed (null if they cancel). */
export async function pickBackupFile(): Promise<BackupFile | null> {
  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system/legacy');
  const res = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const json = await FileSystem.readAsStringAsync(res.assets[0].uri);
  return parseBackup(json);
}
