import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore, ContentPack, UserTier } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

const TIER_LABEL: Record<string, string> = {
  free: 'Free',
  discord: 'Discord',
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime_standard: 'Lifetime',
  extreme_monthly: 'Extreme',
  extreme_yearly: 'Extreme',
  extreme_lifetime: 'Extreme Lifetime',
};

export function ContentPacksScreen() {
  const { contentPacks, userTier, hasAccess, setContentPacks } = useAppStore();
  const navigation = useNavigation<any>();

  const installed = contentPacks.filter((p) => p.installed);
  const available = contentPacks.filter((p) => !p.installed);
  const totalInstalled = installed.reduce((sum, p) => sum + p.sizeBytes, 0);

  const handleDownload = (pack: ContentPack) => {
    if (!hasAccess(pack.requiredTier)) {
      Alert.alert(
        'Upgrade Required',
        `${pack.name} requires ${TIER_LABEL[pack.requiredTier]} tier or higher.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Home', { screen: 'Paywall' }) },
        ],
      );
      return;
    }
    // Scaffold: simulate install
    Alert.alert('Download Started', `${pack.name} is downloading… (${formatBytes(pack.sizeBytes)})\n\nNote: This is a scaffold. Real download will pull from CDN.`);
    setContentPacks(contentPacks.map((p) => (p.id === pack.id ? { ...p, installed: true } : p)));
  };

  const handleRemove = (pack: ContentPack) => {
    if (pack.id === 'core') {
      Alert.alert('Cannot Remove', 'The Core pack cannot be removed.');
      return;
    }
    Alert.alert('Remove Pack', `Remove ${pack.name} from your device?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setContentPacks(contentPacks.map((p) => (p.id === pack.id ? { ...p, installed: false } : p))),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Storage summary */}
        <View style={styles.storageCard}>
          <Ionicons name="folder-open" size={20} color={Colors.secondary} />
          <View style={styles.storageInfo}>
            <Text style={styles.storageLabel}>INSTALLED STORAGE</Text>
            <Text style={styles.storageValue}>{formatBytes(totalInstalled)} used</Text>
          </View>
        </View>

        {/* Installed */}
        <Text style={styles.sectionTitle}>✅ INSTALLED ({installed.length})</Text>
        {installed.map((pack) => (
          <PackCard key={pack.id} pack={pack} installed onAction={() => handleRemove(pack)} />
        ))}

        {/* Available */}
        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📥 AVAILABLE TO DOWNLOAD</Text>
            {available.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                installed={false}
                locked={!hasAccess(pack.requiredTier)}
                requiredTierLabel={TIER_LABEL[pack.requiredTier]}
                onAction={() => handleDownload(pack)}
              />
            ))}
          </>
        )}

        {/* Future regional packs note */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
          <Text style={styles.noteText}>
            Regional packs (Southwest, Pacific Northwest, Southeast, Northeast, Gulf Coast) will be available as separate downloads. Each includes region-specific flora, fauna, terrain, and disaster content.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PackCardProps {
  pack: ContentPack;
  installed: boolean;
  locked?: boolean;
  requiredTierLabel?: string;
  onAction: () => void;
}

function PackCard({ pack, installed, locked, requiredTierLabel, onAction }: PackCardProps) {
  return (
    <View style={styles.packCard}>
      <View style={styles.packInfo}>
        <View style={styles.packTitleRow}>
          <Text style={styles.packName}>{pack.name}</Text>
          {locked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color={Colors.textMuted} />
              <Text style={styles.lockBadgeText}>{requiredTierLabel}+</Text>
            </View>
          )}
        </View>
        <Text style={styles.packDesc}>{pack.description}</Text>
        <Text style={styles.packSize}>{formatBytes(pack.sizeBytes)} · v{pack.version}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          installed ? styles.removeBtn : locked ? styles.lockedBtn : styles.downloadBtn,
        ]}
        onPress={onAction}
      >
        <Ionicons
          name={installed ? 'trash-outline' : locked ? 'lock-closed-outline' : 'download-outline'}
          size={16}
          color={installed ? Colors.danger : locked ? Colors.textMuted : Colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12 },
  storageCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    alignItems: 'center',
  },
  storageInfo: { gap: 2 },
  storageLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  storageValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 },
  packCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    gap: 12,
    alignItems: 'center',
  },
  packInfo: { flex: 1, gap: 4 },
  packTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  packName: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lockBadgeText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  packDesc: { color: Colors.textSecondary, fontSize: 12, lineHeight: 16 },
  packSize: { color: Colors.textMuted, fontSize: 11 },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  downloadBtn: { backgroundColor: Colors.secondaryDim, borderColor: Colors.secondary },
  removeBtn: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  lockedBtn: { backgroundColor: Colors.surface, borderColor: Colors.cardBorder },
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.info,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  noteText: { color: Colors.info, fontSize: 12, lineHeight: 17, flex: 1 },
});
