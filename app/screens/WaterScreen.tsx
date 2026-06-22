import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

type Section = 'methods' | 'finding' | 'storage';

interface Method {
  name: string;
  icon: string;
  effectiveness: string;
  kills: string;
  pros: string[];
  cons: string[];
  steps: string[];
  note?: string;
}

const METHODS: Method[] = [
  {
    name: 'Boiling',
    icon: '🔥',
    effectiveness: 'Gold standard — kills all pathogens',
    kills: 'Bacteria, viruses, protozoa, Giardia, Cryptosporidium',
    pros: ['No equipment required beyond heat source', 'Works for any volume', 'No chemical taste'],
    cons: ['Requires fuel', 'Slow cooling time', 'Does not remove chemical contamination'],
    steps: [
      'Bring water to a rolling boil.',
      'At sea level (< 6,500 ft): boil at least 1 minute.',
      'At elevation > 6,500 ft: boil at least 3 minutes (lower boiling point).',
      'Let cool naturally — do not add ice from unknown sources.',
      'Store in a clean, sealed container.',
    ],
    note: 'Filter visibly turbid water through cloth first. Boiling does not remove heavy metals or chemicals.',
  },
  {
    name: 'Chlorine Tablets (Halazone / Aquatabs)',
    icon: '💊',
    effectiveness: 'Kills bacteria and viruses; limited against Cryptosporidium',
    kills: 'Bacteria, viruses, Giardia (with double dose)',
    pros: ['Lightweight', 'No equipment', '5-year shelf life'],
    cons: ['Does not kill Cryptosporidium at standard dose', 'Taste alteration', 'Wait time 30 min'],
    steps: [
      'Use 1 tablet per 1 quart (1L) of clear water.',
      'For turbid water: double the dose and filter first.',
      'Shake to dissolve; wait 30 minutes minimum before drinking.',
      'For cold water (< 40°F / 4°C): wait 60 minutes.',
      'Loosen cap and invert bottle to flush threads.',
    ],
    note: 'Ineffective at standard doses against Cryptosporidium. Combine with filtration for full protection.',
  },
  {
    name: 'Iodine Tablets',
    icon: '🟣',
    effectiveness: 'Similar to chlorine; not recommended for extended use',
    kills: 'Bacteria, viruses, Giardia',
    pros: ['Lightweight', 'Inexpensive', 'Fast-acting'],
    cons: ['Not recommended for pregnancy, thyroid conditions, or shellfish allergies', 'Taste alteration', 'No effect on Cryptosporidium'],
    steps: [
      'Use 1 tablet per quart (2 tablets for turbid water).',
      'Wait 30 minutes (60 in cold water).',
      'Add vitamin C tablet (ascorbic acid) to neutralize taste after wait time.',
    ],
    note: 'Not for long-term use. Avoid if pregnant or have thyroid issues.',
  },
  {
    name: 'Sawyer Squeeze / Hollow-Fiber Filter',
    icon: '🪣',
    effectiveness: 'Removes bacteria and protozoa to 0.1 micron; does NOT remove viruses',
    kills: 'Bacteria, protozoa, Giardia, Cryptosporidium',
    pros: ['Fast flow rate', 'No chemicals', '100,000+ gallon lifespan', 'Backwash to restore'],
    cons: ['Does not remove viruses (use with tablet for wilderness + international)', 'Can freeze and crack in cold'],
    steps: [
      'Fill the pouch or source bag with water.',
      'Thread filter onto pouch; squeeze water through.',
      'Backwash regularly with clean water to maintain flow.',
      'Never freeze the filter element.',
    ],
    note: 'Fine for backcountry US/Canada. Add chlorine tablet for international or flood water (virus risk).',
  },
  {
    name: 'LifeStraw / Straw Filter',
    icon: '🥤',
    effectiveness: 'Point-of-use; removes bacteria and protozoa',
    kills: 'Bacteria, protozoa',
    pros: ['No prep time', 'Compact', 'No moving parts'],
    cons: ['Cannot fill containers directly', 'Does not remove viruses or chemicals', 'Must drink in-place'],
    steps: [
      'Place straw directly in water source.',
      'Blow out sharply before first use to prime.',
      'Drink normally — filter media cleans as you draw.',
      'After use: blow air back through to clear water from membrane.',
    ],
  },
  {
    name: 'UV Purification (SteriPen)',
    icon: '☀️',
    effectiveness: 'Kills all pathogens including viruses — does not filter particles',
    kills: 'Bacteria, viruses, protozoa, Giardia, Cryptosporidium',
    pros: ['Very fast (90 seconds per liter)', 'No taste impact', 'No chemicals'],
    cons: ['Battery dependent', 'Does not work in turbid water', 'Does not remove sediment or chemicals'],
    steps: [
      'Pre-filter turbid water through cloth or coffee filter.',
      'Insert UV lamp into water container.',
      'Stir gently for 60–90 seconds until device signals complete.',
      'Drink immediately — UV does not provide residual protection.',
    ],
    note: 'Always carry spare batteries. Turbid water blocks UV — filter first.',
  },
  {
    name: 'SODIS (Solar Disinfection)',
    icon: '🌞',
    effectiveness: 'Kills bacteria and viruses with UV; requires sunlight and clear plastic',
    kills: 'Most bacteria, viruses',
    pros: ['Zero cost', 'No equipment beyond clear bottle', 'Effective against E. coli and typhoid'],
    cons: ['Requires 6+ hours of direct sun (or 2 days cloudy)', 'Only works in clear PET plastic bottles', 'Does not remove Cryptosporidium reliably'],
    steps: [
      'Use clear 2-liter PET plastic bottle (labeled with ♻ 1 or ♻ 7).',
      'Fill with water less than 3cm turbidity (can read newsprint through it).',
      'Lay bottle on reflective surface (metal sheet, foil) in direct sun.',
      'Expose 6 hours minimum in full sun; 2 full days if partly cloudy.',
      'Do not remove cap until ready to drink.',
    ],
  },
  {
    name: 'Improvised Gravity Filter',
    icon: '🪨',
    effectiveness: 'Reduces turbidity and some pathogens — NOT a standalone purifier',
    kills: 'Reduces sediment, some bacteria with activated charcoal',
    pros: ['No commercial equipment needed', 'Buys time until proper treatment'],
    cons: ['Does not remove viruses or all bacteria', 'Must follow with boiling or chemical treatment'],
    steps: [
      'Cut bottom off a plastic bottle (or use a sock/canvas bag).',
      'Layer from bottom to top: coarse cloth → small gravel → coarse sand → fine sand → crushed activated charcoal (from hardwood campfire) → cloth.',
      'Pour turbid water in slowly; let gravity draw it through.',
      'Collect output and purify further by boiling or tablets.',
    ],
    note: 'This is a pre-filter, NOT a standalone treatment. Always follow with heat or chemical treatment.',
  },
];

const FINDING_SECTIONS = [
  {
    title: 'Moving Water',
    content: 'Streams, rivers, and springs are your best natural sources. Moving water is typically cleaner than standing water but must still be purified. Travel uphill from your position — water flows downhill from higher elevations. Look for vegetation lines (willows, cattails, cottonwoods) which indicate subsurface water.',
  },
  {
    title: 'Rainwater Collection',
    content: 'Rain is the cleanest naturally available water. Collect it before it touches the ground using tarps, ponchos, or leaves. Funnel into containers. If collected off roofs or non-porous surfaces, it is safe without purification. If channeled through soil, treat it.',
  },
  {
    title: 'Dew Collection',
    content: 'Before sunrise, tie absorbent cloth around your ankles and walk through vegetation. Wring cloth into a container. Can yield 1–2 cups per hour. Also wipe large leaves with cloth. Dew is safe to drink without treatment if collected before touching soil.',
  },
  {
    title: 'Ground Seep / Digging',
    content: 'In dry riverbeds, dig 1–2 feet in the outer curve of a bend — water collects there first. Dig until wet sand is reached, then wait for water to seep in. Allow sediment to settle or filter before purifying. Avoid digging near animal trails or downhill of potential contamination.',
  },
  {
    title: 'Avoid These Sources',
    content: '• Stagnant water with surface sheen (petroleum contamination)\n• Water near industrial or agricultural areas (chemical runoff)\n• Water with dead animals in or upstream\n• Water with bright orange/green biological growth (toxic algae)\n• Urban floodwater (contains sewage, fuel, chemicals)',
  },
];

const STORAGE_TIPS = [
  { title: '1 gallon per person per day minimum', detail: 'FEMA and Red Cross standard. Actual need is higher in heat, with physical activity, or for nursing mothers. Plan for 1.5–2 gallons for margin.' },
  { title: '72-hour minimum, 2-week goal', detail: 'Start with a 72-hour supply (3 gallons/person). Work toward a 2-week supply (14 gallons/person). Rotate every 6–12 months.' },
  { title: 'Use food-grade containers only', detail: 'HDPE plastic (#2 or #7 ♻ symbol) or stainless steel. Avoid glass (breaks) and non-food-grade plastics that can leach chemicals. Never store in containers that held non-food items.' },
  { title: 'Dark, cool, stable location', detail: 'UV light degrades plastic and promotes algae growth. Store away from gasoline, paint, or cleaning chemicals — plastic is permeable to vapors. Ideal temp 50–70°F (10–21°C).' },
  { title: 'Treat before storage if using tap water', detail: 'Commercially bottled water: use by printed date. Tap water in clean containers: add 8 drops of unscented household bleach (6% sodium hypochlorite) per gallon. Seal and label with fill date.' },
  { title: 'Label and rotate (FIFO)', detail: 'First In, First Out. Label every container with fill date. Use oldest containers first, refill and re-date.' },
];

export function WaterScreen() {
  const [section, setSection] = useState<Section>('methods');
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (name: string) => setExpanded(expanded === name ? null : name);

  return (
    <SafeAreaView style={s.safe}>
      {/* Section tabs */}
      <View style={s.tabRow}>
        {(['methods', 'finding', 'storage'] as Section[]).map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[s.tabBtn, section === sec && s.tabBtnActive]}
            onPress={() => setSection(sec)}
          >
            <Text style={[s.tabLabel, section === sec && s.tabLabelActive]}>
              {sec === 'methods' ? '🧪 Purify' : sec === 'finding' ? '🔍 Find' : '🪣 Store'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {section === 'methods' && (
          <>
            <View style={s.alertBox}>
              <Text style={s.alertText}>💧 Minimum: 1 gallon (3.8 L) per person per day. Dehydration impairs judgment within hours — water is always priority #1.</Text>
            </View>
            {METHODS.map((m) => (
              <TouchableOpacity key={m.name} style={s.card} onPress={() => toggle(m.name)} activeOpacity={0.8}>
                <View style={s.cardHeader}>
                  <Text style={s.cardIcon}>{m.icon}</Text>
                  <View style={s.cardHeaderText}>
                    <Text style={s.cardTitle}>{m.name}</Text>
                    <Text style={s.cardEffective}>{m.effectiveness}</Text>
                  </View>
                  <Text style={s.chevron}>{expanded === m.name ? '▲' : '▼'}</Text>
                </View>
                {expanded === m.name && (
                  <View style={s.cardBody}>
                    <Text style={s.sectionLabel}>Eliminates</Text>
                    <Text style={s.bodyText}>{m.kills}</Text>
                    <Text style={s.sectionLabel}>Pros</Text>
                    {m.pros.map((p, i) => <Text key={i} style={s.bullet}>✓ {p}</Text>)}
                    <Text style={s.sectionLabel}>Cons</Text>
                    {m.cons.map((c, i) => <Text key={i} style={s.bulletCon}>✗ {c}</Text>)}
                    <Text style={s.sectionLabel}>How-To</Text>
                    {m.steps.map((st, i) => <Text key={i} style={s.step}>{i + 1}. {st}</Text>)}
                    {m.note && (
                      <View style={s.noteBox}>
                        <Text style={s.noteText}>⚠️ {m.note}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {section === 'finding' && (
          <>
            <Text style={s.intro}>Locating water is a core survival skill. Prioritize moving water and rain collection. All natural sources require purification.</Text>
            {FINDING_SECTIONS.map((f) => (
              <View key={f.title} style={s.card}>
                <Text style={s.cardTitle}>{f.title}</Text>
                <Text style={s.bodyText}>{f.content}</Text>
              </View>
            ))}
          </>
        )}

        {section === 'storage' && (
          <>
            <Text style={s.intro}>Stored water is your first line of defense before any emergency happens.</Text>
            {STORAGE_TIPS.map((t) => (
              <View key={t.title} style={s.storageCard}>
                <Text style={s.storageTitle}>{t.title}</Text>
                <Text style={s.bodyText}>{t.detail}</Text>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8 },
  tabBtn: {
    flex: 1, padding: 8, borderRadius: 8,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  content: { padding: 12, paddingBottom: 40, gap: 10 },
  alertBox: {
    backgroundColor: Colors.infoBg, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: Colors.info,
  },
  alertText: { color: Colors.info, fontSize: 13 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 24 },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  cardEffective: { color: Colors.primary, fontSize: 12, marginTop: 2 },
  chevron: { color: Colors.textMuted, fontSize: 14 },
  cardBody: { marginTop: 12, gap: 4 },
  sectionLabel: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  bodyText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  bullet: { color: Colors.success, fontSize: 13, lineHeight: 18 },
  bulletCon: { color: Colors.danger, fontSize: 13, lineHeight: 18 },
  step: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20, marginLeft: 4 },
  noteBox: {
    backgroundColor: Colors.warningBg, borderRadius: 6, padding: 8,
    borderWidth: 1, borderColor: Colors.warning, marginTop: 8,
  },
  noteText: { color: Colors.warning, fontSize: 12 },
  intro: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  storageCard: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6,
  },
  storageTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
});
