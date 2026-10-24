import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveReport, listReports, clearReports, buildReportMailto, formatReportBody,
  MAX_REPORTS, REPORTS_KEY, SUPPORT_EMAIL, REPORT_REASONS,
} from '../app/utils/advisorReports';

const base = {
  reason: 'unsafe' as const,
  question: 'How long do I boil river water?',
  answer: 'Boil for 30 seconds.',
  mode: 'instructor',
  modelId: 'lite',
  sources: ['Purification by Boiling'],
  appVersion: '1.0.0 (1)',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('saveReport stores newest first and returns the record', async () => {
  const a = await saveReport(base, 1000);
  const b = await saveReport({ ...base, reason: 'inaccurate' }, 2000);
  const all = await listReports();
  expect(all.map((r) => r.id)).toEqual([b.id, a.id]);
  expect(all[0].reason).toBe('inaccurate');
  expect(all[1].createdAt).toBe(1000);
});

test('the store is capped at MAX_REPORTS', async () => {
  for (let i = 0; i < MAX_REPORTS + 7; i++) await saveReport(base, i);
  const all = await listReports();
  expect(all).toHaveLength(MAX_REPORTS);
  expect(all[0].createdAt).toBe(MAX_REPORTS + 6); // newest kept, oldest dropped
});

test('listReports survives corrupt storage', async () => {
  await AsyncStorage.setItem(REPORTS_KEY, '{not json');
  expect(await listReports()).toEqual([]);
  await AsyncStorage.setItem(REPORTS_KEY, '{"a":1}');
  expect(await listReports()).toEqual([]);
});

test('clearReports empties the store', async () => {
  await saveReport(base);
  await clearReports();
  expect(await listReports()).toEqual([]);
});

test('mailto goes to support with reason, question and answer, fully URL-encoded', () => {
  const r = { ...base, id: 'x', createdAt: Date.UTC(2026, 9, 24, 12, 0, 0) };
  const url = buildReportMailto(r);
  expect(url.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true);
  const [, query] = url.split('?');
  const params = new URLSearchParams(query);
  expect(params.get('subject')).toBe('GridDown AI answer report — Unsafe advice');
  const body = params.get('body') ?? '';
  expect(body).toContain('Reason: Unsafe advice');
  expect(body).toContain('Question:\nHow long do I boil river water?');
  expect(body).toContain('Answer:\nBoil for 30 seconds.');
  expect(body).toContain('Sources shown: Purification by Boiling');
  expect(body).toContain('2026-10-24T12:00:00.000Z');
  // nothing raw that would break the URL
  expect(url).not.toMatch(/[\s"<>#]/);
});

test('very long answers are truncated so the mailto stays openable', () => {
  const r = { ...base, answer: 'x'.repeat(10_000), id: 'x', createdAt: 0 };
  const body = formatReportBody(r);
  expect(body.length).toBeLessThanOrEqual(1800);
  expect(body.endsWith('…[answer truncated]')).toBe(true);
});

test('every reason has a label and hint', () => {
  expect(REPORT_REASONS.map((r) => r.id)).toEqual(['inaccurate', 'unsafe', 'offensive', 'other']);
  for (const r of REPORT_REASONS) {
    expect(r.label.length).toBeGreaterThan(3);
    expect(r.hint.length).toBeGreaterThan(5);
  }
});
