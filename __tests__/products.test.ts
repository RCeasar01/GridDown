/**
 * Store product + entitlement mapping (config/products.ts). If this is wrong, a paying
 * customer stays on Free — so every ID scheme we've documented is pinned here.
 */
import { classifyProduct, findPackage, priceTable, tierForEntitlement, founderPricingActive, FOUNDER_PRICING_ENDS } from '../app/config/products';
import { mapEntitlementToTier } from '../app/utils/purchases';

jest.mock('../app/db/contentLoader', () => ({ setUserTier: jest.fn() }));

const pkg = (identifier: string, product: string, priceString = '$1') => ({ identifier, product: { identifier: product, priceString } });

describe('classifyProduct', () => {
  test.each([
    ['com.bannedproduct.griddown.monthly', 'pro', 'monthly'],
    ['griddown_pro_yearly', 'pro', 'yearly'],
    ['griddown_pro_monthly:monthly', 'pro', 'monthly'],       // Play "product:basePlan"
    ['griddown_lifetime_standard_7999', 'pro', 'lifetime'],   // legacy price-encoded
    ['com.bannedproduct.griddown.extreme_lifetime', 'pro_ai', 'lifetime'],
    ['griddown_extreme_yearly:annual', 'pro_ai', 'yearly'],
  ])('%s → %s/%s', (id, plan, cycle) => {
    expect(classifyProduct(id)).toEqual({ plan, cycle });
  });
  test('unknown / Discord products are not ours', () => {
    expect(classifyProduct('griddown_discord')).toBeNull();
    expect(classifyProduct('something_else')).toBeNull();
  });
});

describe('findPackage', () => {
  const pkgs = [
    pkg('$rc_monthly', 'griddown_pro_monthly:monthly', '$3.99'),
    pkg('$rc_annual', 'griddown_pro_yearly:yearly', '$29.99'),
    pkg('extreme_lifetime', 'griddown_extreme_lifetime', '$149.99'),
  ];
  test('matches by product id, ignoring the base plan', () => {
    expect(findPackage(pkgs, 'pro', 'yearly')?.identifier).toBe('$rc_annual');
    expect(findPackage(pkgs, 'pro_ai', 'lifetime')?.identifier).toBe('extreme_lifetime');
  });
  test('falls back to the RevenueCat package identifier', () => {
    expect(findPackage([pkg('extreme_annual', 'renamed_in_console')], 'pro_ai', 'yearly')).toBeTruthy();
  });
  test('missing → undefined', () => {
    expect(findPackage(pkgs, 'pro_ai', 'monthly')).toBeUndefined();
  });
  test('priceTable keys by plan.cycle', () => {
    expect(priceTable(pkgs)).toEqual({ 'pro.monthly': '$3.99', 'pro.yearly': '$29.99', 'pro_ai.lifetime': '$149.99' });
  });
});

describe('entitlements → tier', () => {
  test('canonical pro / extreme entitlements use the granting product for the cycle', () => {
    expect(tierForEntitlement('pro', 'griddown_pro_monthly:monthly')).toBe('monthly');
    expect(tierForEntitlement('pro', 'com.bannedproduct.griddown.lifetime')).toBe('lifetime_standard');
    expect(tierForEntitlement('extreme', 'griddown_extreme_yearly:yearly')).toBe('extreme_yearly');
    expect(tierForEntitlement('extreme', undefined)).toBe('extreme_monthly');
  });
  test('legacy per-plan entitlements still work', () => {
    expect(tierForEntitlement('yearly_access')).toBe('yearly');
    expect(tierForEntitlement('extreme_lifetime')).toBe('extreme_lifetime');
  });
  test('mapEntitlementToTier picks the highest active plan', () => {
    const info = { entitlements: { active: {
      pro: { productIdentifier: 'griddown_pro_yearly:yearly' },
      extreme: { productIdentifier: 'com.bannedproduct.griddown.extreme_monthly' },
    } } };
    expect(mapEntitlementToTier(info)).toBe('extreme_monthly');
    expect(mapEntitlementToTier({ entitlements: { active: {} } })).toBe('free');
    expect(mapEntitlementToTier({ entitlements: { active: { mystery: {} } } })).toBe('free');
  });
});

describe('founder pricing window', () => {
  test('off by default (no date set)', () => {
    expect(FOUNDER_PRICING_ENDS).toBeNull();
    expect(founderPricingActive()).toBe(false);
  });
});
