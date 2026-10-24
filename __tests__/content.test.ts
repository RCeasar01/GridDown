/**
 * Content integrity — every guide the app ships must be complete and consistent.
 * A broken guide is a broken product in the field, so this runs in CI.
 */
import { getAllGuides, getGuideById } from '../app/utils/guideRegistry';

const guides = getAllGuides();

describe('guide library', () => {
  test('has a substantial library', () => {
    expect(guides.length).toBeGreaterThanOrEqual(80);
  });

  test('every guide id is unique', () => {
    const ids = guides.map((g) => g.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  test.each(guides.map((g) => [g.id, g]))('%s has required fields', (_id, g) => {
    expect(g.title.trim().length).toBeGreaterThan(3);
    expect(g.category.trim().length).toBeGreaterThan(0);
    expect(['critical', 'advanced', 'beginner']).toContain(g.priority);
    expect(Array.isArray(g.steps)).toBe(true);
    expect(g.steps.length).toBeGreaterThan(0);
    for (const s of g.steps) {
      expect(s.title.trim().length).toBeGreaterThan(0);
      expect(s.body.trim().length).toBeGreaterThan(20);
    }
    expect(Array.isArray(g.tags)).toBe(true);
  });

  test('no placeholder text slipped into content', () => {
    const bad = /lorem ipsum|TODO|TBD|placeholder|xxx/i;
    const hits = guides.filter((g) => bad.test(JSON.stringify(g)));
    expect(hits.map((g) => g.id)).toEqual([]);
  });

  test('relatedGuides only reference guides that exist', () => {
    const broken: string[] = [];
    for (const g of guides) {
      for (const rel of g.relatedGuides ?? []) {
        if (!getGuideById(rel)) broken.push(`${g.id} -> ${rel}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('medical guides carry a disclaimer flag or whenNotTo guidance', () => {
    const medical = guides.filter((g) => g.category === 'medical');
    expect(medical.length).toBeGreaterThan(0);
    const missing = medical.filter((g) => !g.requiresMedicalDisclaimer && !(g.whenNotTo && g.whenNotTo.length));
    expect(missing.map((g) => g.id)).toEqual([]);
  });
});
