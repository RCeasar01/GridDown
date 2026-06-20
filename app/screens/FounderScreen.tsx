import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const CREDENTIALS = [
  { icon: '🦅', text: '101st Airborne Division (Air Assault) — Screaming Eagles' },
  { icon: '🪖', text: '3rd Brigade Combat Team, 187th Infantry Regiment — Rakkasans' },
  { icon: '⚕️', text: '8th US Army / 65th Medical Brigade' },
  { icon: '🎖️', text: 'Combat Infantryman' },
  { icon: '🩹', text: 'Combat Lifesaver' },
  { icon: '🩺', text: 'Eagle First Responder — 101st Airborne enhanced Combat Lifesaver program' },
  { icon: '🔬', text: 'Preventive Medicine Specialist (secondary MOS)' },
  { icon: '🌍', text: 'COP Chergotah, Khost Province, Afghanistan' },
  { icon: '🇺🇸', text: '100% Veteran-Owned — BannedProduct Media Inc.' },
];

const FOUNDER_STORY = `I served as a Combat Infantryman with a second MOS as a Preventive Medicine Specialist. I was trained as an Eagle First Responder with the 101st Airborne Division — the Screaming Eagles — a combat casualty care program built for air assault operations where medevac is delayed and you are the only medical resource available.

I was stationed at COP Chergotah in Khost Province, Afghanistan — on the Pakistani border, in Haqqani Network territory. On a combat outpost that small, you do not get to call for help and wait. You handle it with what you have and the training you were given.

GridDown is that training, organized and put in your pocket. Built for when help is not coming — because I have been in places where it wasn't.

The medical guides in this app reflect what I was actually trained to do: pack wounds under fire, manage airways without equipment, recognize tension pneumothorax, apply tourniquets — including one-handed on yourself. The field sanitation and preventive medicine guides reflect a second MOS built around keeping a unit alive not from bullets, but from disease and environmental threats.

This is not a recreation app. This is not prepper entertainment. This is operational knowledge for the scenario where the grid is gone and you are the only resource available.

Train like it matters. Because it does.`;

export function FounderScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badgeContainer}>
            <Text style={styles.veteranBadge}>🎖️ VETERAN-OWNED</Text>
          </View>
          <Text style={styles.companyName}>BannedProduct Media Inc.</Text>
          <Text style={styles.tagline}>GridDown — When help is not coming.</Text>
        </View>

        {/* Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CREDENTIALS</Text>
          {CREDENTIALS.map((c, i) => (
            <View key={i} style={styles.credentialCard}>
              <Text style={styles.credentialIcon}>{c.icon}</Text>
              <Text style={styles.credentialText}>{c.text}</Text>
            </View>
          ))}
        </View>

        {/* Founder story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOUNDER STATEMENT</Text>
          <View style={styles.storyCard}>
            <View style={styles.quoteBar} />
            <Text style={styles.storyText}>{FOUNDER_STORY}</Text>
          </View>
        </View>

        {/* Medical credential banner */}
        <View style={styles.medicalBanner}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.secondary} />
          <View style={styles.medicalBannerText}>
            <Text style={styles.medicalBannerTitle}>Medical Content Credential</Text>
            <Text style={styles.medicalBannerSub}>
              Eagle First Responder — 101st Airborne Division (Air Assault), 187th Infantry Regiment (Rakkasans) | Preventive Medicine Specialist | 65th Medical Brigade
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            GridDown is a product of BannedProduct Media Inc., a 100% veteran-owned small business. All medical and survival content is based on military training and doctrine. This content is for emergency preparedness purposes only and is not a substitute for professional medical care when accessible.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 20 },
  header: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  badgeContainer: {
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  veteranBadge: { color: Colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  companyName: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  tagline: { color: Colors.textSecondary, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  section: { gap: 12 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  credentialCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    alignItems: 'flex-start',
  },
  credentialIcon: { fontSize: 22, flexShrink: 0 },
  credentialText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 },
  storyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  quoteBar: { width: 3, backgroundColor: Colors.primary, borderRadius: 2, flexShrink: 0 },
  storyText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22, flex: 1 },
  medicalBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  medicalBannerText: { flex: 1, gap: 4 },
  medicalBannerTitle: { color: Colors.secondary, fontSize: 14, fontWeight: '700' },
  medicalBannerSub: { color: Colors.secondary, fontSize: 12, lineHeight: 17, opacity: 0.85 },
  disclaimer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.divider },
  disclaimerText: { color: Colors.textMuted, fontSize: 12, lineHeight: 18 },
});
