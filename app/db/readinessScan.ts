import * as SQLite from 'expo-sqlite';

export interface ReadinessScanResult {
  id?: number;
  completed_at: number;
  water_score: number;
  shelter_score: number;
  medical_score: number;
  comms_score: number;
  power_score: number;
  navigation_score: number;
  planning_score: number;
  overall_score: number;
  answers: string;
}

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('griddown.db');
  }
  return _db;
}

export async function initReadinessScanTable(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS readiness_scan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      completed_at INTEGER,
      water_score INTEGER,
      shelter_score INTEGER,
      medical_score INTEGER,
      comms_score INTEGER,
      power_score INTEGER,
      navigation_score INTEGER,
      planning_score INTEGER,
      overall_score INTEGER,
      answers TEXT
    );
  `);
}

export async function saveReadinessScan(data: ReadinessScanResult): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO readiness_scan
      (completed_at, water_score, shelter_score, medical_score, comms_score,
       power_score, navigation_score, planning_score, overall_score, answers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.completed_at,
      data.water_score,
      data.shelter_score,
      data.medical_score,
      data.comms_score,
      data.power_score,
      data.navigation_score,
      data.planning_score,
      data.overall_score,
      data.answers,
    ]
  );
}

export async function getLatestReadinessScan(): Promise<ReadinessScanResult | null> {
  const db = getDb();
  const row = await db.getFirstAsync<ReadinessScanResult>(
    `SELECT * FROM readiness_scan ORDER BY completed_at DESC LIMIT 1`
  );
  return row ?? null;
}
