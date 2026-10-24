import { ALL_TREES, getAvailableTrees } from '../app/triage/registry';
import { validateTree } from '../app/triage/validate';
import {
  startSession, choose, advance, back, currentNode, isFinished, handoffLog, canGoBack,
} from '../app/triage/engine';
import { routeEmergency } from '../app/triage/router';
import { getGuideById } from '../app/utils/guideRegistry';
import type { TriageTree } from '../app/triage/types';

const ids = ALL_TREES.map((t) => t.id);

describe('triage trees - structure', () => {
  test.each(ALL_TREES.map((t) => [t.id, t] as const))('%s is valid', (_id, tree) => {
    const result = validateTree(tree, ids);
    expect(result.errors).toEqual([]);
  });

  test('tree ids are unique', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every guideId link points at a real guide', () => {
    for (const tree of ALL_TREES) {
      for (const node of tree.nodes) {
        if ('guideId' in node && node.guideId) {
          expect({ tree: tree.id, node: node.id, found: !!getGuideById(node.guideId) })
            .toEqual({ tree: tree.id, node: node.id, found: true });
        }
      }
    }
  });

  test('every tree has at least one critical or evacuate ending', () => {
    for (const tree of ALL_TREES) {
      const outcomes = tree.nodes.filter((n) => n.type === 'end').map((n) => (n as { outcome: string }).outcome);
      expect(outcomes.some((o) => o === 'critical' || o === 'evacuate')).toBe(true);
    }
  });
});

describe('release gate', () => {
  test('draft trees are hidden when drafts are excluded', () => {
    const shipped = getAvailableTrees({ includeDrafts: false });
    expect(shipped.every((t) => t.reviewStatus === 'reviewed')).toBe(true);
  });

  test('drafts are visible when included', () => {
    expect(getAvailableTrees({ includeDrafts: true }).length).toBe(ALL_TREES.length);
  });
});

describe('validator catches broken trees', () => {
  const base: TriageTree = {
    id: 't', title: 'T', summary: '', icon: 'x', schemaVersion: 1, version: '0.0.1',
    sources: ['test'], reviewStatus: 'draft', firstLine: 'x', startNode: 'q',
    nodes: [
      { type: 'question', id: 'q', prompt: '?', options: [{ label: 'a', next: 'e' }, { label: 'b', next: 'e' }] },
      { type: 'end', id: 'e', title: 'E', steps: [], outcome: 'stable' },
    ],
  };

  test('good tree passes', () => expect(validateTree(base).ok).toBe(true));

  test('dangling next', () => {
    const t = { ...base, nodes: [{ ...base.nodes[0], options: [{ label: 'a', next: 'nope' }, { label: 'b', next: 'e' }] }, base.nodes[1]] } as TriageTree;
    expect(validateTree(t).errors.join()).toMatch(/does not exist/);
  });

  test('loop with no exit', () => {
    const t: TriageTree = {
      ...base,
      nodes: [
        ...base.nodes,
        { type: 'action', id: 'x', title: 'X', steps: ['s'], next: 'y' },
        { type: 'action', id: 'y', title: 'Y', steps: ['s'], next: 'x' },
      ],
    };
    const errs = validateTree(t).errors.join();
    expect(errs).toMatch(/unreachable/);
    expect(errs).toMatch(/never reach an end/);
  });

  test('reviewed without reviewer', () => {
    expect(validateTree({ ...base, reviewStatus: 'reviewed' }).ok).toBe(false);
  });

  test('missing sources', () => {
    expect(validateTree({ ...base, sources: [] }).ok).toBe(false);
  });
});

describe('engine', () => {
  const bleed = ALL_TREES.find((t) => t.id === 'severe-bleeding')!;

  test('walks the tourniquet path to an end', () => {
    let s = startSession(bleed, 0);
    expect(currentNode(bleed, s).id).toBe('q-life-threat');
    s = choose(bleed, s, 0); // yes, life-threatening
    s = choose(bleed, s, 0); // arm or leg
    s = choose(bleed, s, 0); // have tourniquet
    expect(currentNode(bleed, s).id).toBe('a-tourniquet');
    s = advance(bleed, s);
    s = choose(bleed, s, 0); // stopped
    s = advance(bleed, s); // shock care
    expect(isFinished(bleed, s)).toBe(true);
    expect(currentNode(bleed, s).id).toBe('e-controlled');
    const log = handoffLog(bleed, s);
    expect(log).toMatch(/Did: Apply the tourniquet/);
    expect(log).toMatch(/Result: Bleeding controlled/);
  });

  test('back undoes the last answer', () => {
    let s = startSession(bleed, 0);
    s = choose(bleed, s, 0);
    expect(canGoBack(s)).toBe(true);
    s = back(s);
    expect(currentNode(bleed, s).id).toBe('q-life-threat');
    expect(s.answers).toEqual({});
    expect(back(s)).toBe(s);
  });

  test('rejects wrong-node operations', () => {
    const s = startSession(bleed, 0);
    expect(() => advance(bleed, s)).toThrow();
    expect(() => choose(bleed, s, 9)).toThrow();
  });
});

describe('emergency router', () => {
  const top = (text: string) => routeEmergency(text)[0]?.treeId ?? null;

  test.each([
    ['my buddy cut his leg on sheet metal, it is pumping blood', 'severe-bleeding'],
    ['he is bleeding a lot and it won\'t stop', 'severe-bleeding'],
    ['how do I put on a tourniquet', 'severe-bleeding'],
    ['she got stabbed and is bleeding', 'severe-bleeding'],
    ['deep gash on my arm, blood everywhere', 'severe-bleeding'],
    ['my dad collapsed and is not breathing', 'unresponsive-cpr'],
    ['he won\u2019t wake up', 'unresponsive-cpr'],
    ['kid pulled from the pool, drowning', 'unresponsive-cpr'],
    ['how do you do cpr', 'unresponsive-cpr'],
    ['she fell through the ice and is shivering uncontrollably', 'hypothermia'],
    ['he stopped shivering and is acting confused in the cold', 'hypothermia'],
    ['we are soaked and shivering', 'hypothermia'],
    ['I think my friend has heat stroke', 'heat-illness'],
    ['it is 100 degrees and she is dizzy and throwing up', 'heat-illness'],
    ['my son got bit by a rattlesnake', 'snakebite'],
    ['snake bite on my ankle', 'snakebite'],
    ['I was bitten by a snake', 'snakebite'],
  ])('"%s" -> %s', (text, expected) => {
    expect(routeEmergency(text).map((m) => m.treeId)).toContain(expected);
  });

  test('not breathing outranks everything', () => {
    expect(top('collapsed from heat stroke and not breathing')).toBe('unresponsive-cpr');
  });

  test.each([
    'how do I purify water',
    'best way to start a fire in the rain',
    'my engine is overheating on the highway',
    'how cold does it get in the desert at night',
    'what is a good blood type for donating',
    'the wood is wet and it is cold out',
    'how do I store food long term',
  ])('no route for "%s"', (text) => {
    expect(routeEmergency(text)).toEqual([]);
  });

  test('respects available tree ids', () => {
    expect(routeEmergency('snake bite', ['severe-bleeding'])).toEqual([]);
  });
});
