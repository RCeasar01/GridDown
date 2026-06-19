import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    role: 'Survivor',
    color: Colors.textMuted,
    features: ['3 categories (water, fire, shelter)', 'No offline maps', 'No checklists', 'Read-only community access'],
  },
  {
    name: 'Discord Only',
    price: '$1.99/mo',
    role: 'Civilian',
    color: Colors.info,
    features: ['Full Discord community access', 'Discord role: Civilian', 'No guide library', 'Community-only access'],
  },
  {
    name: 'Monthly',
    price: '$3.99/mo',
    role: 'Operator',
    color: Colors.secondary,
    features: ['Full 10-category library', 'Lite content packs', 'Offline maps', 'All checklists', 'Discord role: Operator'],
  },
  {
    name: 'Yearly',
    price: '$29.99/yr',
    role: 'Specialist',
    color: Colors.secondary,
    features: ['Everything in Monthly', 'Auto new releases', 'Priority support', 'Discord role: Specialist'],
  },
  {
    name: 'Lifetime Standard',
    price: '$79.99',
    role: 'Veteran',
    color: Colors.warning,
    features: ['Everything in Yearly — forever', 'No subscription', 'Discord role: Veteran', 'No AI Advisor'],
  },
  {
    name: 'Extreme Monthly',
    price: '$9.99/mo',
    role: 'Extreme',
    color: Colors.primary,
    features: ['Full library + AI Advisor', 'Field Intelligence on-device AI', 'USB export capable', 'Discord role: Extreme'],
  },
  {
    name: 'Extreme Yearly',
    price: '$69.99/yr',
    role: 'Extreme',
    color: Colors.primary,
    features: ['Everything Extreme Monthly', 'Best value Extreme', 'Discord role: Extreme'],
  },
  {
    name: 'Extreme Lifetime',
    price: '$149.99',
    role: 'Ghost',
    color: Colors.primary,
    features: ['Everything — forever', 'AI Advisor lifetime', 'USB export package', 'Discord role: Ghost', 'Highest tier access'],
  },
];

export function CommunityScreen() {
  const openDiscord = () => {
    Linking.openURL('https://discord.gg/bannedproduct').catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="people" size={32} color={Colors.primary} />
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Join the GridDown Discord. Connect with operators, ask questions, share field experience.
          </Text>
        </View>

        {/* Discord button */}
        <TouchableOpacity style={styles.discordBtn} onPress={openDiscord} activeOpacity={0.8}>
          <Ionicons name="logo-discord" size={22} color="#fff" />
          <Text style={styles.discordBtnText}>Join the GridDown Discord</Text>
        </TouchableOpacity>

        {/* Role note */}
        <View style={styles.roleNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.secondary} />
          <Text style={styles.roleNoteText}>
            Discord roles are assigned automatically based on your subscription tier via RevenueCat webhooks. Your role updates within minutes of subscribing.
          </Text>
        </View>

        {/* Tier list */}
        <Text style={styles.sectionTitle}>SUBSCRIPTION TIERS & DISCORD ROLES</Text>
        {TIERS.map((tier) => (
          <View key={tier.name} style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <View>
                <Text style={styles.tierName}>{tier.name}</Text>
                <Text style={styles.tierPrice}>{tier.price}</Text>
              </View>
              <View style={[styles.roleBadge, { borderColor: tier.color, backgroundColor: tier.color + '22' }]}>
                <Text style={[styles.roleText, { color: tier.color }]}>@{tier.role}</Text>
              </View>
            </View>
            {tier.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureDot, { backgroundColor: tier.color }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16 },
  header: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  discordBtn: {
    backgroundColor: '#5865F2',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  discordBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  roleNote: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  roleNoteText: { color: Colors.secondary, fontSize: 12, lineHeight: 17, flex: 1 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  tierCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 10,
  },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tierName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  tierPrice: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  featureText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
});
