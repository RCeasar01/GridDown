import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView, View, Text, ScrollView, TouchableOpacity,
  FlatList, Modal, TextInput, StyleSheet, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { ToolsStackParamList } from '../navigation/AppNavigator';
import {
  getKits, createKit, deleteKit,
  getKitGuides, removeGuideFromKit, KitRow,
} from '../db/contentLoader';
import { getGuideById } from '../utils/guideRegistry';

type Nav = NativeStackNavigationProp<ToolsStackParamList, 'MyKit'>;

interface Kit {
  id: string;
  name: string;
  icon: string;
  created_at: number;
}

const DEFAULT_KIT_OPTIONS = [
  { name: 'Bug-Out Bag', icon: '🎒' },
  { name: 'Vehicle Kit', icon: '🚗' },
  { name: 'Home Kit', icon: '🏠' },
  { name: 'Medic Bag', icon: '🩺' },
  { name: 'Custom', icon: '📦' },
] as const;

export function MyKitScreen() {
  const navigation = useNavigation<Nav>();

  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [kitGuides, setKitGuides] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [newKitIcon, setNewKitIcon] = useState('🎒');
  const [isCustomName, setIsCustomName] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadKits = useCallback(async () => {
    try {
      const rows: KitRow[] = await getKits();
      setKits(rows);
      if (rows.length > 0 && selectedKitId === null) {
        setSelectedKitId(rows[0].id);
      }
    } catch (err) {
      console.warn('[MyKitScreen] loadKits error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedKitId]);

  const loadKitGuides = useCallback(async (kitId: string) => {
    try {
      const ids = await getKitGuides(kitId);
      setKitGuides(ids);
    } catch (err) {
      console.warn('[MyKitScreen] loadKitGuides error:', err);
    }
  }, []);

  useEffect(() => { void loadKits(); }, []);

  useEffect(() => {
    if (selectedKitId) { void loadKitGuides(selectedKitId); }
  }, [selectedKitId, loadKitGuides]);

  const selectedKit = kits.find((k) => k.id === selectedKitId) ?? null;

  const handleSelectKit = (kitId: string) => {
    setSelectedKitId(kitId);
  };

  const handleOpenCreate = () => {
    setNewKitName('');
    setNewKitIcon('🎒');
    setIsCustomName(false);
    setShowCreateModal(true);
  };

  const handlePickPreset = (name: string, icon: string) => {
    if (name === 'Custom') {
      setIsCustomName(true);
      setNewKitIcon(icon);
      setNewKitName('');
    } else {
      setIsCustomName(false);
      setNewKitName(name);
      setNewKitIcon(icon);
    }
  };

  const handleCreateKit = async () => {
    const trimmed = newKitName.trim();
    if (!trimmed) { return; }
    try {
      const id = await createKit(trimmed, newKitIcon);
      setShowCreateModal(false);
      await loadKits();
      setSelectedKitId(id);
    } catch (err) {
      console.warn('[MyKitScreen] createKit error:', err);
    }
  };

  const handleDeleteKit = () => {
    if (!selectedKit) return;
    Alert.alert(
      'Delete Kit',
      `Delete "${selectedKit.icon} ${selectedKit.name}"? This removes the kit and all its pinned guides.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteKit(selectedKit.id);
              setSelectedKitId(null);
              setKitGuides([]);
              await loadKits();
            } catch (err) {
              console.warn('[MyKitScreen] deleteKit error:', err);
            }
          },
        },
      ],
    );
  };

  const handleRemoveGuide = async (guideId: string) => {
    if (!selectedKitId) return;
    try {
      await removeGuideFromKit(selectedKitId, guideId);
      setKitGuides((prev) => prev.filter((id) => id !== guideId));
    } catch (err) {
      console.warn('[MyKitScreen] removeGuideFromKit error:', err);
    }
  };

  const handleViewGuide = (guideId: string) => {
    navigation.navigate('Guide', { guideId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading kits…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Kit selector tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabRow}
          contentContainerStyle={styles.tabRowContent}
        >
          {kits.map((kit) => (
            <TouchableOpacity
              key={kit.id}
              style={[styles.kitTab, selectedKitId === kit.id && styles.kitTabActive]}
              onPress={() => handleSelectKit(kit.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.kitTabText, selectedKitId === kit.id && styles.kitTabTextActive]}>
                {kit.icon} {kit.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.newKitTab} onPress={handleOpenCreate} activeOpacity={0.75}>
            <Text style={styles.newKitTabText}>+ NEW KIT</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Selected kit card ── */}
        {selectedKit ? (
          <View style={styles.kitCard}>
            <Text style={styles.kitCardTitle}>{selectedKit.icon} {selectedKit.name}</Text>
            <Text style={styles.kitCardMeta}>Guides: {kitGuides.length}</Text>

            {/* Pinned Guides */}
            <Text style={styles.sectionHeader}>PINNED GUIDES</Text>
            {kitGuides.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No guides pinned yet. Tap 🎒+ on any guide to add it here.
                </Text>
              </View>
            ) : (
              <FlatList
                data={kitGuides}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                renderItem={({ item: guideId }) => {
                  const guide = getGuideById(guideId);
                  return (
                    <View style={styles.guideRow}>
                      <TouchableOpacity
                        style={styles.guideInfo}
                        onPress={() => handleViewGuide(guideId)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.guideTitle} numberOfLines={1}>
                          {guide?.title ?? guideId}
                        </Text>
                        {guide?.category && (
                          <View style={styles.categoryChip}>
                            <Text style={styles.categoryChipText}>{guide.category.toUpperCase()}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemoveGuide(guideId)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.removeBtnText}>REMOVE</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}

            {/* Delete kit */}
            <TouchableOpacity style={styles.deleteKitBtn} onPress={handleDeleteKit} activeOpacity={0.75}>
              <Text style={styles.deleteKitBtnText}>DELETE THIS KIT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.setupPrompt}>
            <Text style={styles.setupTitle}>Set up your first kit</Text>
            <Text style={styles.setupSub}>Choose a kit type to get started:</Text>
            <View style={styles.presetGrid}>
              {DEFAULT_KIT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.name}
                  style={styles.presetBtn}
                  activeOpacity={0.75}
                  onPress={async () => {
                    const name = opt.name === 'Custom' ? 'My Kit' : opt.name;
                    const id = await createKit(name, opt.icon);
                    await loadKits();
                    setSelectedKitId(id);
                  }}
                >
                  <Text style={styles.presetEmoji}>{opt.icon}</Text>
                  <Text style={styles.presetName}>{opt.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Create Kit Modal ── */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Kit</Text>

            <Text style={styles.modalLabel}>Choose a type:</Text>
            <View style={styles.presetGrid}>
              {DEFAULT_KIT_OPTIONS.map((opt) => {
                const isSelected = isCustomName
                  ? opt.name === 'Custom'
                  : newKitName === opt.name && newKitIcon === opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.name}
                    style={[styles.presetBtn, isSelected && styles.presetBtnSelected]}
                    activeOpacity={0.75}
                    onPress={() => handlePickPreset(opt.name, opt.icon)}
                  >
                    <Text style={styles.presetEmoji}>{opt.icon}</Text>
                    <Text style={[styles.presetName, isSelected && styles.presetNameSelected]}>
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isCustomName && (
              <TextInput
                style={styles.nameInput}
                placeholder="Kit name…"
                placeholderTextColor={Colors.textMuted}
                value={newKitName}
                onChangeText={setNewKitName}
                autoFocus
                maxLength={40}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, !newKitName.trim() && styles.createBtnDisabled]}
                onPress={() => { void handleCreateKit(); }}
                activeOpacity={0.75}
                disabled={!newKitName.trim()}
              >
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // Tab row
  tabRow: { marginBottom: 16 },
  tabRowContent: { gap: 8, paddingRight: 8 },
  kitTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  kitTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kitTabText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  kitTabTextActive: { color: '#fff' },
  newKitTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderStyle: 'dashed',
    borderColor: Colors.primary, backgroundColor: 'transparent',
  },
  newKitTabText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  // Kit card
  kitCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.cardBorder, padding: 16,
  },
  kitCardTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  kitCardMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

  // Section header
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: Colors.textSecondary,
    letterSpacing: 1.5, marginBottom: 10, textTransform: 'uppercase',
  },

  // Empty state
  emptyState: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    padding: 16, marginBottom: 16,
  },
  emptyStateText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center' },

  // Guide row
  guideRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    marginBottom: 8, padding: 12, gap: 8,
  },
  guideInfo: { flex: 1, gap: 4 },
  guideTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  categoryChip: {
    alignSelf: 'flex-start', backgroundColor: Colors.primaryDim,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  categoryChipText: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  removeBtn: {
    backgroundColor: '#2A0A0A', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#5A1A1A',
  },
  removeBtnText: { color: '#CC3333', fontSize: 11, fontWeight: '700' },

  // Delete kit
  deleteKitBtn: {
    marginTop: 20, alignSelf: 'flex-start',
    backgroundColor: '#2A0A0A', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#5A1A1A',
  },
  deleteKitBtnText: { color: '#CC3333', fontSize: 13, fontWeight: '700' },

  // Setup prompt
  setupPrompt: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 20, alignItems: 'center',
  },
  setupTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  setupSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },

  // Preset buttons
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  presetBtn: {
    width: '45%', backgroundColor: Colors.surfaceElevated,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 14, alignItems: 'center', gap: 6,
  },
  presetBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryDim },
  presetEmoji: { fontSize: 28 },
  presetName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  presetNameSelected: { color: Colors.primary },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  nameInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 12, color: Colors.textPrimary, fontSize: 15,
    marginTop: 12,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1, backgroundColor: Colors.surfaceElevated,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '700', fontSize: 14 },
  createBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
