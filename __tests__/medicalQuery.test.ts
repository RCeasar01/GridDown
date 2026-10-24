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
    expect(getRelatedGuide('He is not breathing')).toBe('medical-015');
    expect(getRelatedGuide('Signs of shock after a fall')).toBe('medical-006');
    expect(getRelatedGuide('How do I treat a burn?')).toBe('medical-017');
    expect(getRelatedGuide('How do I splint a fracture?')).toBe('medical-018');
    expect(getRelatedGuide('What do I do for a snake bite?')).toBe('medical-048');
    expect(getRelatedGuide('Finding water')).toBeNull();
  });
  test('every mapping points at a guide whose title is about that keyword', () => {
    const expectTitle: Record<string, RegExp> = {
      'medical-002': /tourniquet/i, 'medical-003': /wound/i, 'medical-006': /shock/i, 'medical-007': /airway/i,
      'medical-008': /rehydration/i, 'medical-014': /triage/i, 'medical-015': /cpr/i, 'medical-016': /choking/i,
      'medical-017': /burns?/i, 'medical-018': /fracture/i, 'medical-040': /heart attack/i, 'medical-041': /stroke/i,
      'medical-042': /anaphylaxis/i, 'medical-044': /seizure/i, 'medical-045': /diabetic/i, 'medical-046': /poisoning|overdose/i,
      'medical-048': /snakebite/i, 'medical-058': /infection|sepsis/i, 'health-006': /fever/i,
    };
    for (const id of new Set(Object.values(MEDICAL_KEYWORD_TO_GUIDE))) {
      const g = getGuideById(id);
      expect(g).toBeTruthy();
      expect(expectTitle[id]).toBeTruthy();
      expect(g!.title).toMatch(expectTitle[id]);
    }
  });
});
