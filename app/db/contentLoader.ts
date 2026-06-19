import * as SQLite from 'expo-sqlite';

export interface GuideStep { step: number; title: string; body: string; }
export interface Guide {
  id: string; category: string; title: string;
  priority: 'critical' | 'advanced' | 'beginner';
  tags: string[]; summary: string; steps: GuideStep[];
  warnings: string[]; proTips: string[]; relatedGuides: string[];
}
export interface Category { id: string; label: string; icon: string; description: string; }
export interface ChecklistItem { id: string; text: string; critical: boolean; }
export interface Checklist { id: string; title: string; disasterType?: string; items: ChecklistItem[]; }

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('griddown.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS bookmarks (guide_id TEXT PRIMARY KEY, saved_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS recently_viewed (guide_id TEXT PRIMARY KEY, viewed_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS checklist_state (
      checklist_id TEXT NOT NULL, item_id TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL,
      PRIMARY KEY (checklist_id, item_id)
    );
    CREATE TABLE IF NOT EXISTS user_tier (
      id INTEGER PRIMARY KEY, tier_name TEXT NOT NULL DEFAULT 'free',
      expires_at INTEGER, is_lifetime INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS translations (
      guide_id TEXT NOT NULL, language_code TEXT NOT NULL,
      field TEXT NOT NULL, translated_text TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      PRIMARY KEY (guide_id, language_code, field)
    );
    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      format TEXT NOT NULL,
      correct INTEGER NOT NULL,
      answered_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS daily_drill_state (
      date TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      score INTEGER
    );
    INSERT OR IGNORE INTO user_tier (id, tier_name, is_lifetime) VALUES (1, 'free', 0);
  `);
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export async function addBookmark(guideId: string): Promise<void> {
  await getDb().runAsync('INSERT OR REPLACE INTO bookmarks (guide_id, saved_at) VALUES (?, ?)', [guideId, Date.now()]);
}
export async function removeBookmark(guideId: string): Promise<void> {
  await getDb().runAsync('DELETE FROM bookmarks WHERE guide_id = ?', [guideId]);
}
export async function getBookmarks(): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ guide_id: string }>('SELECT guide_id FROM bookmarks ORDER BY saved_at DESC');
  return rows.map((r) => r.guide_id);
}
export async function recordViewed(guideId: string): Promise<void> {
  const database = getDb();
  await database.runAsync('INSERT OR REPLACE INTO recently_viewed (guide_id, viewed_at) VALUES (?, ?)', [guideId, Date.now()]);
  await database.runAsync('DELETE FROM recently_viewed WHERE guide_id NOT IN (SELECT guide_id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20)');
}
export async function getRecentlyViewed(): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ guide_id: string }>('SELECT guide_id FROM recently_viewed ORDER BY viewed_at DESC LIMIT 20');
  return rows.map((r) => r.guide_id);
}
export async function clearRecentlyViewed(): Promise<void> {
  await getDb().runAsync('DELETE FROM recently_viewed');
}
export async function setChecklistItem(checklistId: string, itemId: string, checked: boolean): Promise<void> {
  await getDb().runAsync('INSERT OR REPLACE INTO checklist_state (checklist_id, item_id, checked, updated_at) VALUES (?, ?, ?, ?)', [checklistId, itemId, checked ? 1 : 0, Date.now()]);
}
export async function getChecklistState(checklistId: string): Promise<Record<string, boolean>> {
  const rows = await getDb().getAllAsync<{ item_id: string; checked: number }>('SELECT item_id, checked FROM checklist_state WHERE checklist_id = ?', [checklistId]);
  const state: Record<string, boolean> = {};
  rows.forEach((r) => { state[r.item_id] = r.checked === 1; });
  return state;
}
export async function resetChecklist(checklistId: string): Promise<void> {
  await getDb().runAsync('DELETE FROM checklist_state WHERE checklist_id = ?', [checklistId]);
}
export async function getUserTier(): Promise<string> {
  const row = await getDb().getFirstAsync<{ tier_name: string }>('SELECT tier_name FROM user_tier WHERE id = 1');
  return row?.tier_name ?? 'free';
}
export async function setUserTier(tierName: string, expiresAt: number | null, isLifetime: boolean): Promise<void> {
  await getDb().runAsync('UPDATE user_tier SET tier_name = ?, expires_at = ?, is_lifetime = ? WHERE id = 1', [tierName, expiresAt, isLifetime ? 1 : 0]);
}
export async function getCachedTranslation(guideId: string, languageCode: string, field: string): Promise<string | null> {
  try {
    const row = await getDb().getFirstAsync<{ translated_text: string }>('SELECT translated_text FROM translations WHERE guide_id = ? AND language_code = ? AND field = ?', [guideId, languageCode, field]);
    return row?.translated_text ?? null;
  } catch { return null; }
}
export async function cacheTranslation(guideId: string, languageCode: string, field: string, translatedText: string): Promise<void> {
  try {
    await getDb().runAsync('INSERT OR REPLACE INTO translations (guide_id, language_code, field, translated_text, cached_at) VALUES (?, ?, ?, ?, ?)', [guideId, languageCode, field, translatedText, Date.now()]);
  } catch { /* ignore */ }
}
export async function clearTranslationCache(languageCode: string): Promise<void> {
  try { await getDb().runAsync('DELETE FROM translations WHERE language_code = ?', [languageCode]); } catch { /* ignore */ }
}

export async function saveQuizResult(category: string, quizId: string, format: string, correct: boolean): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO quiz_results (category, quiz_id, format, correct, answered_at) VALUES (?, ?, ?, ?, ?)',
    [category, quizId, format, correct ? 1 : 0, Date.now()]
  );
}

export async function getCategoryReadiness(category: string): Promise<number> {
  const rows = await getDb().getAllAsync<{ correct: number }>(
    'SELECT correct FROM quiz_results WHERE category = ?',
    [category]
  );
  if (rows.length === 0) return 0;
  const correctCount = rows.filter((r) => r.correct === 1).length;
  return Math.round((correctCount / rows.length) * 100);
}

export async function getOverallReadiness(): Promise<number> {
  const rows = await getDb().getAllAsync<{ correct: number }>(
    'SELECT correct FROM quiz_results'
  );
  if (rows.length === 0) return 0;
  const correctCount = rows.filter((r) => r.correct === 1).length;
  return Math.round((correctCount / rows.length) * 100);
}

export async function getTodayDrillState(): Promise<{
  date: string; quiz_id: string; completed: number; score: number | null;
} | null> {
  const today = new Date().toISOString().split('T')[0];
  return (await getDb().getFirstAsync<{
    date: string; quiz_id: string; completed: number; score: number | null;
  }>('SELECT * FROM daily_drill_state WHERE date = ?', [today])) ?? null;
}

export async function markDrillComplete(date: string, quizId: string, score: number): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO daily_drill_state (date, quiz_id, completed, score) VALUES (?, ?, 1, ?)',
    [date, quizId, score]
  );
}
