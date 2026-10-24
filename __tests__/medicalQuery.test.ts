import { isMedicalQuery, getRelatedGuide, MEDICAL_KEYWORD_TO_GUIDE } from '../app/utils/medicalQuery';
import { getGuideById } from '../app/utils/guideRegistry';

describe('isMedicalQuery', () => {
  test.each([
    'My friend is bleeding heavily from the leg',
    'How do I apply a tourniquet?',
    'He is unconscious and not breathing',
    'Treating a burn from a camp stove',
    'Is this fracture serious?',
    'signs of hypothermia in a child',
    'What do I do for a snake bite?',
    'CPR on an infant',
  ])('medical: %s', (q) => expect(isMedicalQuery(q)).toBe(true));

  test.each([
    'How do I signal a rescue helicopter?',
    'Which paint is best for a shelter roof?',
    'Build a hearth for the wood stove',
    'The deadline for the drill is tomorrow',
    'How do I remove a tree stump safely?',
    'How do I find water in the desert?',
    'Tornado warning and I live in an apartment',
  ])('not medical: %s', (q) => expect(isMedicalQuery(q)).toBe(false));
});

describe('getRelatedGuide', () => {
  test('maps the most specific keyword to a guide', () => {
    expect(getRelatedGuide('Massive bleeding, need a tourniquet')).toBe('medical-002');
    expect(getRelatedGuide('He is not breathing')).toBe('medical-007');
    expect(getRelatedGuide('Signs of shock after a fall')).toBe('medical-006');
    expect(getRelatedGuide('Finding water')).toBeNull();
    // no dedicated guide yet → null so the UI falls back to the retrieval hit
    expect(getRelatedGuide('How do I treat a burn?')).toBeNull();
    expect(getRelatedGuide('How do I splint a fracture?')).toBeNull();
  });
  test('every mapping points at a guide whose title is about that keyword', () => {
    const expectTitle: Record<string, RegExp> = {
      'medical-002': /tourniquet/i, 'medical-003': /wound/i, 'medical-006': /shock/i,
      'medical-007': /airway/i, 'medical-008': /rehydration/i, 'medical-014': /triage/i,
    };
    for (const [kw, id] of Object.entries(MEDICAL_KEYWORD_TO_GUIDE)) {
      const g = getGuideById(id);
      expect(g).toBeTruthy();
      expect(g!.title).toMatch(expectTitle[id]);
      void kw;
    }
  });
});
