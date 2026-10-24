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

/**
 * Keyword → the guide that actually covers it (verified against titles in tests).
 * Keywords with no dedicated guide yet (burn, fracture, CPR, hypothermia, snakebite…)
 * are deliberately absent: the answer then links the top retrieval hit instead of a
 * wrong guide. Those gaps are listed in the launch checklist as 1.1 content work.
 */
export const MEDICAL_KEYWORD_TO_GUIDE: Record<string, string> = {
  tourniquet: 'medical-002',   // Tourniquet Application
  bleeding: 'medical-002',
  bleed: 'medical-002',
  hemorrhage: 'medical-002',
  haemorrhage: 'medical-002',
  wound: 'medical-003',        // Wound Packing
  airway: 'medical-007',       // Airway Management Without Equipment
  breathing: 'medical-007',
  choking: 'medical-007',
  shock: 'medical-006',        // Shock — Recognition and Management
  triage: 'medical-014',       // Mass Casualty Triage — START Protocol
  'oral rehydration': 'medical-008',
  dehydration: 'medical-008',
  dehydrated: 'medical-008',
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
