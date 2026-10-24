import { retrieveGuides, tokenize, buildExcerpt } from '../app/utils/guideRetrieval';
import { getAllGuides } from '../app/utils/guideRegistry';

describe('tokenize', () => {
  test('lowercases, strips punctuation, drops stop words, stems plurals', () => {
    expect(tokenize('How do I purify Water from streams?')).toEqual(['purify', 'water', 'stream']);
  });
});

describe('retrieveGuides', () => {
  test('finds water guides for a water question', () => {
    const r = retrieveGuides('how do I purify water from a stream');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].guide.category).toBe('water');
  });

  test('finds the medical guide for a chest wound', () => {
    const r = retrieveGuides('sucking chest wound and I have no medical kit');
    expect(r[0].guide.category).toBe('medical');
  });

  test('returns nothing for an off-topic question', () => {
    expect(retrieveGuides('what is the capital of France')).toEqual([]);
  });

  test('never returns more than k results, ordered by score', () => {
    const r = retrieveGuides('fire shelter water food', { k: 2 });
    expect(r.length).toBeLessThanOrEqual(2);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });
});

describe('buildExcerpt', () => {
  test('stays within the character budget and names the guide', () => {
    const g = getAllGuides()[0];
    const e = buildExcerpt(g, 600);
    expect(e.startsWith(`GUIDE: ${g.title}`)).toBe(true);
    expect(e.length).toBeLessThanOrEqual(800);
  });
});
