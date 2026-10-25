/**
 * products.ts — store product IDs and RevenueCat entitlements, in one place.
 *
 * Canonical setup (store-assets/REVENUECAT_SETUP.md): price-free product IDs, so prices can
 * change without renaming anything, and two entitlements — `pro` and `extreme` (shown to
 * customers as "Pro + AI"). The older price-encoded IDs and per-plan entitlements are still
 * accepted so nothing breaks if a product was already created under the old scheme.
 *
 * Google Play subscriptions are reported by RevenueCat as "<productId>:<basePlanId>"; matching
 * ignores the ":basePlan" suffix.
 */
import type { UserTier } from '../store/useAppStore';

export type PlanId = 'pro' | 'pro_ai';
export type Cycle = 'monthly' | 'yearly' | 'lifetime';

/** Every product identifier that should count as (plan, cycle). First entry per platform is canonical. */
export const PRODUCT_IDS: Record<PlanId, Record<Cycle, string[]>> = {
  pro: {
    monthly: ['com.bannedproduct.griddown.monthly', 'griddown_pro_monthly', 'griddown_monthly_399'],
    yearly: ['com.bannedproduct.griddown.yearly', 'griddown_pro_yearly', 'griddown_yearly_2999'],
    lifetime: ['com.bannedproduct.griddown.lifetime', 'griddown_pro_lifetime', 'griddown_lifetime_standard_7999'],
  },
  pro_ai: {
    monthly: ['com.bannedproduct.griddown.extreme_monthly', 'griddown_extreme_monthly', 'griddown_extreme_monthly_999'],
    yearly: ['com.bannedproduct.griddown.extreme_yearly', 'griddown_extreme_yearly', 'griddown_extreme_yearly_6999'],
    lifetime: ['com.bannedproduct.griddown.extreme_lifetime', 'griddown_extreme_lifetime', 'griddown_extreme_lifetime_14999'],
  },
};

/** RevenueCat default package identifiers, used when a product ID matches nothing above. */
const PACKAGE_IDS: Record<PlanId, Record<Cycle, string[]>> = {
  pro: { monthly: ['$rc_monthly'], yearly: ['$rc_annual'], lifetime: ['$rc_lifetime'] },
  pro_ai: { monthly: ['extreme_monthly'], yearly: ['extreme_annual', 'extreme_yearly'], lifetime: ['extreme_lifetime'] },
};

const TIER_FOR: Record<PlanId, Record<Cycle, UserTier>> = {
  pro: { monthly: 'monthly', yearly: 'yearly', lifetime: 'lifetime_standard' },
  pro_ai: { monthly: 'extreme_monthly', yearly: 'extreme_yearly', lifetime: 'extreme_lifetime' },
};

/** Strip Google Play's ":basePlanId" suffix. */
export function baseProductId(identifier: string): string {
  return identifier.split(':')[0];
}

/** (plan, cycle) for a store product identifier, or null if it isn't one of ours. */
export function classifyProduct(identifier: string): { plan: PlanId; cycle: Cycle } | null {
  const id = baseProductId(identifier);
  for (const plan of Object.keys(PRODUCT_IDS) as PlanId[]) {
    for (const cycle of Object.keys(PRODUCT_IDS[plan]) as Cycle[]) {
      if (PRODUCT_IDS[plan][cycle].includes(id)) return { plan, cycle };
    }
  }
  return null;
}

interface PackageLike { identifier: string; product: { identifier: string; priceString?: string } }

/** Find the package to buy for (plan, cycle) among RevenueCat packages. */
export function findPackage<P extends PackageLike>(packages: P[], plan: PlanId, cycle: Cycle): P | undefined {
  const ids = PRODUCT_IDS[plan][cycle];
  return (
    packages.find((p) => ids.includes(baseProductId(p.product.identifier))) ??
    packages.find((p) => PACKAGE_IDS[plan][cycle].includes(p.identifier))
  );
}

/** Live localized price per (plan, cycle) from the store, for the paywall labels. */
export function priceTable(packages: PackageLike[]): Partial<Record<`${PlanId}.${Cycle}`, string>> {
  const out: Partial<Record<`${PlanId}.${Cycle}`, string>> = {};
  for (const plan of ['pro', 'pro_ai'] as PlanId[]) {
    for (const cycle of ['monthly', 'yearly', 'lifetime'] as Cycle[]) {
      const pkg = findPackage(packages, plan, cycle);
      if (pkg?.product.priceString) out[`${plan}.${cycle}`] = pkg.product.priceString;
    }
  }
  return out;
}

/** Entitlement ID → tier for the per-plan (legacy) entitlement scheme. */
const LEGACY_ENTITLEMENTS: Record<string, UserTier> = {
  monthly_access: 'monthly',
  yearly_access: 'yearly',
  lifetime_standard: 'lifetime_standard',
  discord_only: 'discord',
  discord: 'discord',
  extreme_monthly: 'extreme_monthly',
  extreme_yearly: 'extreme_yearly',
  extreme_lifetime: 'extreme_lifetime',
};

/**
 * Tier for one active entitlement. With the canonical `pro` / `extreme` entitlements the cycle
 * comes from the product that granted it (so lifetime buyers are recognised as lifetime).
 */
export function tierForEntitlement(entitlementId: string, productIdentifier?: string): UserTier | null {
  if (LEGACY_ENTITLEMENTS[entitlementId]) return LEGACY_ENTITLEMENTS[entitlementId];
  const plan: PlanId | null = entitlementId === 'pro' ? 'pro' : entitlementId === 'extreme' || entitlementId === 'pro_ai' ? 'pro_ai' : null;
  if (!plan) return null;
  const cls = productIdentifier ? classifyProduct(productIdentifier) : null;
  const cycle: Cycle = cls?.cycle ?? (productIdentifier && /life/i.test(productIdentifier) ? 'lifetime' : productIdentifier && /year|annual/i.test(productIdentifier) ? 'yearly' : 'monthly');
  return TIER_FOR[plan][cycle];
}
