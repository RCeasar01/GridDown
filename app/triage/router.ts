/**
 * router.ts - Spots life-threatening situations in free text and points the user
 * at the matching triage tree BEFORE (and alongside) any AI answer.
 *
 * Deliberately simple and predictable: hand-written patterns, no model. It errs
 * toward showing a protocol card - a false positive costs one tap to ignore;
 * a false negative could cost a life. Patterns are tested in __tests__/triage.test.ts.
 */

export interface RouteMatch {
  treeId: string;
  /** The text that triggered the match (for debugging and tests). */
  matched: string;
}

interface Rule {
  treeId: string;
  /** Any of these matching triggers the rule. */
  any: RegExp[];
  /** Pairs: both halves must match somewhere in the text. */
  both?: Array<[RegExp, RegExp]>;
  /** If this matches, the rule is suppressed (e.g. "engine overheating"). */
  unless?: RegExp;
}

// Order = priority when several match. Not breathing beats everything.
const RULES: Rule[] = [
  {
    treeId: 'unresponsive-cpr',
    any: [
      /\b(not|isn'?t|is not|stopped|quit|no longer) breathing\b/,
      /\bno (pulse|heartbeat)\b/,
      /\bcan'?t (find|feel) (a |his |her |their )?(pulse|heartbeat)\b/,
      /\b(unresponsive|unconscious|cardiac arrest|heart stopped)\b/,
      /\bwo?n'?t (wake|respond)\b|\bwont (wake|respond)\b|\bnot (waking|responding)\b/,
      /\b(collapsed|passed out|blacked out|keeled over)\b/,
      /\b(drown(ed|ing)?)\b/,
      /\bcpr\b/,
    ],
  },
  {
    treeId: 'severe-bleeding',
    any: [
      /\b(hemorrhag\w*|haemorrhag\w*|arterial bleed\w*)\b/,
      /\b(amputat\w*|severed|cut off (his|her|their|my) (arm|leg|hand|foot|finger))\b/,
      /\btourniquet\b/,
    ],
    both: [
      [
        /\b(bleed\w*|blood\w*)\b/,
        /\b(heav(y|ily)|a lot|lots|tons|so much|everywhere|won'?t stop|wont stop|can'?t stop|not stopping|keeps? (coming|going)|spurt\w*|gush\w*|pump\w*|pour\w*|soak\w*|squirt\w*|severe\w*|bad(ly)?|pool\w*)\b/,
      ],
      [/\b(deep|bad|huge|big|large) (cut|gash|wound|laceration)\b/, /\b(bleed\w*|blood)\b/],
      [/\b(stab\w*|shot|gunshot|impaled)\b/, /\b(bleed\w*|blood|wound\w*|hurt|injur\w*)\b/],
    ],
  },
  {
    treeId: 'hypothermia',
    any: [
      /\bhypotherm\w*\b/,
      /\b(stopped|quit|can'?t stop|won'?t stop) shivering\b/,
      /\bshivering (uncontrollabl\w*|violently|badly|hard)\b/,
      /\bfell (in|into|through) (the )?(ice|icy|frozen|cold) ?\w*\b/,
      /\bfreezing to death\b/,
    ],
    both: [
      [/\b(cold|freezing|frozen|icy)\b/, /\b(confused|slurr\w*|stumbl\w*|drowsy|sleepy|clumsy|out of it)\b/],
      [/\b(soaked|drenched|wet)\b/, /\b(shiver\w*|shaking|teeth chattering)\b/],
    ],
  },
  {
    treeId: 'heat-illness',
    any: [
      /\bheat ?(stroke|exhaustion|illness|cramps)\b/,
      /\bsun ?stroke\b/,
      /\bstopped sweating\b/,
      /\boverheat\w*\b/,
    ],
    both: [
      [/\b(hot|heat|sun|scorching|hundred degrees|100 degrees)\b/, /\b(confused|dizzy|faint\w*|vomit\w*|throwing up|passed out|collapsed|delirious|acting (weird|strange)|seizure)\b/],
    ],
    unless: /\b(engine|car|truck|radiator|vehicle|motor|generator|laptop|phone|battery|computer|stove|food)\b/,
  },
  {
    treeId: 'snakebite',
    any: [
      /\bsnake ?bites?\b/,
      /\bsnake (bit|struck)\b/,
      /\bbit(ten)? by an? \w* ?snake\b/,
      /\b(rattlesnake|rattler|copperhead|cottonmouth|water moccasin|coral snake|pit ?viper)\b/,
    ],
  },
];

function firstMatch(text: string, rule: Rule): string | null {
  for (const re of rule.any) {
    const m = text.match(re);
    if (m) return m[0];
  }
  for (const [a, b] of rule.both ?? []) {
    const ma = text.match(a);
    const mb = text.match(b);
    if (ma && mb) return `${ma[0]} + ${mb[0]}`;
  }
  return null;
}

/**
 * Return matching triage trees for `text`, highest priority first.
 * @param availableIds limit results to trees this build can show.
 */
export function routeEmergency(text: string, availableIds?: string[]): RouteMatch[] {
  const t = ` ${text.toLowerCase().replace(/[\u2018\u2019]/g, "'")} `;
  const out: RouteMatch[] = [];
  for (const rule of RULES) {
    if (availableIds && !availableIds.includes(rule.treeId)) continue;
    const matched = firstMatch(t, rule);
    if (!matched) continue;
    if (rule.unless && rule.unless.test(t) && !rule.any.slice(0, 1).some((re) => re.test(t))) continue;
    out.push({ treeId: rule.treeId, matched });
  }
  return out;
}
