import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) db = await SQLite.openDatabaseAsync('griddown.db');
  return db;
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  blood_type: string;
  allergies: string;
  medications: string;
  medical_conditions: string;
  is_child: number;
  photo_uri: string;
  created_at: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_out_of_area: number;
  notes: string;
}

export interface RallyPoint {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lon: number | null;
  notes: string;
  type: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  medications: string;
  vet_name: string;
  vet_phone: string;
  notes: string;
}

// ─── Init ────────────────────────────────────────────────────────────────────

export async function initFamilyPlannerTables(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT,
      blood_type TEXT,
      allergies TEXT,
      medications TEXT,
      medical_conditions TEXT,
      is_child INTEGER DEFAULT 0,
      photo_uri TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS rally_points (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL,
      lon REAL,
      notes TEXT,
      type TEXT
    );
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      relationship TEXT,
      is_out_of_area INTEGER DEFAULT 0,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT,
      breed TEXT,
      medications TEXT,
      vet_name TEXT,
      vet_phone TEXT,
      notes TEXT
    );
  `);
}

// ─── Family Members CRUD ─────────────────────────────────────────────────────

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const database = await getDb();
  return await database.getAllAsync<FamilyMember>(
    'SELECT * FROM family_members ORDER BY created_at ASC'
  );
}

export async function addFamilyMember(data: Omit<FamilyMember, 'id' | 'created_at'>): Promise<void> {
  const database = await getDb();
  const id = newId();
  const now = Date.now();
  await database.runAsync(
    `INSERT INTO family_members (id, name, relationship, phone, blood_type, allergies,
      medications, medical_conditions, is_child, photo_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.relationship, data.phone, data.blood_type, data.allergies,
     data.medications, data.medical_conditions, data.is_child, data.photo_uri, now]
  );
}

export async function updateFamilyMember(id: string, data: Partial<Omit<FamilyMember, 'id' | 'created_at'>>): Promise<void> {
  const database = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await database.runAsync(`UPDATE family_members SET ${fields} WHERE id = ?`, values);
}

export async function deleteFamilyMember(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM family_members WHERE id = ?', [id]);
}

// ─── Emergency Contacts CRUD ─────────────────────────────────────────────────

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  const database = await getDb();
  return await database.getAllAsync<EmergencyContact>(
    'SELECT * FROM emergency_contacts ORDER BY is_out_of_area ASC, name ASC'
  );
}

export async function addEmergencyContact(data: Omit<EmergencyContact, 'id'>): Promise<void> {
  const database = await getDb();
  const id = newId();
  await database.runAsync(
    `INSERT INTO emergency_contacts (id, name, phone, relationship, is_out_of_area, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.phone, data.relationship, data.is_out_of_area, data.notes]
  );
}

export async function updateEmergencyContact(id: string, data: Partial<Omit<EmergencyContact, 'id'>>): Promise<void> {
  const database = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await database.runAsync(`UPDATE emergency_contacts SET ${fields} WHERE id = ?`, values);
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM emergency_contacts WHERE id = ?', [id]);
}

// ─── Rally Points CRUD ───────────────────────────────────────────────────────

export async function getRallyPoints(): Promise<RallyPoint[]> {
  const database = await getDb();
  return await database.getAllAsync<RallyPoint>(
    'SELECT * FROM rally_points ORDER BY type ASC, name ASC'
  );
}

export async function addRallyPoint(data: Omit<RallyPoint, 'id'>): Promise<void> {
  const database = await getDb();
  const id = newId();
  await database.runAsync(
    `INSERT INTO rally_points (id, name, address, lat, lon, notes, type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.address, data.lat ?? null, data.lon ?? null, data.notes, data.type]
  );
}

export async function updateRallyPoint(id: string, data: Partial<Omit<RallyPoint, 'id'>>): Promise<void> {
  const database = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await database.runAsync(`UPDATE rally_points SET ${fields} WHERE id = ?`, values);
}

export async function deleteRallyPoint(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM rally_points WHERE id = ?', [id]);
}

// ─── Pets CRUD ───────────────────────────────────────────────────────────────

export async function getPets(): Promise<Pet[]> {
  const database = await getDb();
  return await database.getAllAsync<Pet>(
    'SELECT * FROM pets ORDER BY name ASC'
  );
}

export async function addPet(data: Omit<Pet, 'id'>): Promise<void> {
  const database = await getDb();
  const id = newId();
  await database.runAsync(
    `INSERT INTO pets (id, name, species, breed, medications, vet_name, vet_phone, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.species, data.breed, data.medications, data.vet_name, data.vet_phone, data.notes]
  );
}

export async function updatePet(id: string, data: Partial<Omit<Pet, 'id'>>): Promise<void> {
  const database = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await database.runAsync(`UPDATE pets SET ${fields} WHERE id = ?`, values);
}

export async function deletePet(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM pets WHERE id = ?', [id]);
}
