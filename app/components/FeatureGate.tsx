/**
 * FeatureGate — shows a screen only when the user's plan includes the feature (see
 * app/config/access.ts). Otherwise renders a lock card with a "See plans" button.
 *
 *   <FeatureGate feature="plan.flows"><FlowsContent /></FeatureGate>
 *   component={gated('plan.flows', FlowsScreen)}          // in a navigator
 *
 * Every stack that registers a gated screen must also register "Paywall".
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { canUse, FEATURE_LABEL, requiredPlanName, UNLOCK_ALL, type Feature } from '../config/access';
import { Colors } from '../theme/colors';

export function LockedFeature({ feature, message }: { feature: Feature; message?: string }) {
  const navigation = useNavigation<{ navigate: (name: string, params?: object) => void }>();
  const plan = requiredPlanName(feature);
  return (
    <View style={styles.wrap}>
      <Ionicons name="lock-closed" size={44} color={Colors.textMuted} />
      <Text style={styles.title}>{FEATURE_LABEL[feature]} is part of {plan}</Text>
      <Text style={styles.body}>
        {message ?? `Upgrade to ${plan} to unlock it. Every guide and Emergency Mode stay free.`}
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('Paywall', { featureName: FEATURE_LABEL[feature] })}
        accessibilityRole="button"
        accessibilityLabel={`See plans to unlock ${FEATURE_LABEL[feature]}`}
      >
        <Text style={styles.btnText}>See plans</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FeatureGate({ feature, children, message }: { feature: Feature; children: React.ReactNode; message?: string }) {
  const userTier = useAppStore((s) => s.userTier);
  if (canUse(feature, userTier)) return <>{children}</>;
  return <LockedFeature feature={feature} message={message} />;
}

/** Wrap a screen component for a navigator registration. */
export function gated<P extends object>(feature: Feature, Screen: React.ComponentType<P>): React.ComponentType<P> {
  function GatedScreen(props: P) {
    return (
      <FeatureGate feature={feature}>
        <Screen {...props} />
      </FeatureGate>
    );
  }
  GatedScreen.displayName = `Gated(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return GatedScreen;
}

/** Thin banner shown on test builds so an unlocked build is never mistaken for a store build. */
export function UnlockAllBanner() {
  if (!UNLOCK_ALL) return null;
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Ionicons name="flask-outline" size={13} color="#0D0D0D" />
      <Text style={styles.bannerText}>TEST BUILD — all features unlocked</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.background, gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  body: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  btn: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 14, minHeight: 48, justifyContent: 'center' },
  btnText: { color: '#0D0D0D', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D9A441', paddingVertical: 4 },
  bannerText: { color: '#0D0D0D', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
