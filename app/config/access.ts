/**
 * access.ts — the ONE place that decides what each plan unlocks.
 *
 * Turning a paywall on or off is a one-line change in FEATURE_TIER below; every screen asks
 * `canUse(feature, tier)` (or the store's `hasFeature`) instead of hard-coding tier lists.
 *
 * TEST BUILDS: set EXPO_PUBLIC_UNLOCK_ALL=1 (in .env.local, or `-UnlockAll` on build-android.ps1)
 * and every gate opens regardless of purchases. A banner on Home and Settings shows it is on.
 * Never ship a store build with it set — build-android.ps1 refuses to make a Play AAB with it.
 *
 * Plans → internal tiers (RevenueCat entitlements map onto these in utils/purchases.ts):
 *   Free      'free'
 *   Pro       'monthly' | 'yearly' | 'lifetime_standard'   (rank ≥ PRO)
 *   Pro + AI  'extreme_monthly' | 'extreme_yearly' | 'extreme_lifetime'   (rank ≥ PRO_AI)
 */
import type { UserTier } from '../store/useAppStore';

/** Inlined at build time by Expo. '1' / 'true' unlocks every feature (testing only). */
export const UNLOCK_ALL = ['1', 'true', 'yes'].includes(
  String(process.env.EXPO_PUBLIC_UNLOCK_ALL ?? '').trim().toLowerCase(),
);

export const TIER_RANK: Record<UserTier, number> = {
  free: 0, discord: 1, monthly: 2, yearly: 3,
  lifetime_standard: 4, extreme_monthly: 5, extreme_yearly: 6, extreme_lifetime: 7,
};

/** Minimum tier for each plan level. */
export const PLAN = { FREE: 'free', PRO: 'monthly', PRO_AI: 'extreme_monthly' } as const satisfies Record<string, UserTier>;

export type Feature =
  | 'guides.core'        // guides in FREE_GUIDE_CATEGORIES + every guide Emergency Mode links to
  | 'guides.premium'     // every other guide
  | 'quizzes.core'       // quizzes in FREE_QUIZ_CATEGORIES
  | 'quizzes.premium'    // all other quiz categories (and the Daily Drill in them)
  | 'tools.hamRepeaters'
  | 'tools.other'        // Morse, position, star map, translator, calculators, knots, signaling…
  | 'plan.kits'          // My Kit + gear inventory
  | 'plan.flows'         // Real-World Flows
  | 'plan.checklists'
  | 'plan.familyPlanner'
  | 'advisor';           // on-device Field Intelligence

/**
 * ── PAYWALL SWITCHBOARD ─────────────────────────────────────────────────────────
 * Current launch decision (2026-10-24): guides and tools stay open; Pro sells the full quiz
 * library + HAM database; Pro + AI sells the Advisor. To put a feature behind a paywall,
 * change its value to PLAN.PRO or PLAN.PRO_AI — the lock screens and paywall routing already
 * exist for every feature in this list. Update PaywallScreen's plan feature lists to match.
 */
export const FEATURE_TIER: Record<Feature, UserTier> = {
  'guides.core': PLAN.FREE,
  'guides.premium': PLAN.FREE,       // ← PLAN.PRO to lock guides outside the free categories
  'quizzes.core': PLAN.FREE,
  'quizzes.premium': PLAN.PRO,
  'tools.hamRepeaters': PLAN.PRO,
  'tools.other': PLAN.FREE,
  'plan.kits': PLAN.FREE,
  'plan.flows': PLAN.FREE,
  'plan.checklists': PLAN.FREE,
  'plan.familyPlanner': PLAN.FREE,
  advisor: PLAN.PRO_AI,
};

/** Display name used on lock screens and the paywall banner. */
export const FEATURE_LABEL: Record<Feature, string> = {
  'guides.core': 'Core guides',
  'guides.premium': 'The full guide library',
  'quizzes.core': 'Core quizzes',
  'quizzes.premium': 'All quiz categories',
  'tools.hamRepeaters': 'HAM repeater database',
  'tools.other': 'Offline tools',
  'plan.kits': 'My Kit & gear inventory',
  'plan.flows': 'Real-World Flows',
  'plan.checklists': 'Checklists',
  'plan.familyPlanner': 'Family Planner',
  advisor: 'Field Intelligence AI',
};

export const FREE_GUIDE_CATEGORIES = ['water', 'fire', 'shelter', 'medical'];
export const FREE_QUIZ_CATEGORIES = ['water', 'fire', 'shelter'];

/**
 * Guides that must never be locked: everything Emergency Mode, the triage protocols and the
 * Advisor's medical "View guide" button can open. Locking a bleeding-control guide behind a
 * purchase is a safety and store-review problem, whatever FEATURE_TIER says.
 */
export const ALWAYS_FREE_GUIDE_IDS = new Set<string>([
  'medical-002', 'medical-003', 'medical-004', 'medical-006', 'medical-007', 'medical-008',
  'medical-014', 'medical-015', 'medical-016', 'medical-017', 'medical-018', 'medical-040',
  'medical-041', 'medical-042', 'medical-044', 'medical-045', 'medical-046', 'medical-047',
  'medical-048', 'medical-058', 'health-006',
  // Emergency Mode card links (non-medical) — Emergency Mode is free, so its links must open
  'water-001', 'fire-001', 'shelter-001', 'comms-001', 'comms-003', 'nav-008',
  'dis-001', 'dis-002', 'dis-004', 'dis-006', 'disaster-007',
]);

function rank(tier: UserTier): number {
  return TIER_RANK[tier] ?? 0;
}

/** True when `tier` may use `feature`. Always true in UNLOCK_ALL test builds. */
export function canUse(feature: Feature, tier: UserTier): boolean {
  if (UNLOCK_ALL) return true;
  return rank(tier) >= rank(FEATURE_TIER[feature]);
}

/** Which gate a guide falls under. */
export function guideFeature(guide: { id: string; category: string }): Feature {
  if (ALWAYS_FREE_GUIDE_IDS.has(guide.id) || FREE_GUIDE_CATEGORIES.includes(guide.category)) {
    return 'guides.core';
  }
  return 'guides.premium';
}

export function canOpenGuide(guide: { id: string; category: string }, tier: UserTier): boolean {
  return canUse(guideFeature(guide), tier);
}

export function quizFeature(category: string): Feature {
  return FREE_QUIZ_CATEGORIES.includes(category) ? 'quizzes.core' : 'quizzes.premium';
}

/** Plan name a user needs for a feature ("Pro" / "Pro + AI"), for lock-screen copy. */
export function requiredPlanName(feature: Feature): string {
  const r = rank(FEATURE_TIER[feature]);
  if (r >= rank(PLAN.PRO_AI)) return 'Pro + AI';
  if (r >= rank(PLAN.PRO)) return 'Pro';
  return 'Free';
}
