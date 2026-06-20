import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) db = await SQLite.openDatabaseAsync('griddown.db');
  return db;
}

export type GearItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expiration_date?: number | null;
  replacement_interval_days?: number | null;
  last_replaced?: number | null;
  weight_grams?: number | null;
  notes?: string | null;
  kit_assignment?: string | null;
  created_at: number;
};

export async function initGearInventoryTables(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS gear_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      expiration_date INTEGER,
      replacement_interval_days INTEGER,
      last_replaced INTEGER,
      weight_grams INTEGER,
      notes TEXT,
      kit_assignment TEXT,
      created_at INTEGER
    );
  `);
}

export async function seedGearItems(): Promise<void> {
  const database = await getDb();
  const result = await database.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM gear_items'
  );
  if (result[0]?.count > 0) return;

  const now = Date.now();
  const day = 86400000;

  const items: Omit<GearItem, 'id' | 'created_at'>[] = [
    { name: 'CAT Tourniquet', category: 'Medical', quantity: 2, weight_grams: 75 },
    { name: 'Chest Seal (Hyfin)', category: 'Medical', quantity: 2, expiration_date: now + 5 * 365 * day },
    { name: 'Israeli Bandage', category: 'Medical', quantity: 3, expiration_date: now + 5 * 365 * day },
    { name: 'QuikClot Gauze', category: 'Medical', quantity: 2, expiration_date: now + 3 * 365 * day },
    { name: 'Water Filter (LifeStraw/Sawyer)', category: 'Water', quantity: 1, replacement_interval_days: 36500 },
    { name: 'Water Purification Tablets', category: 'Water', quantity: 1, expiration_date: now + 4 * 365 * day },
    { name: 'Food Rations (72hr)', category: 'Food', quantity: 1, expiration_date: now + 5 * 365 * day },
    { name: 'NOAA Radio', category: 'Comms', quantity: 1, replacement_interval_days: 730 },
    { name: 'GMRS/HAM Radio', category: 'Comms', quantity: 1, replacement_interval_days: 1095 },
    { name: 'Flashlight', category: 'Tools', quantity: 1, replacement_interval_days: 730 },
    { name: 'Extra Batteries AA', category: 'Power', quantity: 12, expiration_date: now + 10 * 365 * day },
    { name: 'Extra Batteries AAA', category: 'Power', quantity: 12, expiration_date: now + 10 * 365 * day },
    { name: 'Multi-tool', category: 'Tools', quantity: 1 },
    { name: 'Fixed Blade Knife', category: 'Tools', quantity: 1 },
    { name: 'Compass', category: 'Navigation', quantity: 1 },
    { name: 'Physical Maps', category: 'Navigation', quantity: 3 },
    { name: 'Emergency Cash $200', category: 'Other', quantity: 1 },
    { name: 'Lighter', category: 'Tools', quantity: 3 },
  ];

  for (const item of items) {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    await database.runAsync(
      `INSERT INTO gear_items
        (id, name, category, quantity, expiration_date, replacement_interval_days,
         last_replaced, weight_grams, notes, kit_assignment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, item.name, item.category, item.quantity,
        item.expiration_date ?? null, item.replacement_interval_days ?? null,
        item.last_replaced ?? null, item.weight_grams ?? null,
        item.notes ?? null, item.kit_assignment ?? null, now,
      ]
    );
  }
}

export async function getGearItems(): Promise<GearItem[]> {
  const database = await getDb();
  return database.getAllAsync<GearItem>('SELECT * FROM gear_items ORDER BY name ASC');
}

export async function addGearItem(
  item: Omit<GearItem, 'id' | 'created_at'>
): Promise<void> {
  const database = await getDb();
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const now = Date.now();
  await database.runAsync(
    `INSERT INTO gear_items
      (id, name, category, quantity, expiration_date, replacement_interval_days,
       last_replaced, weight_grams, notes, kit_assignment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, item.name, item.category, item.quantity,
      item.expiration_date ?? null, item.replacement_interval_days ?? null,
      item.last_replaced ?? null, item.weight_grams ?? null,
      item.notes ?? null, item.kit_assignment ?? null, now,
    ]
  );
}

export async function updateGearItem(
  id: string,
  updates: Partial<GearItem>
): Promise<void> {
  const database = await getDb();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  if (fields.length === 0) return;
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => (updates as Record<string, unknown>)[f] ?? null) as import('expo-sqlite').SQLiteBindValue[];
  await database.runAsync(
    `UPDATE gear_items SET ${setClause} WHERE id = ?`,
    [...values, id] as import('expo-sqlite').SQLiteBindValue[]
  );
}

export async function deleteGearItem(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM gear_items WHERE id = ?', [id]);
}
