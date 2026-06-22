import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StyleSheet, FlatList,
} from 'react-native';
import { Colors } from '../theme/colors';
import FOOD_DATA from '../assets/content/food-storage.json';

type FoodTab = 'Calculator' | 'ShelfLife' | 'Seeds' | 'FIFO';

const TABS: FoodTab[] = ['Calculator', 'ShelfLife', 'Seeds', 'FIFO'];

interface FoodItem {
  id: string; name: string; category: string;
  calsPer100g: number; calsPerLb: number;
  servingGrams: number; servingCals: number;
  shelfLifeYears: number; storageNote: string;
  unit: string; lbsPerPerson30Day: number;
}

const ITEMS = FOOD_DATA.items as FoodItem[];
const SEEDS = FOOD_DATA.seeds;

function shelfLifeLabel(years: number): string {
  if (years >= 9999) return 'Indefinite';
  if (years >= 25)   return `${years}+ years`;
  return `${years} year${years !== 1 ? 's' : ''}`;
}

function shelfLifeColor(years: number): string {
  if (years >= 9999) return Colors.primary;
  if (years >= 10)   return Colors.success;
  if (years >= 3)    return Colors.warning;
  return Colors.danger;
}

// ─── 30-Day Calculator ────────────────────────────────────────────────────────

interface SupplyRow {
  item: FoodItem;
  totalLbs: number;
  totalCals: number;
}

function calcSupply(people: number, target: number): SupplyRow[] {
  return ITEMS
    .filter((item) => item.lbsPerPerson30Day > 0)
    .map((item) => {
      const totalLbs = Math.ceil(item.lbsPerPerson30Day * people * 10) / 10;
      const totalCals = Math.round(totalLbs * item.calsPerLb);
      return { item, totalLbs, totalCals };
    });
}

function CalculatorTab() {
  const [people, setPeople] = useState('2');
  const [calorieTarget, setCalorieTarget] = useState('2000');

  const numPeople = Math.max(1, parseInt(people) || 1);
  const supply = calcSupply(numPeople, parseInt(calorieTarget) || 2000);
  const totalCals = supply.reduce((s, r) => s + r.totalCals, 0);
  const calsPerPersonPerDay = Math.round(totalCals / numPeople / 30);

  return (
    <>
      <View style={fc.calcInputRow}>
        <View style={fc.calcField}>
          <Text style={fc.fieldLabel}>People</Text>
          <TextInput
            style={fc.input}
            keyboardType="number-pad"
            value={people}
            onChangeText={setPeople}
            maxLength={2}
          />
        </View>
        <View style={fc.calcField}>
          <Text style={fc.fieldLabel}>Cal/Person/Day</Text>
          <TextInput
            style={fc.input}
            keyboardType="number-pad"
            value={calorieTarget}
            onChangeText={setCalorieTarget}
            maxLength={4}
          />
        </View>
      </View>

      <View style={fc.summaryBox}>
        <Text style={fc.summaryTitle}>30-Day Supply for {numPeople} person{numPeople > 1 ? 's' : ''}</Text>
        <Text style={fc.summaryNote}>~{calsPerPersonPerDay} cal/person/day from this baseline</Text>
        <Text style={fc.summaryWarning}>⚠️ This is a shelf-stable baseline. Supplement with canned goods, garden produce, and hunting/fishing where possible.</Text>
      </View>

      {supply.map(({ item, totalLbs }) => (
        <View key={item.id} style={fc.supplyRow}>
          <View style={fc.supplyLeft}>
            <Text style={fc.supplyName}>{item.name}</Text>
            <Text style={fc.supplyCategory}>{item.category}</Text>
          </View>
          <View style={fc.supplyRight}>
            <Text style={fc.supplyQty}>{totalLbs} {item.unit}</Text>
            <Text style={fc.supplySub}>{item.calsPerLb} cal/lb</Text>
          </View>
        </View>
      ))}
    </>
  );
}

// ─── Shelf Life Tab ───────────────────────────────────────────────────────────

function ShelfLifeTab() {
  const [filter, setFilter] = useState<string>('All');
  const categories = ['All', ...Array.from(new Set(ITEMS.map((i) => i.category)))];
  const filtered = filter === 'All' ? ITEMS : ITEMS.filter((i) => i.category === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (a.shelfLifeYears === b.shelfLifeYears) return 0;
    if (a.shelfLifeYears >= 9999) return -1;
    if (b.shelfLifeYears >= 9999) return 1;
    return b.shelfLifeYears - a.shelfLifeYears;
  });

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fc.filterRow} contentContainerStyle={fc.filterRowContent}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            style={[fc.filterBtn, filter === c && fc.filterBtnActive]}
            onPress={() => setFilter(c)}
          >
            <Text style={[fc.filterLabel, filter === c && fc.filterLabelActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {sorted.map((item) => (
        <View key={item.id} style={fc.shelfCard}>
          <View style={fc.shelfHeader}>
            <Text style={fc.shelfName}>{item.name}</Text>
            <View style={[fc.shelfBadge, { backgroundColor: shelfLifeColor(item.shelfLifeYears) + '33' }]}>
              <Text style={[fc.shelfBadgeText, { color: shelfLifeColor(item.shelfLifeYears) }]}>
                {shelfLifeLabel(item.shelfLifeYears)}
              </Text>
            </View>
          </View>
          <Text style={fc.shelfNote}>{item.storageNote}</Text>
          <Text style={fc.shelfCals}>{item.calsPerLb > 0 ? `${item.calsPerLb} cal/lb` : 'Non-caloric'} · {item.servingCals > 0 ? `${item.servingCals} cal/serving (${item.servingGrams}g)` : '—'}</Text>
        </View>
      ))}
    </>
  );
}

// ─── Seeds Tab ────────────────────────────────────────────────────────────────

function SeedsTab() {
  return (
    <>
      <View style={fc.infoBanner}>
        <Text style={fc.infoBannerText}>Heirloom (open-pollinated) seeds produce viable seeds from their harvest — you can replant year after year without buying new seeds. Avoid hybrid or GMO seeds for long-term storage.</Text>
      </View>
      {SEEDS.map((seed) => (
        <View key={seed.name} style={fc.seedCard}>
          <View style={fc.seedHeader}>
            <Text style={fc.seedName}>{seed.name}</Text>
            <View style={fc.seedTypeBadge}><Text style={fc.seedTypeText}>{seed.type}</Text></View>
          </View>
          <Text style={fc.seedNote}>{seed.note}</Text>
        </View>
      ))}
      <View style={fc.seedStorageCard}>
        <Text style={fc.seedStorageTitle}>Storing Heirloom Seeds</Text>
        <Text style={fc.seedStorageText}>
          {'• Store seeds in a cool (40–50°F / 4–10°C), dark, dry location.\n• Vacuum-sealed Mylar packets with silica gel extend viability 5–10+ years.\n• Test viability by germinating 10 seeds on a damp paper towel — expect 70%+ germination rate.\n• Rotate seed stock every 3–5 years even with proper storage.\n• Label with seed name, variety, harvest year, and germination rate.'}
        </Text>
      </View>
    </>
  );
}

// ─── FIFO Tab ─────────────────────────────────────────────────────────────────

const FIFO_TIPS = [
  { title: 'First In, First Out (FIFO)', content: 'Always place newly purchased items behind existing stock. Use items from the front — oldest first. This prevents items from expiring before use.' },
  { title: 'Label Everything', content: 'Write the purchase date and "use by" date on every container with a permanent marker. Include lot number for commercially canned goods.' },
  { title: 'Rotation Schedule', content: 'Do a full inventory check every 6 months. Flag anything within 6 months of expiry — move it into your regular meal rotation immediately.' },
  { title: 'Store What You Eat, Eat What You Store', content: 'Only stockpile foods your household actually consumes. If you do not normally eat lentils, a 50-lb bag of lentils is not a useful food reserve — it will not be used, and your family will not know how to prepare it under stress.' },
  { title: 'Temperature Matters', content: 'Every 10°F (5.6°C) drop in storage temperature approximately doubles shelf life. A root cellar at 50°F will keep canned goods 2× longer than a hot garage at 90°F.' },
  { title: 'Vermin Protection', content: 'Store all dry goods in sealed hard-sided containers (Mylar inside 5-gallon food-grade buckets with gamma lids). Steel containers for long-term. Do not store food on the ground — rodents can chew through soft plastic.' },
  { title: 'Water for Preparation', content: 'Most shelf-stable foods (rice, beans, freeze-dried) require water to prepare. Your water supply and your food supply are coupled — calculate water needs for cooking in your overall plan.' },
];

function FIFOTab() {
  return (
    <>
      {FIFO_TIPS.map((tip) => (
        <View key={tip.title} style={fc.fifoCard}>
          <Text style={fc.fifoTitle}>{tip.title}</Text>
          <Text style={fc.fifoContent}>{tip.content}</Text>
        </View>
      ))}
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function FoodScreen() {
  const [tab, setTab] = useState<FoodTab>('Calculator');

  return (
    <SafeAreaView style={fc.safe}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fc.tabBar} contentContainerStyle={fc.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[fc.tabBtn, tab === t && fc.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[fc.tabLabel, tab === t && fc.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={fc.content} showsVerticalScrollIndicator={false}>
        {tab === 'Calculator' && <CalculatorTab />}
        {tab === 'ShelfLife'  && <ShelfLifeTab />}
        {tab === 'Seeds'      && <SeedsTab />}
        {tab === 'FIFO'       && <FIFOTab />}
      </ScrollView>
    </SafeAreaView>
  );
}

const fc = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabBar: { maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  tabBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  content: { padding: 12, gap: 10, paddingBottom: 40 },

  calcInputRow: { flexDirection: 'row', gap: 12 },
  calcField: { flex: 1 },
  fieldLabel: { color: Colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, color: Colors.textPrimary, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  summaryBox: { backgroundColor: Colors.primaryDim, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.primary, gap: 4 },
  summaryTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  summaryNote: { color: Colors.primary, fontSize: 13 },
  summaryWarning: { color: Colors.warning, fontSize: 12, marginTop: 4 },
  supplyRow: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, flexDirection: 'row', alignItems: 'center' },
  supplyLeft: { flex: 1 },
  supplyName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  supplyCategory: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  supplyRight: { alignItems: 'flex-end' },
  supplyQty: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  supplySub: { color: Colors.textMuted, fontSize: 11 },

  filterRow: { maxHeight: 40 },
  filterRowContent: { gap: 8, alignItems: 'center' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  filterBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  filterLabel: { color: Colors.textSecondary, fontSize: 12 },
  filterLabelActive: { color: Colors.primary },
  shelfCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6 },
  shelfHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shelfName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  shelfBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  shelfBadgeText: { fontSize: 11, fontWeight: '800' },
  shelfNote: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },
  shelfCals: { color: Colors.textMuted, fontSize: 11 },

  infoBanner: { backgroundColor: Colors.infoBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.info },
  infoBannerText: { color: Colors.info, fontSize: 12, lineHeight: 17 },
  seedCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  seedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  seedName: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  seedTypeBadge: { backgroundColor: Colors.secondaryDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  seedTypeText: { color: Colors.secondary, fontSize: 11, fontWeight: '700' },
  seedNote: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  seedStorageCard: { backgroundColor: Colors.primaryDim, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.primary },
  seedStorageTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  seedStorageText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },

  fifoCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6 },
  fifoTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  fifoContent: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
