import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme/colors';
import {
  GearItem,
  addGearItem,
  deleteGearItem,
  getGearItems,
  initGearInventoryTables,
  seedGearItems,
  updateGearItem,
} from '../db/gearInventory';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  'All', 'Medical', 'Water', 'Food', 'Comms', 'Tools',
  'Navigation', 'Power', 'Security', 'Shelter', 'Vehicle', 'Other',
];

const KIT_OPTIONS = ['', 'Bug-Out Bag', 'Get-Home Bag', 'INCH Bag', 'Cache', 'Vehicle Kit', 'Home'];

const TOTAL_RECOMMENDED = 18;
const DAY_MS = 86400000;
const NOW = () => Date.now();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function expirationStatus(item: GearItem): 'expired' | 'critical' | 'warning' | null {
  const exp = item.expiration_date;
  if (!exp) return null;
  const diff = exp - NOW();
  if (diff < 0) return 'expired';
  if (diff < 30 * DAY_MS) return 'critical';
  if (diff < 90 * DAY_MS) return 'warning';
  return null;
}

function replacementStatus(item: GearItem): 'overdue' | 'due-soon' | null {
  if (!item.replacement_interval_days || !item.last_replaced) return null;
  const dueAt = item.last_replaced + item.replacement_interval_days * DAY_MS;
  const diff = dueAt - NOW();
  if (diff < 0) return 'overdue';
  if (diff < 30 * DAY_MS) return 'due-soon';
  return null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function gramsToDisplay(g: number): string {
  const oz = g / 28.3495;
  const lbs = g / 453.592;
  if (lbs >= 1) return `${lbs.toFixed(2)} lbs`;
  return `${oz.toFixed(1)} oz`;
}

async function scheduleInventoryReminder(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Enable notifications to receive inventory reminders.');
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎒 GridDown — Gear Check',
      body: 'Time to review your gear inventory and check expiration dates.',
      sound: true,
    },
    trigger: {
      seconds: 30 * 24 * 60 * 60,
      repeats: true,
    } as Notifications.TimeIntervalTriggerInput,
  });
  Alert.alert('Reminder Set', 'You will be reminded monthly to review your gear inventory.');
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

type ModalFormProps = {
  visible: boolean;
  initial?: GearItem | null;
  onSave: (data: Omit<GearItem, 'id' | 'created_at'>) => void;
  onDelete?: () => void;
  onClose: () => void;
};

function GearItemModal({ visible, initial, onSave, onDelete, onClose }: ModalFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Medical');
  const [quantity, setQuantity] = useState('1');
  const [weightGrams, setWeightGrams] = useState('');
  const [notes, setNotes] = useState('');
  const [kitAssignment, setKitAssignment] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [replacementDays, setReplacementDays] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showKitPicker, setShowKitPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setCategory(initial?.category ?? 'Medical');
      setQuantity(String(initial?.quantity ?? 1));
      setWeightGrams(initial?.weight_grams ? String(initial.weight_grams) : '');
      setNotes(initial?.notes ?? '');
      setKitAssignment(initial?.kit_assignment ?? '');
      setExpirationDate(initial?.expiration_date ? formatDate(initial.expiration_date) : '');
      setReplacementDays(initial?.replacement_interval_days ? String(initial.replacement_interval_days) : '');
    }
  }, [visible, initial]);

  function parseExpDate(raw: string): number | null {
    if (!raw.trim()) return null;
    const d = new Date(raw.trim());
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  function handleSave() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    onSave({
      name: name.trim(),
      category,
      quantity: parseInt(quantity) || 1,
      weight_grams: weightGrams ? parseInt(weightGrams) : null,
      notes: notes.trim() || null,
      kit_assignment: kitAssignment || null,
      expiration_date: parseExpDate(expirationDate),
      replacement_interval_days: replacementDays ? parseInt(replacementDays) : null,
      last_replaced: initial?.last_replaced ?? null,
    });
  }

  const catList = CATEGORIES.filter(c => c !== 'All');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={ms.container}>
          <View style={ms.header}>
            <Text style={ms.title}>{initial ? 'EDIT ITEM' : 'ADD ITEM'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
            <Text style={ms.label}>NAME *</Text>
            <TextInput style={ms.input} value={name} onChangeText={setName} placeholder="Item name" placeholderTextColor={Colors.textMuted} />

            <Text style={ms.label}>CATEGORY</Text>
            <TouchableOpacity style={ms.selector} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
              <Text style={ms.selectorText}>{category}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showCategoryPicker && (
              <View style={ms.pickerList}>
                {catList.map(c => (
                  <TouchableOpacity key={c} style={ms.pickerItem} onPress={() => { setCategory(c); setShowCategoryPicker(false); }}>
                    <Text style={[ms.pickerItemText, c === category && { color: Colors.primary }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={ms.label}>QUANTITY</Text>
            <TextInput style={ms.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.textMuted} />

            <Text style={ms.label}>WEIGHT (grams)</Text>
            <TextInput style={ms.input} value={weightGrams} onChangeText={setWeightGrams} keyboardType="numeric" placeholder="e.g. 150" placeholderTextColor={Colors.textMuted} />

            <Text style={ms.label}>EXPIRATION DATE (e.g. Jan 1, 2029)</Text>
            <TextInput style={ms.input} value={expirationDate} onChangeText={setExpirationDate} placeholder="Leave blank if none" placeholderTextColor={Colors.textMuted} />

            <Text style={ms.label}>REPLACEMENT INTERVAL (days)</Text>
            <TextInput style={ms.input} value={replacementDays} onChangeText={setReplacementDays} keyboardType="numeric" placeholder="e.g. 730 for 2 years" placeholderTextColor={Colors.textMuted} />

            <Text style={ms.label}>KIT ASSIGNMENT</Text>
            <TouchableOpacity style={ms.selector} onPress={() => setShowKitPicker(!showKitPicker)}>
              <Text style={ms.selectorText}>{kitAssignment || 'None'}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showKitPicker && (
              <View style={ms.pickerList}>
                {KIT_OPTIONS.map(k => (
                  <TouchableOpacity key={k || '__none'} style={ms.pickerItem} onPress={() => { setKitAssignment(k); setShowKitPicker(false); }}>
                    <Text style={[ms.pickerItemText, k === kitAssignment && { color: Colors.primary }]}>{k || 'None'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={ms.label}>NOTES</Text>
            <TextInput style={[ms.input, { minHeight: 72, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} multiline placeholder="Optional notes..." placeholderTextColor={Colors.textMuted} />

            <TouchableOpacity style={ms.saveBtn} onPress={handleSave}>
              <Text style={ms.saveBtnText}>{initial ? 'SAVE CHANGES' : 'ADD ITEM'}</Text>
            </TouchableOpacity>
            {initial && onDelete && (
              <TouchableOpacity style={ms.deleteBtn} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={ms.deleteBtnText}>DELETE ITEM</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  title: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 2 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 4, marginTop: 4 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 6, color: Colors.textPrimary, padding: 10, fontSize: 14 },
  selector: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  selectorText: { color: Colors.textPrimary, fontSize: 14 },
  pickerList: { backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 6, overflow: 'hidden' },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  pickerItemText: { color: Colors.textPrimary, fontSize: 14 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1.5 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, marginTop: 4 },
  deleteBtnText: { color: Colors.danger, fontWeight: '600', fontSize: 13 },
});

// ─── Gear Item Row ────────────────────────────────────────────────────────────

function GearItemRow({ item, onPress }: { item: GearItem; onPress: () => void }) {
  const expStatus = expirationStatus(item);
  const replStatus = replacementStatus(item);
  const alertStatus = expStatus === 'expired' || expStatus === 'critical' || replStatus === 'overdue'
    ? 'critical' : (expStatus === 'warning' || replStatus === 'due-soon' ? 'warning' : null);

  const badgeColor = alertStatus === 'critical' ? Colors.danger : alertStatus === 'warning' ? Colors.warning : Colors.secondary;

  return (
    <TouchableOpacity style={rs.row} onPress={onPress} activeOpacity={0.7}>
      <View style={rs.left}>
        <View style={rs.nameRow}>
          <Text style={rs.name} numberOfLines={1}>{item.name}</Text>
          {alertStatus && (
            <View style={[rs.alertDot, { backgroundColor: badgeColor }]}>
              <Ionicons name={alertStatus === 'critical' ? 'warning' : 'time-outline'} size={10} color="#fff" />
            </View>
          )}
        </View>
        <View style={rs.metaRow}>
          <View style={rs.catBadge}><Text style={rs.catText}>{item.category}</Text></View>
          <Text style={rs.meta}>×{item.quantity}</Text>
          {item.kit_assignment ? <Text style={rs.meta}> · {item.kit_assignment}</Text> : null}
          {item.weight_grams ? <Text style={rs.meta}> · {item.weight_grams}g</Text> : null}
        </View>
        {item.expiration_date && (
          <Text style={[rs.expText, { color: alertStatus === 'critical' ? Colors.danger : alertStatus === 'warning' ? Colors.warning : Colors.textMuted }]}>
            Exp: {formatDate(item.expiration_date)}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const rs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.cardBorder },
  left: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  alertDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  catBadge: { backgroundColor: Colors.primaryDim, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catText: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 0.8 },
  meta: { fontSize: 12, color: Colors.textSecondary },
  expText: { fontSize: 11, marginTop: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function GearInventoryScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortMode, setSortMode] = useState<'name' | 'expiration'>('name');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);

  const loadItems = useCallback(async () => {
    try {
      await initGearInventoryTables();
      await seedGearItems();
      const data = await getGearItems();
      setItems(data);
    } catch (e) {
      console.error('GearInventory load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const filteredItems = useMemo(() => {
    let list = selectedCategory === 'All' ? items : items.filter(i => i.category === selectedCategory);
    if (sortMode === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => {
        const ea = a.expiration_date ?? Infinity;
        const eb = b.expiration_date ?? Infinity;
        return ea - eb;
      });
    }
    return list;
  }, [items, selectedCategory, sortMode]);

  const totalWeightGrams = useMemo(() =>
    items.reduce((sum, i) => sum + (i.weight_grams ? i.weight_grams * i.quantity : 0), 0), [items]);

  const score = useMemo(() => ({
    count: Math.min(items.length, TOTAL_RECOMMENDED),
    pct: Math.round((Math.min(items.length, TOTAL_RECOMMENDED) / TOTAL_RECOMMENDED) * 100),
  }), [items]);

  async function handleSave(data: Omit<GearItem, 'id' | 'created_at'>) {
    if (editingItem) {
      await updateGearItem(editingItem.id, data);
    } else {
      await addGearItem(data);
    }
    setModalVisible(false);
    setEditingItem(null);
    await loadItems();
  }

  async function handleDelete() {
    if (!editingItem) return;
    Alert.alert('Delete Item', `Remove "${editingItem.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteGearItem(editingItem.id);
        setModalVisible(false);
        setEditingItem(null);
        await loadItems();
      }},
    ]);
  }

  function openAdd() { setEditingItem(null); setModalVisible(true); }
  function openEdit(item: GearItem) { setEditingItem(item); setModalVisible(true); }

  const scoreColor = score.pct >= 80 ? Colors.success : score.pct >= 50 ? Colors.warning : Colors.danger;

  const ListHeader = (
    <View>
      {/* Bug-Out Bag Score */}
      <View style={ss.scoreCard}>
        <View style={ss.scoreHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={ss.scoreTitle}>BUG-OUT BAG SCORE</Text>
        </View>
        <View style={ss.scoreRow}>
          <Text style={[ss.scorePct, { color: scoreColor }]}>{score.pct}%</Text>
          <Text style={ss.scoreDetail}>{score.count} / {TOTAL_RECOMMENDED} recommended items</Text>
        </View>
        <View style={ss.progressBg}>
          <View style={[ss.progressFill, { width: `${score.pct}%` as any, backgroundColor: scoreColor }]} />
        </View>
      </View>

      {/* Weight Summary */}
      {totalWeightGrams > 0 && (
        <View style={ss.weightRow}>
          <Ionicons name="barbell-outline" size={14} color={Colors.textSecondary} />
          <Text style={ss.weightLabel}>TOTAL WEIGHT</Text>
          <Text style={ss.weightValue}>
            {totalWeightGrams}g · {gramsToDisplay(totalWeightGrams)}
          </Text>
        </View>
      )}

      {/* Check Inventory Button */}
      <TouchableOpacity style={ss.reminderBtn} onPress={scheduleInventoryReminder}>
        <Ionicons name="notifications-outline" size={15} color={Colors.primary} />
        <Text style={ss.reminderText}>SCHEDULE MONTHLY CHECK REMINDER</Text>
      </TouchableOpacity>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.chipScroll} contentContainerStyle={ss.chipContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[ss.chip, selectedCategory === cat && ss.chipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[ss.chipText, selectedCategory === cat && ss.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Toggle */}
      <View style={ss.sortRow}>
        <Text style={ss.countText}>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</Text>
        <View style={ss.sortToggle}>
          <TouchableOpacity style={[ss.sortBtn, sortMode === 'name' && ss.sortBtnActive]} onPress={() => setSortMode('name')}>
            <Text style={[ss.sortBtnText, sortMode === 'name' && ss.sortBtnTextActive]}>A–Z</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ss.sortBtn, sortMode === 'expiration' && ss.sortBtnActive]} onPress={() => setSortMode('expiration')}>
            <Text style={[ss.sortBtnText, sortMode === 'expiration' && ss.sortBtnTextActive]}>EXP DATE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={ss.screen}>
      {/* Screen Header */}
      <View style={ss.screenHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={ss.screenTitle}>GEAR INVENTORY</Text>
        <TouchableOpacity onPress={openAdd} style={ss.addBtn}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={ss.centered}><Text style={ss.loadingText}>LOADING...</Text></View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <GearItemRow item={item} onPress={() => openEdit(item)} />}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={ss.list}
          ListEmptyComponent={
            <View style={ss.emptyState}>
              <Ionicons name="bag-outline" size={40} color={Colors.textMuted} />
              <Text style={ss.emptyText}>NO ITEMS IN THIS CATEGORY</Text>
            </View>
          }
        />
      )}

      <GearItemModal
        visible={modalVisible}
        initial={editingItem}
        onSave={handleSave}
        onDelete={editingItem ? handleDelete : undefined}
        onClose={() => { setModalVisible(false); setEditingItem(null); }}
      />
    </View>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  screenTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 2 },
  addBtn: { padding: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: Colors.textMuted, letterSpacing: 2, fontSize: 13 },
  list: { padding: 12, paddingBottom: 40 },

  // Score card
  scoreCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  scoreHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  scoreTitle: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 8 },
  scorePct: { fontSize: 32, fontWeight: '800' },
  scoreDetail: { fontSize: 13, color: Colors.textSecondary },
  progressBg: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Weight row
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  weightLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.2, flex: 1 },
  weightValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },

  // Reminder
  reminderBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.primaryDim, marginBottom: 12 },
  reminderText: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },

  // Chips
  chipScroll: { marginBottom: 10 },
  chipContainer: { gap: 6, paddingRight: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },

  // Sort row
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  countText: { fontSize: 12, color: Colors.textMuted },
  sortToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 6, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  sortBtnActive: { backgroundColor: Colors.primaryDim },
  sortBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  sortBtnTextActive: { color: Colors.primary },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 12, letterSpacing: 1.5 },
});
