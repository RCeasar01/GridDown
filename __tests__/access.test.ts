/* eslint-disable @typescript-eslint/no-var-requires -- Node built-ins + jest.isolateModules need require() */
/**
 * Paywall switchboard + guide links that must never break.
 *
 * - every guide id hard-coded in a screen resolves (Emergency Mode shipped six dead links once
 *   after the library renamed ids)
 * - every always-free guide exists, and every guide Emergency Mode links to is always free
 * - the current launch decision: guides/tools open, Pro = quizzes + HAM, Pro + AI = Advisor
 */
import { getGuideById } from '../app/utils/guideRegistry';

// Node built-ins without @types/node (the app tsconfig targets React Native). Jest runs from the repo root.
const fs: { readFileSync(p: string, enc: string): string } = require('fs');
const path: { resolve(...p: string[]): string } = require('path');
const read = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');

function linkedGuideIds(file: string): string[] {
  const src = read(file);
  return [...src.matchAll(/guideId:\s*'([^']+)'/g)].map((m) => m[1]);
}

describe('hard-coded guide links resolve', () => {
  const files = ['app/screens/EmergencyModeScreen.tsx'];
  for (const f of files) {
    test.each(linkedGuideIds(f).map((id) => [id]))(`${f} → %s exists`, (id) => {
      expect(getGuideById(id)).toBeTruthy();
    });
  }
  test('medicalQuery keyword map targets exist', () => {
    const ids = [...read('app/utils/medicalQuery.ts').matchAll(/'((?:medical|health)-\d+)'/g)].map((m) => m[1]);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) expect(getGuideById(id)).toBeTruthy();
  });
});

describe('access switchboard (normal build)', () => {
  const OLD = process.env.EXPO_PUBLIC_UNLOCK_ALL;
  let access: typeof import('../app/config/access');
  beforeAll(() => {
    delete process.env.EXPO_PUBLIC_UNLOCK_ALL;
    jest.isolateModules(() => { access = require('../app/config/access'); });
  });
  afterAll(() => { if (OLD !== undefined) process.env.EXPO_PUBLIC_UNLOCK_ALL = OLD; });

  test('unlock-all is off unless explicitly set', () => {
    expect(access.UNLOCK_ALL).toBe(false);
  });

  test('every always-free guide exists', () => {
    for (const id of access.ALWAYS_FREE_GUIDE_IDS) expect(getGuideById(id)).toBeTruthy();
  });

  test('every guide Emergency Mode links to stays free even if guides get locked', () => {
    for (const id of linkedGuideIds('app/screens/EmergencyModeScreen.tsx')) {
      const g = getGuideById(id)!;
      expect([id, access.guideFeature(g)]).toEqual([id, 'guides.core']);
    }
  });

  test('launch decision: guides + tools open, quizzes/HAM Pro, Advisor Pro + AI', () => {
    expect(access.canOpenGuide({ id: 'power-001', category: 'power' }, 'free')).toBe(true);
    expect(access.canUse('tools.other', 'free')).toBe(true);
    expect(access.canUse('quizzes.core', 'free')).toBe(true);
    expect(access.canUse('quizzes.premium', 'free')).toBe(false);
    expect(access.canUse('quizzes.premium', 'monthly')).toBe(true);
    expect(access.canUse('tools.hamRepeaters', 'free')).toBe(false);
    expect(access.canUse('tools.hamRepeaters', 'lifetime_standard')).toBe(true);
    expect(access.canUse('advisor', 'yearly')).toBe(false);
    expect(access.canUse('advisor', 'extreme_monthly')).toBe(true);
    expect(access.requiredPlanName('advisor')).toBe('Pro + AI');
    expect(access.requiredPlanName('quizzes.premium')).toBe('Pro');
  });
});

describe('access switchboard (test build)', () => {
  test('EXPO_PUBLIC_UNLOCK_ALL=1 opens every gate for a free user', () => {
    const OLD = process.env.EXPO_PUBLIC_UNLOCK_ALL;
    process.env.EXPO_PUBLIC_UNLOCK_ALL = '1';
    jest.isolateModules(() => {
      const a = require('../app/config/access') as typeof import('../app/config/access');
      expect(a.UNLOCK_ALL).toBe(true);
      for (const f of Object.keys(a.FEATURE_TIER)) expect(a.canUse(f as never, 'free')).toBe(true);
    });
    if (OLD === undefined) delete process.env.EXPO_PUBLIC_UNLOCK_ALL; else process.env.EXPO_PUBLIC_UNLOCK_ALL = OLD;
  });
});
