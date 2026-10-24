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
 * Keyword → the guide that covers it (titles asserted in tests). Most-specific
 * keywords first. Guide ids come from GridDown-Library v2.
 */
export const MEDICAL_KEYWORD_TO_GUIDE: Record<string, string> = {
  tourniquet: 'medical-002',          // Tourniquet Application
  bleeding: 'medical-002',
  bleed: 'medical-002',
  hemorrhage: 'medical-002',
  haemorrhage: 'medical-002',
  wound: 'medical-003',               // Wound Packing
  cpr: 'medical-015',                 // CPR and AED
  cardiac: 'medical-015',
  'not breathing': 'medical-015',
  choking: 'medical-016',             // Choking
  burn: 'medical-017',                // Burns
  burns: 'medical-017',
  scald: 'medical-017',
  fracture: 'medical-018',            // Fractures and Improvised Splinting
  fractured: 'medical-018',
  'broken bone': 'medical-018',
  splint: 'medical-018',
  airway: 'medical-007',              // Airway Management Without Equipment
  breathing: 'medical-007',
  shock: 'medical-006',               // Shock
  'heart attack': 'medical-040',      // Heart Attack
  heart: 'medical-040',
  stroke: 'medical-041',              // Stroke - BE FAST
  anaphylaxis: 'medical-042',         // Anaphylaxis and Epinephrine
  allergic: 'medical-042',
  epipen: 'medical-042',
  seizure: 'medical-044',             // Seizures
  diabetic: 'medical-045',            // Diabetic Emergencies
  insulin: 'medical-045',
  'blood sugar': 'medical-045',
  overdose: 'medical-046',            // Poisoning and Overdose
  poisoning: 'medical-046',
  poisoned: 'medical-046',
  naloxone: 'medical-046',
  snakebite: 'medical-048',           // Snakebite - North America
  'snake bite': 'medical-048',
  infection: 'medical-058',           // Infection and Sepsis Recognition
  infected: 'medical-058',
  sepsis: 'medical-058',
  fever: 'health-006',                // Respiratory Infections and Fever
  triage: 'medical-014',              // Mass Casualty Triage - START
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
