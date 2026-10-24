import { parseBackup, BACKUP_FORMAT, BACKUP_VERSION, summarize } from '../app/utils/backup';

const valid = {
  format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: new Date().toISOString(),
  app: { name: 'GridDown', platform: 'android' },
  tables: { kits: [{ id: 'k1', name: 'Go bag', icon: '🎒', created_at: 1 }], gear_items: [] },
  prefs: {},
};

describe('parseBackup', () => {
  test('accepts a valid backup and summarizes it', () => {
    const b = parseBackup(JSON.stringify(valid));
    expect(summarize(b).kits).toBe(1);
  });
  test('rejects non-JSON', () => {
    expect(() => parseBackup('{nope')).toThrow(/valid JSON/);
  });
  test('rejects other apps\' files', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, format: 'other' }))).toThrow(/not a GridDown backup/);
  });
  test('rejects newer versions', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, version: BACKUP_VERSION + 1 }))).toThrow(/newer version/);
  });
  test('rejects unknown tables (no SQL injection via table names)', () => {
    expect(() => parseBackup(JSON.stringify({ ...valid, tables: { 'kits; DROP TABLE kits': [] } }))).toThrow(/unknown table/);
  });
});
