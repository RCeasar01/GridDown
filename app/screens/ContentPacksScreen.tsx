import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useAppStore, ContentPack } from '../store/useAppStore';

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function ContentPacksScreen() {
  const { contentPacks, setContentPacks } = useAppStore();

  const installed = contentPacks.filter((p) => p.installed);
  const available = contentPacks.filter((p) => !p.installed);
  const totalInstalled = installed.reduce((sum, p) => sum + p.sizeBytes, 0);

  // v1.0 ships every guide inside the app. Downloadable expansion packs are a
  // future feature, so this never pretends to download anything.
  const handleDownload = (pack: ContentPack) => {
    Alert.alert(
      'Coming Soon',
      `${pack.name} will be available as a downloadable expansion in a future update. ` +
        'Every guide in this version is already on your device and works offline.',
    );
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
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
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
        <Text style={styles.sectionTitle}>INCLUDED IN THIS VERSION ({installed.length})</Text>
        {installed.map((pack) => (
          <PackCard key={pack.id} pack={pack} installed onAction={() => handleRemove(pack)} />
        ))}

        {/* Available */}
        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>COMING SOON</Text>
            {available.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                installed={false}
                locked={false}
                comingSoon
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
  comingSoon?: boolean;
  onAction: () => void;
}

function PackCard({ pack, installed, locked, requiredTierLabel, comingSoon, onAction }: PackCardProps) {
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
          name={
            installed ? (pack.id === 'core' ? 'checkmark-circle-outline' : 'trash-outline')
              : comingSoon ? 'time-outline'
              : locked ? 'lock-closed-outline'
              : 'download-outline'
          }
          size={16}
          color={
            installed ? (pack.id === 'core' ? Colors.secondary : Colors.danger)
              : locked || comingSoon ? Colors.textMuted
              : Colors.secondary
          }
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
