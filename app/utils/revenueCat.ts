/**
 * RevenueCat Integration Scaffold
 * 
 * Replace placeholder keys with your actual RevenueCat API keys from:
 * https://app.revenuecat.com/
 * 
 * Required package: react-native-purchases@^7.27.0
 * Install: npx expo install react-native-purchases
 * Note: RevenueCat requires a bare/development build â€” not Expo Go
 */

import { Platform } from 'react-native';
import type { UserTier } from '../store/useAppStore';

// Replace with actual keys from RevenueCat dashboard
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_PLACEHOLDER';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_PLACEHOLDER';

// Entitlement identifiers â€” must match RevenueCat dashboard exactly
export const ENTITLEMENTS = {
  DISCORD: 'griddown_discord',
  MONTHLY: 'griddown_monthly',
  YEARLY: 'griddown_yearly',
  LIFETIME_STANDARD: 'griddown_lifetime_standard',
  EXTREME_MONTHLY: 'griddown_extreme_monthly',
  EXTREME_YEARLY: 'griddown_extreme_yearly',
  EXTREME_LIFETIME: 'griddown_extreme_lifetime',
} as const;

// Product identifiers â€” must match App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  DISCORD_MONTHLY: 'griddown_discord_monthly_199',
  MONTHLY: 'griddown_monthly_399',
  YEARLY: 'griddown_yearly_2999',
  LIFETIME_STANDARD: 'griddown_lifetime_standard_7999',
  EXTREME_MONTHLY: 'griddown_extreme_monthly_999',
  EXTREME_YEARLY: 'griddown_extreme_yearly_6999',
  EXTREME_LIFETIME: 'griddown_extreme_lifetime_14999',
} as const;

let isConfigured = false;

/**
 * Initialize RevenueCat SDK.
 * Call once at app startup from App.tsx before rendering.
 */
export async function configureRevenueCat(userId?: string): Promise<void> {
  if (isConfigured) return;
  
  try {
    // Dynamic import to avoid crashing in Expo Go (no native module)
    const Purchases = await import('react-native-purchases').then(m => m.default).catch(() => null);
    if (!Purchases) {
      console.warn('[RevenueCat] react-native-purchases not available (Expo Go?)');
      return;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    Purchases.configure({ apiKey });
    
    if (userId) {
      await Purchases.logIn(userId);
    }

    isConfigured = true;
    console.warn('[RevenueCat] Configured successfully');
  } catch (error) {
    console.error('[RevenueCat] Configuration failed:', error);
  }
}

/**
 * Purchase a product by product ID.
 * Returns the new tier if purchase succeeds, null otherwise.
 */
export async function purchaseProduct(productId: string): Promise<UserTier | null> {
  try {
    const Purchases = await import('react-native-purchases').then(m => m.default).catch(() => null);
    if (!Purchases) throw new Error('RevenueCat not available');

    const offerings = await Purchases.getOfferings();
    const allPackages = offerings.current?.availablePackages ?? [];
    const pkg = allPackages.find(p => p.product.identifier === productId);
    
    if (!pkg) throw new Error(`Package not found: ${productId}`);

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return tierFromCustomerInfo(customerInfo);
  } catch (error: any) {
    if (!error?.userCancelled) {
      console.error('[RevenueCat] Purchase error:', error);
    }
    return null;
  }
}

/**
 * Restore previous purchases.
 * Returns the restored tier.
 */
export async function restorePurchases(): Promise<UserTier> {
  try {
    const Purchases = await import('react-native-purchases').then(m => m.default).catch(() => null);
    if (!Purchases) return 'free';

    const customerInfo = await Purchases.restorePurchases();
    return tierFromCustomerInfo(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    return 'free';
  }
}

/**
 * Get the current user's active tier from RevenueCat.
 */
export async function getCurrentTier(): Promise<UserTier> {
  try {
    const Purchases = await import('react-native-purchases').then(m => m.default).catch(() => null);
    if (!Purchases) return 'free';

    const customerInfo = await Purchases.getCustomerInfo();
    return tierFromCustomerInfo(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Get tier error:', error);
    return 'free';
  }
}

/**
 * Map RevenueCat customer info to GridDown tier.
 * Checks entitlements in descending order of privilege.
 */
function tierFromCustomerInfo(customerInfo: any): UserTier {
  const active = customerInfo?.entitlements?.active ?? {};

  if (active[ENTITLEMENTS.EXTREME_LIFETIME]) return 'extreme_lifetime';
  if (active[ENTITLEMENTS.EXTREME_YEARLY]) return 'extreme_yearly';
  if (active[ENTITLEMENTS.EXTREME_MONTHLY]) return 'extreme_monthly';
  if (active[ENTITLEMENTS.LIFETIME_STANDARD]) return 'lifetime_standard';
  if (active[ENTITLEMENTS.YEARLY]) return 'yearly';
  if (active[ENTITLEMENTS.MONTHLY]) return 'monthly';
  if (active[ENTITLEMENTS.DISCORD]) return 'discord';
  
  return 'free';
}
