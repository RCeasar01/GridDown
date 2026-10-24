import { retrieveGuides, tokenize, buildExcerpt } from '../app/utils/guideRetrieval';
import { getAllGuides } from '../app/utils/guideRegistry';

describe('tokenize', () => {
  test('lowercases, strips punctuation, drops stop words, stems plurals', () => {
    expect(tokenize('How do I purify Water from streams?')).toEqual(['purify', 'water', 'stream']);
  });
  test('formal and everyday forms meet: purification/purify, filtration/filter, hemorrhage/bleeding', () => {
    expect(tokenize('purification')).toEqual(tokenize('purified'));
    expect(tokenize('filtration')).toEqual(tokenize('filters'));
    expect(tokenize('hemorrhage')).toEqual(tokenize('bleeding'));
    expect(tokenize('shelters')).toEqual(tokenize('sheltering'));
    expect(tokenize('treatment')).toEqual(tokenize('treated'));
    expect(tokenize('navigation')).toEqual(tokenize('navigate'));
  });
  test('short words survive stemming', () => {
    expect(tokenize('water waters fires tubes feed')).toEqual(['water', 'water', 'fire', 'tube', 'feed']);
  });
  test('question noise is dropped', () => {
    expect(tokenize('What do I do right now?')).toEqual([]);
  });
});

describe('retrieveGuides', () => {
  test('finds water guides for a water question (all top-3 are water purification)', () => {
    const r = retrieveGuides('how do I purify water from a stream');
    expect(r.length).toBe(3);
    for (const x of r) expect(x.guide.category).toBe('water');
  });

  test('a tornado question leads with the tornado guide', () => {
    expect(retrieveGuides('Tornado warning and I live in an apartment. What do I do right now?')[0].guide.id).toBe('dis-002');
  });

  test('a dead car battery finds the jump-start guide first', () => {
    expect(retrieveGuides('car battery dead in winter')[0].guide.id).toBe('vehicle-002');
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
