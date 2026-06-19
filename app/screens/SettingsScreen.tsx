import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { userTier, clearRecent } = useAppStore();

  const handleClearRecent = () => {
    Alert.alert(
      'Clear Recently Viewed',
      'Remove all recently viewed guides?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearRecent() },
      ],
    );
  };

  const isExtremeLifetime = userTier === 'extreme_lifetime';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Subscription */}
        <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Plan</Text>
            <Text style={styles.rowValue}>{tierDisplayName(userTier)}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Home', { screen: 'Paywall' })}
          >
            <Text style={[styles.rowLabel, { color: Colors.primary }]}>Upgrade Plan</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* USB Export (Extreme Lifetime only) */}
        <Text style={styles.sectionTitle}>USB EXPORT</Text>
        <View style={[styles.card, !isExtremeLifetime && styles.cardLocked]}>
          {!isExtremeLifetime && (
            <View style={styles.lockOverlayRow}>
              <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
              <Text style={styles.lockOverlayText}>Extreme Lifetime only</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, !isExtremeLifetime && styles.rowLabelDisabled]}>Export Status</Text>
            <Text style={styles.rowValue}>{isExtremeLifetime ? 'Ready' : 'Locked'}</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.row, !isExtremeLifetime && styles.rowDisabled]}
            disabled={!isExtremeLifetime}
            onPress={() => Alert.alert('USB Export', 'Preparing export package… This will bundle all guides and content packs into a portable format for USB drive deployment.\n\nFeature scaffold — will be wired to file system export in next build.')}
          >
            <Text style={[styles.rowLabel, !isExtremeLifetime && styles.rowLabelDisabled]}>
              Prepare USB Export Package
            </Text>
            <Ionicons name="folder-open-outline" size={16} color={isExtremeLifetime ? Colors.textPrimary : Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <Text style={styles.helpText}>
            USB Export packages all guides, checklists, and content packs into a portable format that can be loaded onto a USB drive and run on any device — no internet, no app store.
          </Text>
        </View>

        {/* Data */}
        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleClearRecent}>
            <Text style={[styles.rowLabel, { color: Colors.danger }]}>Clear Recently Viewed</Text>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Version</Text>
            <Text style={styles.rowValue}>v{APP_VERSION} ({BUILD_NUMBER})</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('More', { screen: 'Founder' })}
          >
            <Text style={styles.rowLabel}>About the Founder</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Developer</Text>
            <Text style={styles.rowValue}>BannedProduct Media Inc.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Veteran-Owned</Text>
            <Text style={styles.rowValue}>🎖️ 100% VSB</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function tierDisplayName(tier: string): string {
  const names: Record<string, string> = {
    free: 'Free',
    discord: 'Discord Only',
    monthly: 'Monthly',
    yearly: 'Yearly',
    lifetime_standard: 'Lifetime Standard',
    extreme_monthly: 'Extreme Monthly',
    extreme_yearly: 'Extreme Yearly',
    extreme_lifetime: 'Extreme Lifetime',
  };
  return names[tier] ?? tier;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  cardLocked: { opacity: 0.7 },
  lockOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  lockOverlayText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 52,
  },
  rowDisabled: { opacity: 0.5 },
  rowLabel: { color: Colors.textPrimary, fontSize: 15 },
  rowLabelDisabled: { color: Colors.textMuted },
  rowValue: { color: Colors.textSecondary, fontSize: 14 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 16 },
  helpText: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    padding: 16,
    paddingTop: 8,
  },
});
