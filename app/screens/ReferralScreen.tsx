import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Share, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Scaffold: generate deterministic referral code from user id
function generateReferralCode(seed: string = 'GD'): string {
  return `${seed}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

const REFERRAL_CODE = generateReferralCode('GD');
const REFERRAL_LINK = `https://griddown.app/ref/${REFERRAL_CODE}`;
const COMMISSION_RATE = 0.20;

const SAMPLE_REFERRALS = [
  { id: '1', email: 'user1@example.com', date: '2025-01-10', purchase: '$29.99', status: 'paid' },
  { id: '2', email: 'user2@example.com', date: '2025-01-12', purchase: '$9.99', status: 'paid' },
  { id: '3', email: 'user3@example.com', date: '2025-01-18', purchase: '$149.99', status: 'pending' },
];

export function ReferralScreen() {
  const [payoutMethod, setPayoutMethod] = useState('');
  const totalEarned = SAMPLE_REFERRALS
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + parseFloat(r.purchase.replace('$', '')) * COMMISSION_RATE, 0);
  const pendingEarned = SAMPLE_REFERRALS
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + parseFloat(r.purchase.replace('$', '')) * COMMISSION_RATE, 0);

  const handleShare = async () => {
    await Share.share({
      message: `Get GridDown — the offline survival app built by a Combat Infantryman. Use my referral link and we both benefit:\n${REFERRAL_LINK}`,
      url: REFERRAL_LINK,
      title: 'GridDown — Survival App',
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Referral Program</Text>
          <Text style={styles.subtitle}>
            Earn 20% commission on every sale you refer. No limit. Paid monthly.
          </Text>
        </View>

        {/* Referral link */}
        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>YOUR REFERRAL LINK</Text>
          <Text style={styles.linkText}>{REFERRAL_LINK}</Text>
          <View style={styles.codeBadge}>
            <Text style={styles.codeLabel}>CODE: </Text>
            <Text style={styles.codeText}>{REFERRAL_CODE}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share Your Link</Text>
          </TouchableOpacity>
        </View>

        {/* Earnings */}
        <View style={styles.earningsRow}>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>TOTAL PAID</Text>
            <Text style={styles.earningsValue}>${totalEarned.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>PENDING</Text>
            <Text style={[styles.earningsValue, { color: Colors.warning }]}>${pendingEarned.toFixed(2)}</Text>
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>REFERRALS</Text>
            <Text style={styles.earningsValue}>{SAMPLE_REFERRALS.length}</Text>
          </View>
        </View>

        {/* Commission info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.infoText}>
            Commission is 20% of every referred sale. Payouts are processed monthly via your chosen method. Minimum payout threshold: $25.
          </Text>
        </View>

        {/* Payout method */}
        <View style={styles.payoutSection}>
          <Text style={styles.sectionTitle}>PAYOUT METHOD</Text>
          <TextInput
            style={styles.payoutInput}
            value={payoutMethod}
            onChangeText={setPayoutMethod}
            placeholder="PayPal email or Venmo handle..."
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save Payout Method</Text>
          </TouchableOpacity>
        </View>

        {/* Recent referrals */}
        <Text style={styles.sectionTitle}>RECENT REFERRALS</Text>
        {SAMPLE_REFERRALS.map((ref) => (
          <View key={ref.id} style={styles.refRow}>
            <View style={styles.refInfo}>
              <Text style={styles.refEmail}>{ref.email}</Text>
              <Text style={styles.refDate}>{ref.date} · {ref.purchase}</Text>
            </View>
            <View>
              <Text style={[styles.refCommission, ref.status === 'paid' ? styles.paid : styles.pending]}>
                +${(parseFloat(ref.purchase.replace('$', '')) * COMMISSION_RATE).toFixed(2)}
              </Text>
              <Text style={[styles.refStatus, ref.status === 'paid' ? styles.paid : styles.pending]}>
                {ref.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 48 },
  header: { gap: 8, paddingVertical: 8 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  linkCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 12,
  },
  linkLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  linkText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  codeBadge: { flexDirection: 'row', alignItems: 'center' },
  codeLabel: { color: Colors.textMuted, fontSize: 13 },
  codeText: { color: Colors.primary, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  shareBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  earningsRow: { flexDirection: 'row', gap: 10 },
  earningsCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 4,
    alignItems: 'center',
  },
  earningsLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  earningsValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.info,
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: { color: Colors.info, fontSize: 12, lineHeight: 17, flex: 1 },
  payoutSection: { gap: 10 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  payoutInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    alignItems: 'center',
  },
  refInfo: { gap: 2 },
  refEmail: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },
  refDate: { color: Colors.textMuted, fontSize: 12 },
  refCommission: { fontSize: 16, fontWeight: '800', textAlign: 'right' },
  refStatus: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },
  paid: { color: Colors.secondary },
  pending: { color: Colors.warning },
});
