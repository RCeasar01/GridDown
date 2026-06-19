/**
 * GridDown RevenueCat Integration
 *
 * Wraps react-native-purchases for subscription management.
 * All purchase flows go through this module.
 */

import { Platform } from 'react-native';
import { UserTier } from '../store/useAppStore';
import { setUserTier as dbSetUserTier } from '../db/contentLoader';

// Entitlement ID → GridDown tier mapping
const ENTITLEMENT_TIER_MAP: Record<string, UserTier> = {
  monthly_access: 'monthly',
  yearly_access: 'yearly',
  lifetime_standard: 'lifetime_standard',
  discord_only: 'discord',
  extreme_monthly: 'extreme_monthly',
  extreme_yearly: 'extreme_yearly',
  extreme_lifetime: 'extreme_lifetime',
};

// Tier rank for determining highest active tier
const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  discord: 1,
  monthly: 2,
  yearly: 3,
  lifetime_standard: 4,
  extreme_monthly: 5,
  extreme_yearly: 6,
  extreme_lifetime: 7,
};

function getHighestTier(tiers: UserTier[]): UserTier {
  if (tiers.length === 0) return 'free';
  return tiers.reduce((best, tier) => {
    return (TIER_RANK[tier] ?? 0) > (TIER_RANK[best] ?? 0) ? tier : best;
  }, 'free' as UserTier);
}

export async function initializePurchases(userId?: string): Promise<void> {
  try {
    const Purchases = await import('react-native-purchases');
    const apiKey =
      Platform.OS === 'ios'
        ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'PLACEHOLDER_IOS_KEY')
        : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? 'PLACEHOLDER_ANDROID_KEY');

    await Purchases.default.configure({ apiKey });

    if (userId) {
      await Purchases.default.logIn(userId);
    }

    // Listen for customer info updates
    Purchases.default.addCustomerInfoUpdateListener(async (customerInfo) => {
      const tier = mapEntitlementToTier(customerInfo);
      const expiresAt = getExpiresAt(customerInfo);
      const isLifetime = tier === 'lifetime_standard' || tier === 'extreme_lifetime';
      await dbSetUserTier(tier, expiresAt, isLifetime);
    });

    // Sync on init
    const info = await Purchases.default.getCustomerInfo();
    const tier = mapEntitlementToTier(info);
    const expiresAt = getExpiresAt(info);
    const isLifetime = tier === 'lifetime_standard' || tier === 'extreme_lifetime';
    await dbSetUserTier(tier, expiresAt, isLifetime);
  } catch (err) {
    // Gracefully handle missing package or network errors
    console.warn('[Purchases] Failed to initialize RevenueCat:', err);
  }
}

export async function getOfferings() {
  try {
    const Purchases = await import('react-native-purchases');
    return await Purchases.default.getOfferings();
  } catch (err) {
    console.warn('[Purchases] Failed to get offerings:', err);
    return null;
  }
}

export async function purchasePackage(pkg: any): Promise<{ success: boolean; tier: UserTier | null }> {
  try {
    const Purchases = await import('react-native-purchases');
    const { customerInfo } = await Purchases.default.purchasePackage(pkg);
    const tier = mapEntitlementToTier(customerInfo);
    return { success: true, tier };
  } catch (err: any) {
    if (err?.userCancelled) {
      return { success: false, tier: null };
    }
    console.warn('[Purchases] Purchase failed:', err);
    return { success: false, tier: null };
  }
}

export async function restorePurchases(): Promise<{ success: boolean; tier: UserTier }> {
  try {
    const Purchases = await import('react-native-purchases');
    const customerInfo = await Purchases.default.restorePurchases();
    const tier = mapEntitlementToTier(customerInfo);
    return { success: true, tier };
  } catch (err) {
    console.warn('[Purchases] Restore failed:', err);
    return { success: false, tier: 'free' };
  }
}

export async function getCustomerInfo() {
  try {
    const Purchases = await import('react-native-purchases');
    return await Purchases.default.getCustomerInfo();
  } catch (err) {
    console.warn('[Purchases] Failed to get customer info:', err);
    return null;
  }
}

export function mapEntitlementToTier(customerInfo: any): UserTier {
  if (!customerInfo?.entitlements?.active) return 'free';
  const activeIds = Object.keys(customerInfo.entitlements.active);
  const activeTiers = activeIds
    .map((id) => ENTITLEMENT_TIER_MAP[id])
    .filter((t): t is UserTier => !!t);
  return getHighestTier(activeTiers);
}

function getExpiresAt(customerInfo: any): number | null {
  if (!customerInfo?.entitlements?.active) return null;
  const active = Object.values(customerInfo.entitlements.active) as any[];
  // Find the latest expiration date among active entitlements
  const dates = active
    .map((e) => (e.expirationDate ? new Date(e.expirationDate).getTime() : null))
    .filter((d): d is number => d !== null);
  if (dates.length === 0) return null;
  return Math.max(...dates);
}
