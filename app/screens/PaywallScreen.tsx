import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { useRoute } from '@react-navigation/native';

const PRIVACY_URL = 'https://rceasar01.github.io/GridDown/privacy';
const TERMS_URL   = 'https://rceasar01.github.io/GridDown/terms';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    autoRenews: false,
    features: [
      '3 categories (water, fire, shelter)',
      'No offline maps',
      'No checklists',
      'No AI Advisor',
    ],
    cta: 'Current Plan',
    highlight: false,
    badge: null as string | null,
    tier: 'free' as const,
  },
  {
    id: 'discord',
    name: 'Discord Only',
    price: '$1.99',
    period: '/month',
    autoRenews: true,
    features: [
      'Full Discord community access',
      'Discord role: Civilian',
      'No guide library access',
    ],
    cta: 'Join Community',
    highlight: false,
    badge: null as string | null,
    tier: 'discord' as const,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$3.99',
    period: '/month',
    autoRenews: true,
    features: [
      'Full 10-category library',
      'Lite content packs',
      'Offline maps',
      'All 6 disaster checklists',
      'Discord: Operator',
    ],
    cta: 'Start Monthly',
    highlight: false,
    badge: null as string | null,
    tier: 'monthly' as const,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$29.99',
    period: '/year',
    autoRenews: true,
    badge: 'MOST POPULAR' as string | null,
    features: [
      'Everything in Monthly',
      'Auto new content releases',
      'Priority support',
      'Discord: Specialist',
      'Save 37% vs monthly',
    ],
    cta: 'Start Yearly',
    highlight: false,
    tier: 'yearly' as const,
  },
  {
    id: 'lifetime_standard',
    name: 'Lifetime Standard',
    price: '$79.99',
    period: 'one-time',
    autoRenews: false,
    badge: null as string | null,
    features: [
      'Everything in Yearly — forever',
      'No subscription fees',
      'Discord: Veteran',
      'No AI Advisor',
    ],
    cta: 'Buy Lifetime',
    highlight: false,
    tier: 'lifetime_standard' as const,
  },
  {
    id: 'extreme_monthly',
    name: 'Extreme Monthly',
    price: '$9.99',
    period: '/month',
    autoRenews: true,
    badge: null as string | null,
    features: [
      'Full library + AI Advisor',
      'Field Intelligence on-device AI',
      'USB export ready',
      'Discord: Extreme',
    ],
    cta: 'Go Extreme',
    highlight: true,
    tier: 'extreme_monthly' as const,
  },
  {
    id: 'extreme_yearly',
    name: 'Extreme Yearly',
    price: '$69.99',
    period: '/year',
    autoRenews: true,
    badge: 'BEST VALUE' as string | null,
    features: [
      'Everything in Extreme Monthly',
      'Lowest per-month cost ($5.83/mo)',
      'Discord: Extreme',
    ],
    cta: 'Best Value Extreme',
    highlight: true,
    tier: 'extreme_yearly' as const,
  },
  {
    id: 'extreme_lifetime',
    name: 'Extreme Lifetime',
    price: '$149.99',
    period: 'one-time',
    autoRenews: false,
    badge: 'ULTIMATE' as string | null,
    features: [
      'Everything — forever',
      'AI Advisor lifetime access',
      'USB export package',
      'Discord: Ghost',
      'Highest tier priority',
    ],
    cta: 'Go All-In',
    highlight: true,
    tier: 'extreme_lifetime' as const,
  },
];

export function PaywallScreen() {
  const { userTier, setUserTier } = useAppStore();
  const route = useRoute<any>();
  const featureName = route.params?.featureName as string | undefined;
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (plan: typeof PLANS[0]) => {
    if (plan.tier === 'free' || plan.tier === userTier) return;
    setPurchasing(plan.id);
    // RevenueCat integration — replace with purchasePackage(plan.id)
    // Also set: Purchases.setAutomaticAppleSearchAdsAttributionCollection(false)
    await new Promise((r) => setTimeout(r, 1200));
    setUserTier(plan.tier);
    setPurchasing(null);
  };

  const handleRestore = async () => {
    setPurchasing('restore');
    await new Promise((r) => setTimeout(r, 1000));
    setPurchasing(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {featureName && (
          <View style={styles.featureBanner}>
            <Ionicons name="lock-closed" size={16} color={Colors.primary} />
            <Text style={styles.featureBannerText}>
              {featureName} requires an upgraded plan.
            </Text>
          </View>
        )}

        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          All content is stored on your device. No internet required after setup.
        </Text>

        {/* Apple IAP compliance: payment notice above purchase buttons */}
        <View style={styles.paymentNotice}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.paymentNoticeText}>
            Payment will be charged to your Apple ID account at confirmation of purchase.
          </Text>
        </View>

        {/* Restore Purchases — visible without scrolling per App Store guideline */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={purchasing !== null}
          accessibilityLabel="Restore Purchases"
          accessibilityRole="button"
        >
          <Text style={styles.restoreBtnText}>
            {purchasing === 'restore' ? 'Restoring…' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {PLANS.map((plan) => {
          const isCurrent = plan.tier === userTier;
          const isMostPopular = plan.badge === 'MOST POPULAR';
          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlight && styles.planCardHighlight,
                isMostPopular && styles.planCardPopular,
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.badge && (
                      <View
                        style={[
                          styles.badge,
                          isMostPopular && styles.badgePopular,
                          plan.badge === 'BEST VALUE' && styles.badgeBestValue,
                          plan.badge === 'ULTIMATE' && styles.badgeExtreme,
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            isMostPopular && styles.badgeTextPopular,
                          ]}
                        >
                          {plan.badge}
                        </Text>
                      </View>
                    )}
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, plan.highlight && styles.priceHighlight]}>
                      {plan.price}
                    </Text>
                    <Text style={styles.period}>{plan.period}</Text>
                  </View>
                </View>
              </View>

              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={plan.highlight ? Colors.primary : Colors.secondary}
                  />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.ctaBtn,
                  isCurrent && styles.ctaBtnCurrent,
                  plan.highlight && !isCurrent && styles.ctaBtnExtreme,
                  isMostPopular && !isCurrent && styles.ctaBtnPopular,
                  purchasing === plan.id && styles.ctaBtnLoading,
                ]}
                onPress={() => handlePurchase(plan)}
                disabled={isCurrent || plan.tier === 'free' || purchasing !== null}
                accessibilityLabel={
                  isCurrent
                    ? `${plan.name}: Current Plan`
                    : `${plan.name} ${plan.price}${plan.period}: ${plan.cta}`
                }
                accessibilityRole="button"
              >
                <Text style={[styles.ctaText, isCurrent && styles.ctaTextCurrent]}>
                  {purchasing === plan.id ? 'Processing…' : isCurrent ? '✓ Current Plan' : plan.cta}
                </Text>
              </TouchableOpacity>

              {/* Apple IAP compliance: auto-renewal disclosure below each subscription CTA */}
              {plan.autoRenews && !isCurrent && (
                <Text style={styles.autoRenewText}>
                  Subscription auto-renews. Cancel anytime in Settings {'>'} [Your Name] {'>'} Subscriptions.
                </Text>
              )}
            </View>
          );
        })}

        <Text style={styles.legal}>
          Purchases are processed via the App Store / Google Play. Subscriptions auto-renew unless
          cancelled at least 24 hours before the end of the current period. Prices in USD.
        </Text>

        {/* Apple IAP compliance: ToS and Privacy Policy links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_URL)}
            accessibilityLabel="Open Privacy Policy"
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.legalSep}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_URL)}
            accessibilityLabel="Open Terms of Service"
            accessibilityRole="link"
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  featureBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  featureBannerText: { color: Colors.danger, fontSize: 13, flex: 1, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: -4,
  },
  paymentNoticeText: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', flex: 1, lineHeight: 15 },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 10,
  },
  planCardHighlight: { borderColor: Colors.primary, backgroundColor: '#1A1008' },
  planCardPopular: { borderColor: Colors.secondary, backgroundColor: '#0D1A12' },
  planHeader: { gap: 4 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgePopular: { backgroundColor: Colors.secondaryDim, borderWidth: 1, borderColor: Colors.secondary },
  badgeBestValue: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary },
  badgeExtreme: { backgroundColor: Colors.primaryDim },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextPopular: { color: Colors.secondary },
  currentBadge: { backgroundColor: Colors.secondaryDim, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { color: Colors.secondary, fontSize: 10, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  price: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  priceHighlight: { color: Colors.primary },
  period: { color: Colors.textSecondary, fontSize: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, flex: 1 },
  ctaBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaBtnCurrent: { backgroundColor: Colors.surfaceElevated },
  ctaBtnExtreme: { backgroundColor: Colors.primary },
  ctaBtnPopular: { backgroundColor: Colors.secondary },
  ctaBtnLoading: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  ctaTextCurrent: { color: Colors.textMuted },
  autoRenewText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: -2,
  },
  restoreBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: -4,
  },
  restoreBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legal: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  legalLink: {
    color: Colors.textMuted,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  legalSep: { color: Colors.textMuted, fontSize: 11 },
});
