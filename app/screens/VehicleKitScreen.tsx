import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet, Alert,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../theme/colors';

// ─── SQLite ──────────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;
async function getDb() {
  if (!_db) _db = await SQLite.openDatabaseAsync('griddown.db');
  return _db;
}

async function initVehicleKitTable() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vehicle_kit_items (
      id TEXT PRIMARY KEY,
      checked INTEGER DEFAULT 0
    );
  `);
}

async function loadChecked(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM vehicle_kit_items WHERE checked = 1');
  return new Set(rows.map((r) => r.id));
}

async function setChecked(id: string, checked: boolean) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO vehicle_kit_items (id, checked) VALUES (?, ?)',
    [id, checked ? 1 : 0]
  );
}

async function resetAll() {
  const db = await getDb();
  await db.runAsync('UPDATE vehicle_kit_items SET checked = 0');
}

// ─── Data ────────────────────────────────────────────────────────────────────

interface KitItem { id: string; label: string; priority: 'critical' | 'important' | 'optional'; }
interface KitCategory { category: string; icon: string; items: KitItem[]; }

const KIT: KitCategory[] = [
  {
    category: 'Safety', icon: '🦺',
    items: [
      { id: 'sf-vest',       label: 'High-visibility safety vest',            priority: 'critical' },
      { id: 'sf-triangle',   label: 'Reflective warning triangles (3)',        priority: 'critical' },
      { id: 'sf-flares',     label: 'Road flares or LED flashers',             priority: 'critical' },
      { id: 'sf-extinguish', label: 'Fire extinguisher (2.5 lb ABC)',          priority: 'critical' },
      { id: 'sf-torch',      label: 'Flashlight + extra batteries',            priority: 'critical' },
      { id: 'sf-seatbelt',   label: 'Seatbelt cutter / window breaker',        priority: 'critical' },
      { id: 'sf-gloves',     label: 'Work gloves (leather or mechanic)',        priority: 'important' },
    ],
  },
  {
    category: 'Tools', icon: '🔧',
    items: [
      { id: 'tl-jumper',    label: 'Jumper cables (12 ft, 6 gauge)',            priority: 'critical' },
      { id: 'tl-jack',      label: 'Hydraulic floor jack + jack stands',        priority: 'critical' },
      { id: 'tl-spare',     label: 'Spare tire (inflated & in good condition)', priority: 'critical' },
      { id: 'tl-lug',       label: 'Lug wrench (torque-rated)',                 priority: 'critical' },
      { id: 'tl-towstrap',  label: 'Tow strap (20,000 lb rating)',             priority: 'important' },
      { id: 'tl-fixaflat',  label: 'Tire inflator / Fix-a-Flat',               priority: 'important' },
      { id: 'tl-multi',     label: 'Multi-tool (Leatherman or equivalent)',     priority: 'important' },
      { id: 'tl-duct',      label: 'Duct tape + zip ties',                     priority: 'important' },
      { id: 'tl-fuses',     label: 'Fuse kit (assorted auto fuses)',            priority: 'optional' },
      { id: 'tl-fluids',    label: 'Engine oil quart (correct weight)',         priority: 'optional' },
      { id: 'tl-coolant',   label: 'Coolant / antifreeze quart',               priority: 'optional' },
    ],
  },
  {
    category: 'Medical', icon: '🩺',
    items: [
      { id: 'md-tourniquet', label: 'CAT or SOFTT-W Tourniquet',              priority: 'critical' },
      { id: 'md-gauze',      label: 'QuikClot hemostatic gauze',              priority: 'critical' },
      { id: 'md-bandage',    label: 'Israeli pressure bandage',               priority: 'critical' },
      { id: 'md-fak',        label: 'IFAK / trauma kit',                      priority: 'critical' },
      { id: 'md-nitrile',    label: 'Nitrile gloves (2 pairs)',               priority: 'important' },
      { id: 'md-meds',       label: 'OTC medications (ibuprofen, antacid)',   priority: 'important' },
      { id: 'md-prescription',label: 'Personal prescription medication (1 week extra)', priority: 'important' },
      { id: 'md-epipen',     label: 'EpiPen if allergic history',             priority: 'critical' },
    ],
  },
  {
    category: 'Survival', icon: '🎒',
    items: [
      { id: 'sv-water',   label: 'Water (1 gallon minimum per person)',    priority: 'critical' },
      { id: 'sv-food',    label: 'Food bars / MRE (2,400 cal)',            priority: 'important' },
      { id: 'sv-blanket', label: 'Emergency Mylar blankets (2)',           priority: 'critical' },
      { id: 'sv-rain',    label: 'Poncho or rain gear',                    priority: 'important' },
      { id: 'sv-filter',  label: 'Water filter (LifeStraw or Sawyer)',     priority: 'important' },
      { id: 'sv-knife',   label: 'Fixed blade knife or multitool knife',   priority: 'important' },
      { id: 'sv-cord',    label: '50 ft paracord (550 lb)',                priority: 'optional' },
      { id: 'sv-whistle', label: 'Signal whistle (pealess)',               priority: 'important' },
      { id: 'sv-matches', label: 'Waterproof matches + lighter',           priority: 'important' },
      { id: 'sv-cash',    label: 'Emergency cash $50–$200 small bills',    priority: 'critical' },
      { id: 'sv-docs',    label: 'Copies of important documents (laminated)', priority: 'important' },
    ],
  },
  {
    category: 'Communication', icon: '📡',
    items: [
      { id: 'cm-noaa',    label: 'NOAA weather radio (battery/hand-crank)', priority: 'critical' },
      { id: 'cm-charger', label: 'Phone charger + car USB adapter',         priority: 'critical' },
      { id: 'cm-battery', label: 'Portable power bank (10,000+ mAh)',       priority: 'important' },
      { id: 'cm-frs',     label: 'FRS/GMRS walkie-talkies (pair)',          priority: 'important' },
      { id: 'cm-map',     label: 'Physical road maps (local + regional)',   priority: 'important' },
      { id: 'cm-list',    label: 'Emergency contact list (printed)',         priority: 'critical' },
    ],
  },
  {
    category: 'Winter-Specific', icon: '❄️',
    items: [
      { id: 'wn-shovel',   label: 'Collapsible snow shovel',                priority: 'critical' },
      { id: 'wn-sand',     label: 'Sand or kitty litter (traction bag)',     priority: 'critical' },
      { id: 'wn-chains',   label: 'Tire chains or traction boards',          priority: 'important' },
      { id: 'wn-scraper',  label: 'Ice scraper + snow brush',               priority: 'critical' },
      { id: 'wn-warmgear', label: 'Extra warm clothing + boots + hat + gloves', priority: 'critical' },
      { id: 'wn-sleepbag', label: 'Sleeping bag (0°F rated)',               priority: 'important' },
      { id: 'wn-handwarm', label: 'Chemical hand warmers (12+ pack)',        priority: 'important' },
      { id: 'wn-antifreeze',label: 'Windshield washer fluid (winter rated)', priority: 'important' },
      { id: 'wn-candles',  label: 'Emergency candles (heat source last resort)', priority: 'optional' },
    ],
  },
];

const PRIORITY_COLORS: Record<KitItem['priority'], string> = {
  critical:  Colors.danger,
  important: Colors.warning,
  optional:  Colors.textMuted,
};

export function VehicleKitScreen() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [expandedCat, setExpandedCat] = useState<string | null>('Safety');

  useEffect(() => {
    initVehicleKitTable().then(async () => {
      const ids = await loadChecked();
      setCheckedIds(ids);
    });
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    const newChecked = !checkedIds.has(id);
    await setChecked(id, newChecked);
    setCheckedIds((prev) => {
      const next = new Set(prev);
      newChecked ? next.add(id) : next.delete(id);
      return next;
    });
  }, [checkedIds]);

  const handleReset = () => {
    Alert.alert('Reset Checklist', 'Mark all items as unchecked?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive',
        onPress: async () => {
          await resetAll();
          setCheckedIds(new Set());
        },
      },
    ]);
  };

  const allItems = KIT.flatMap((c) => c.items);
  const totalCount = allItems.length;
  const checkedCount = allItems.filter((i) => checkedIds.has(i.id)).length;
  const pct = Math.round((checkedCount / totalCount) * 100);

  return (
    <SafeAreaView style={v.safe}>
      {/* Header progress */}
      <View style={v.header}>
        <View>
          <Text style={v.headerTitle}>Vehicle Emergency Kit</Text>
          <Text style={v.headerSub}>{checkedCount} / {totalCount} items packed ({pct}%)</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={v.resetBtn}>
          <Text style={v.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Overall progress bar */}
      <View style={v.progressBg}>
        <View style={[v.progressFill, { width: `${pct}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={v.content} showsVerticalScrollIndicator={false}>
        {KIT.map((cat) => {
          const catChecked = cat.items.filter((i) => checkedIds.has(i.id)).length;
          const catPct = Math.round((catChecked / cat.items.length) * 100);
          const isExpanded = expandedCat === cat.category;

          return (
            <View key={cat.category} style={v.catCard}>
              <TouchableOpacity
                style={v.catHeader}
                onPress={() => setExpandedCat(isExpanded ? null : cat.category)}
              >
                <Text style={v.catIcon}>{cat.icon}</Text>
                <View style={v.catHeaderText}>
                  <Text style={v.catTitle}>{cat.category}</Text>
                  <Text style={v.catProgress}>{catChecked}/{cat.items.length} · {catPct}%</Text>
                </View>
                <View style={v.catProgressBg}>
                  <View style={[v.catProgressFill, { width: `${catPct}%` as any }]} />
                </View>
                <Text style={v.catChevron}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded && cat.items.map((item) => {
                const checked = checkedIds.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[v.itemRow, checked && v.itemRowChecked]}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[v.checkbox, checked && v.checkboxChecked]}>
                      {checked && <Text style={v.checkmark}>✓</Text>}
                    </View>
                    <Text style={[v.itemLabel, checked && v.itemLabelChecked]}>{item.label}</Text>
                    <View style={[v.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <View style={v.legend}>
          <Text style={v.legendTitle}>Priority Legend</Text>
          <View style={v.legendRow}>
            <View style={[v.priorityDot, { backgroundColor: Colors.danger }]} />
            <Text style={v.legendText}>Critical — pack first</Text>
          </View>
          <View style={v.legendRow}>
            <View style={[v.priorityDot, { backgroundColor: Colors.warning }]} />
            <Text style={v.legendText}>Important — pack before travel</Text>
          </View>
          <View style={v.legendRow}>
            <View style={[v.priorityDot, { backgroundColor: Colors.textMuted }]} />
            <Text style={v.legendText}>Optional — enhances preparedness</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const v = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  resetBtn: { backgroundColor: Colors.dangerBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.danger },
  resetText: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
  progressBg: { height: 4, backgroundColor: Colors.surfaceBorder, marginHorizontal: 16 },
  progressFill: { height: 4, backgroundColor: Colors.primary },
  content: { padding: 12, gap: 10, paddingBottom: 40 },
  catCard: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  catIcon: { fontSize: 20 },
  catHeaderText: { flex: 1 },
  catTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  catProgress: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  catProgressBg: { width: 60, height: 4, backgroundColor: Colors.surfaceBorder, borderRadius: 2 },
  catProgressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  catChevron: { color: Colors.textMuted, fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  itemRowChecked: { backgroundColor: Colors.successBg },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.textOnPrimary, fontSize: 12, fontWeight: '800' },
  itemLabel: { flex: 1, color: Colors.textPrimary, fontSize: 13 },
  itemLabelChecked: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  legend: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 8 },
  legendTitle: { color: Colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendText: { color: Colors.textSecondary, fontSize: 12 },
});
