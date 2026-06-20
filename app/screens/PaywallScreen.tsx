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

type ProPriceKey = 'monthly' | 'yearly' | 'lifetime';

interface PlanBase {
  id: string;
  name: string;
  autoRenews: boolean;
  features: string[];
  cta: string;
  highlight: boolean;
  badge: string | null;
  tier: 'free' | 'monthly' | 'yearly' | 'extreme_monthly' | 'extreme_yearly' | 'extreme_lifetime';
  legacyTiers: string[];
}

interface StandardPlan extends PlanBase {
  id: 'free' | 'family';
  price: string;
  period: string;
}

interface ProPlan extends PlanBase {
  id: 'pro';
  price: string;
  period: string;
  priceYearly: string;
  priceLifetime: string;
}

interface ProAIPlan extends PlanBase {
  id: 'pro_ai';
  price: string;
  period: string;
  priceYearly: string;
  priceLifetime: string;
}

type Plan = StandardPlan | ProPlan | ProAIPlan;

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    autoRenews: false,
    features: [
      'Water, Fire, Shelter guides',
      'Basic quizzes',
      'Emergency Mode',
    ],
    cta: 'Current Plan',
    highlight: false,
    badge: null,
    tier: 'free',
    legacyTiers: ['free'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$4.99',
    period: '/mo',
    priceYearly: '$34.99/yr',
    priceLifetime: '$89.99',
    autoRenews: true,
    features: [
      'Full 12-category library',
      'All tools (HAM, Morse, Map, Translator)',
      'All quizzes and checklists',
      'My Kit + Gear Inventory',
      'Real-World Flows',
      'Family Planner',
      'Offline maps',
    ],
    cta: 'Go Pro',
    highlight: true,
    badge: 'MOST POPULAR',
    tier: 'yearly',
    legacyTiers: ['monthly', 'yearly', 'lifetime_standard', 'discord'],
  },
  {
    id: 'pro_ai',
    name: 'Pro + AI',
    price: '$10.99',
    period: '/mo',
    priceYearly: '$74.99/yr',
    priceLifetime: '$159.99',
    autoRenews: true,
    features: [
      'Everything in Pro',
      'Field Intelligence AI Advisor',
      'Helps you reason through scenarios using your downloaded guides',
      'On-device, fully offline AI',
      'USB export',
    ],
    cta: 'Get Pro + AI',
    highlight: false,
    badge: 'COMPLETE',
    tier: 'extreme_yearly',
    legacyTiers: ['extreme_monthly', 'extreme_yearly', 'extreme_lifetime'],
  },
  {
    id: 'family',
    name: 'Family Plan',
    price: '$54.99',
    period: '/yr',
    autoRenews: true,
    features: [
      '5 devices, shared plans',
      'Everything in Pro',
      'Shared family prep checklists',
    ],
    cta: 'Get Family Plan',
    highlight: false,
    badge: '5 DEVICES',
    tier: 'yearly',
    legacyTiers: [],
  },
];

// RC product IDs for each plan+billing combination
const RC_PRODUCT_MAP: Record<string, Record<ProPriceKey, string>> = {
  pro: {
    monthly: 'griddown_monthly_399',
    yearly: 'griddown_yearly_2999',
    lifetime: 'griddown_lifetime_standard_7999',
  },
  pro_ai: {
    monthly: 'griddown_extreme_monthly_999',
    yearly: 'griddown_extreme_yearly_6999',
    lifetime: 'griddown_extreme_lifetime_14999',
  },
};

export function PaywallScreen() {
  const { userTier, setUserTier } = useAppStore();
  const route = useRoute<any>();
  const featureName = route.params?.featureName as string | undefined;
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [proPriceKey, setProPriceKey] = useState<ProPriceKey>('yearly');
  const [proAIPriceKey, setProAIPriceKey] = useState<ProPriceKey>('yearly');

  function getPriceDisplay(plan: Plan, monthlyKey: ProPriceKey): { price: string; period: string } {
    if (plan.id === 'pro' || plan.id === 'pro_ai') {
      const p = plan as ProPlan | ProAIPlan;
      if (monthlyKey === 'yearly') return { price: p.priceYearly.split('/')[0], period: '/yr' };
      if (monthlyKey === 'lifetime') return { price: p.priceLifetime, period: 'one-time' };
      return { price: p.price, period: p.period };
    }
    return { price: (plan as StandardPlan).price, period: (plan as StandardPlan).period };
  }

  const isLegacyCurrent = (plan: Plan): boolean => {
    return plan.legacyTiers.includes(userTier) || plan.tier === userTier;
  };

  const handlePurchase = async (plan: Plan) => {
    if (plan.id === 'free') return;
    if (isLegacyCurrent(plan)) return;
    setPurchasing(plan.id);
    // RevenueCat integration: map plan + billing cycle → product ID
    // const priceKey = plan.id === 'pro' ? proPriceKey : plan.id === 'pro_ai' ? proAIPriceKey : 'yearly';
    // const productId = RC_PRODUCT_MAP[plan.id]?.[priceKey] ?? '';
    // const pkg = await findPackageByProductId(productId);
    // if (pkg) await purchasePackage(pkg);
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

        {/* All plans note */}
        <View style={styles.emergencyNote}>
          <Ionicons name="flash-outline" size={14} color={Colors.secondary} />
          <Text style={styles.emergencyNoteText}>
            All plans include Emergency Mode (free)
          </Text>
        </View>

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
          const isCurrent = isLegacyCurrent(plan);
          const isMostPopular = plan.badge === 'MOST POPULAR';
          const priceKey = plan.id === 'pro' ? proPriceKey : plan.id === 'pro_ai' ? proAIPriceKey : null;
          const { price, period } = getPriceDisplay(plan, priceKey ?? 'monthly');

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlight && styles.planCardHighlight,
                isMostPopular && styles.planCardPopular,
                plan.badge === 'COMPLETE' && styles.planCardComplete,
              ]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planNameRow}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.badge && (
                    <View
                      style={[
                        styles.badge,
                        isMostPopular && styles.badgePopular,
                        plan.badge === 'COMPLETE' && styles.badgeComplete,
                        plan.badge === '5 DEVICES' && styles.badgeFamily,
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

                {/* Price + billing chips for Pro and Pro+AI */}
                {(plan.id === 'pro' || plan.id === 'pro_ai') ? (
                  <View style={styles.priceSection}>
                    <View style={styles.priceRow}>
                      <Text style={[styles.price, plan.highlight && styles.priceHighlight]}>
                        {price}
                      </Text>
                      <Text style={styles.period}>{period}</Text>
                    </View>
                    <View style={styles.billingChips}>
                      {(['monthly', 'yearly', 'lifetime'] as ProPriceKey[]).map((key) => {
                        const active = priceKey === key;
                        const setter = plan.id === 'pro' ? setProPriceKey : setProAIPriceKey;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => setter(key)}
                            accessibilityLabel={`Select ${key} billing`}
                            accessibilityRole="button"
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {key === 'monthly' ? 'Monthly' : key === 'yearly' ? 'Yearly' : 'Lifetime'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{price}</Text>
                    <Text style={styles.period}>{period}</Text>
                  </View>
                )}
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
                  plan.highlight && !isCurrent && styles.ctaBtnPopular,
                  plan.badge === 'COMPLETE' && !isCurrent && styles.ctaBtnExtreme,
                  purchasing === plan.id && styles.ctaBtnLoading,
                ]}
                onPress={() => handlePurchase(plan)}
                disabled={isCurrent || plan.id === 'free' || purchasing !== null}
                accessibilityLabel={
                  isCurrent
                    ? `${plan.name}: Current Plan`
                    : `${plan.name} ${price}${period}: ${plan.cta}`
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
  emergencyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryDim,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emergencyNoteText: { color: Colors.secondary, fontSize: 13, fontWeight: '600' },
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
  planCardHighlight: { borderColor: Colors.secondary, backgroundColor: '#0D1A12' },
  planCardPopular: { borderColor: Colors.secondary, backgroundColor: '#0D1A12' },
  planCardComplete: { borderColor: Colors.primary, backgroundColor: '#1A1008' },
  planHeader: { gap: 8 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700' },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgePopular: { backgroundColor: Colors.secondaryDim, borderWidth: 1, borderColor: Colors.secondary },
  badgeComplete: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary },
  badgeFamily: { backgroundColor: '#1A1835', borderWidth: 1, borderColor: '#5A5ABB' },
  badgeText: { color: Colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  badgeTextPopular: { color: Colors.secondary },
  currentBadge: { backgroundColor: Colors.secondaryDim, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { color: Colors.secondary, fontSize: 10, fontWeight: '700' },
  priceSection: { gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  price: { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  priceHighlight: { color: Colors.secondary },
  period: { color: Colors.textSecondary, fontSize: 14 },
  billingChips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  chipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
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
