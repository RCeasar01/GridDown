/**
 * medicalQuery.ts — decides when a Field Intelligence question is medical, which
 * adds the "guide reference only" footer and a related-guide link.
 *
 * Whole-word matching with common inflections. The old substring check flagged
 * "paint", "hearth", "deadline" and anything about a *rescue* helicopter.
 */
export const MEDICAL_KEYWORDS = [
  'blood', 'wound', 'bleed', 'bleeding', 'injury', 'injured', 'hurt', 'pain',
  'tourniquet', 'airway', 'breathing', 'pulse', 'shock',
  'unconscious', 'unresponsive', 'seizure', 'stroke', 'heart',
  'cardiac', 'chest', 'fracture', 'fractured', 'broken bone', 'burn', 'poisoning', 'poisoned', 'overdose',
  'allergic', 'anaphylaxis', 'cpr', 'dying', 'dead',
  'triage', 'medic', 'medical', 'hemorrhage', 'haemorrhage', 'trauma', 'surgery', 'stitch',
  'suture', 'splint', 'infection', 'infected', 'fever', 'diabetic', 'insulin',
  'hypothermia', 'heatstroke', 'heat stroke', 'frostbite', 'snakebite', 'snake bite', 'choking', 'concussion',
] as const;

/** Keyword → the guide that best answers it. First match wins (listed by specificity). */
export const MEDICAL_KEYWORD_TO_GUIDE: Record<string, string> = {
  tourniquet: 'medical-002',
  bleeding: 'medical-002',
  bleed: 'medical-002',
  hemorrhage: 'medical-002',
  wound: 'medical-003',
  airway: 'medical-001',
  breathing: 'medical-001',
  cpr: 'medical-006',
  shock: 'medical-004',
  triage: 'medical-001',
  burn: 'medical-005',
  fracture: 'medical-007',
  fractured: 'medical-007',
  'broken bone': 'medical-007',
  splint: 'medical-007',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whole words, allowing plural / past / -ing forms. */
const wordRe = (kw: string) => new RegExp(`\\b${escape(kw)}(?:s|es|ed|ing)?\\b`, 'i');

const KEYWORD_RES = MEDICAL_KEYWORDS.map((k) => wordRe(k));
const GUIDE_RES = Object.entries(MEDICAL_KEYWORD_TO_GUIDE).map(([k, g]) => [wordRe(k), g] as const);

export function isMedicalQuery(text: string): boolean {
  return KEYWORD_RES.some((re) => re.test(text));
}

export function getRelatedGuide(text: string): string | null {
  for (const [re, guideId] of GUIDE_RES) {
    if (re.test(text)) return guideId;
  }
  return null;
}
