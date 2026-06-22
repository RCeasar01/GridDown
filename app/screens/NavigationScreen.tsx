import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet,
} from 'react-native';
import { Colors } from '../theme/colors';

type NavTab = 'Sun' | 'Stars' | 'Moon' | 'Compass' | 'Terrain';
const TABS: NavTab[] = ['Sun', 'Stars', 'Moon', 'Compass', 'Terrain'];

const SUN_METHODS = [
  {
    name: 'Cardinal Direction by Sun Position',
    steps: [
      'EAST: Sun rises in the east every day (true east near equinoxes; slightly north in summer, slightly south in winter).',
      'WEST: Sun sets in the west.',
      'SOUTH: At solar noon (sun at its highest point), the sun is due south in the Northern Hemisphere.',
      'NORTH: At solar noon, your shadow points north in the Northern Hemisphere.',
    ],
    note: 'In the Southern Hemisphere, solar noon shadow points south and the sun transits the north sky.',
  },
  {
    name: 'Watch Method (Northern Hemisphere)',
    steps: [
      'Hold the watch flat, face-up.',
      'Point the hour hand at the sun.',
      'The south direction is halfway between the hour hand and the 12 o\'clock mark (the bisecting line).',
      'Example: If it is 4:00 PM, the hour hand points at the sun. Halfway between 4 and 12 is 2 — that direction is south.',
      'Add 1 hour if daylight saving time is in effect.',
    ],
    note: 'For a digital watch: draw a clock face on paper, set it to the current time, then follow the same steps.',
  },
  {
    name: 'Shadow Stick Method',
    steps: [
      'Find flat, bare ground in open sunlight.',
      'Plant a straight stick (18–36 inches) vertically. Mark the tip of the shadow with a rock or stick — this is West.',
      'Wait 10–15 minutes.',
      'Mark the new shadow tip — this is East.',
      'Draw a line between the two marks: this is your East-West line.',
      'Stand with West mark at your left foot and East mark at your right foot — you now face North.',
    ],
    note: 'Works anywhere on Earth. The first shadow tip is always West; the second is always East. Works even on partly cloudy days.',
  },
];

const STAR_METHODS = [
  {
    name: 'Finding Polaris (North Star)',
    content: `Polaris sits within 1° of true north and does not move as the Earth rotates.

Locate Polaris:
1. Find the Big Dipper (Ursa Major) — 7 bright stars in a "pot with a handle" shape.
2. Identify the two stars that form the outer edge of the "pot" (Merak and Dubhe — the "Pointer Stars").
3. Draw an imaginary line from Merak through Dubhe and extend it about 5× the distance between them.
4. The bright star at the end of that line is Polaris.

Verify: Polaris is the last star in the handle of the Little Dipper (Ursa Minor).

Once found: face Polaris directly — you are facing true north. True north in most of North America differs from magnetic north by 10–20°.`,
  },
  {
    name: 'Cassiopeia (When Big Dipper is Low)',
    content: `Cassiopeia is the W-shaped constellation on the opposite side of Polaris from the Big Dipper. When the Big Dipper is near the horizon, Cassiopeia is high in the sky.

1. Find the W shape of 5 bright stars.
2. Polaris is roughly centered between the Big Dipper and Cassiopeia.
3. The center of the W points generally toward Polaris.`,
  },
  {
    name: 'Southern Hemisphere: Southern Cross',
    content: `The Southern Cross (Crux) does not contain a star at the south celestial pole, but you can approximate it:

1. Find Crux — 4 main stars in a cross pattern (the longest axis is a "pointer" toward south).
2. Extend the long axis of the cross 4.5 times its length southward.
3. This approximate point is the south celestial pole — the direction below it is south.`,
  },
];

const MOON_METHODS = [
  {
    name: 'Crescent Moon Method',
    content: `Draw an imaginary line connecting the two tips ("horns") of a crescent moon and extend it to the horizon. The point where it touches the horizon is approximately south in the Northern Hemisphere (north in the Southern Hemisphere).

Accuracy: ±30° — useful as a general directional check, not precise navigation.

Works best: When the moon is between first quarter and last quarter phases.`,
  },
  {
    name: 'Moon Rise/Set',
    content: `• The moon rises roughly in the east and sets roughly in the west.
• A full moon at midnight is approximately due south (Northern Hemisphere).
• A first quarter moon (half lit on right side) is due south at approximately sunset.
• A last quarter moon (half lit on left side) is due south at approximately sunrise.`,
  },
];

const COMPASS_METHODS = [
  {
    name: 'Magnetized Needle Compass',
    steps: [
      'Find a metal sewing needle or safety pin.',
      'Stroke the needle repeatedly in ONE direction (end to end) with a permanent magnet or the same pole of a known magnet. Do this 30–50 times.',
      'Alternatively, stroke on silk or nylon fabric 50+ times (creates weak magnetization via static).',
      'Float the needle on a small piece of bark, leaf, or grass in a still water container (puddle, cup, helmet).',
      'The needle will align north-south. Verify orientation against known sky references.',
    ],
    note: 'Steel needles retain magnetization longer than aluminum. Do not use a metal container — the metal interferes with the field.',
  },
  {
    name: 'Declination Note',
    steps: [
      'A homemade compass points to MAGNETIC north, not true north.',
      'Magnetic declination varies by location — in the eastern US, magnetic north is about 10–15° west of true north.',
      'In the western US, magnetic north may be 10–20° east of true north.',
      'Use star or sun methods to calibrate your improvised compass if precision is needed.',
    ],
  },
];

const TERRAIN_METHODS = [
  {
    name: 'Water Flow',
    content: `Water flows downhill. Following a stream always leads to lower terrain. In the wilderness, drainages flow toward valleys, then rivers, then civilization. If lost, following water downstream is the highest-probability route to finding people.

Caution: Do not follow water through canyons or gorges without checking for cliffs below. Waterfalls can be deadly.`,
  },
  {
    name: 'Ridgelines and Saddles',
    content: `A ridgeline (mountain crest) runs east-west or north-south depending on local geology, but ridges consistently point downslope toward valleys. A saddle (the low point between two peaks) is the easiest crossing point of a ridge.

Tip: If you can see a peak, note its position relative to the sun to orient yourself. Return to a known high ground if you lose your bearings — high ground gives you wider observation.`,
  },
  {
    name: 'Vegetation Clues',
    content: `Northern Hemisphere only:
• Tree growth is typically denser on the north-facing slopes (less sun, more moisture).
• In coniferous forests, trees often have more branches on the south side.
• Snow melts first on south-facing slopes.
• Moss tends to grow on the north side of tree trunks (in dense forests with limited sun) — but this is unreliable as a sole technique.`,
  },
  {
    name: 'Contour Reading Without a Map',
    content: `Natural terrain features:
• HIGH GROUND: peaks, ridges, plateaus — good observation, no water.
• LOW GROUND: valleys, drainages — water present, harder to signal rescuers.
• SADDLE: low point between peaks — travel route.
• DRAW: small valley feeding into a larger one — water likely.
• SPUR: ridge that juts out from a main ridge — can be mistaken for a ridgeline.

Always be aware of your elevation relative to surrounding terrain — helps maintain situational awareness without a map.`,
  },
];

export function NavigationScreen() {
  const [tab, setTab] = useState<NavTab>('Sun');
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (k: string) => setExpanded(expanded === k ? null : k);

  return (
    <SafeAreaView style={n.safe}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={n.tabBar} contentContainerStyle={n.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[n.tabBtn, tab === t && n.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[n.tabLabel, tab === t && n.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={n.content} showsVerticalScrollIndicator={false}>

        <View style={n.disclaimer}>
          <Text style={n.disclaimerText}>⚡ Natural navigation supplements — does not replace — a compass and map. Practice these skills before you need them.</Text>
        </View>

        {tab === 'Sun' && SUN_METHODS.map((m) => (
          <TouchableOpacity key={m.name} style={n.card} onPress={() => toggle(m.name)}>
            <View style={n.cardHeader}>
              <Text style={n.cardTitle}>{m.name}</Text>
              <Text style={n.chevron}>{expanded === m.name ? '▲' : '▼'}</Text>
            </View>
            {expanded === m.name && (
              <View style={n.cardBody}>
                {m.steps.map((s, i) => <Text key={i} style={n.step}>{i + 1}. {s}</Text>)}
                <View style={n.noteBox}><Text style={n.noteText}>ℹ️ {m.note}</Text></View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {tab === 'Stars' && STAR_METHODS.map((m) => (
          <View key={m.name} style={n.card}>
            <Text style={n.cardTitle}>{m.name}</Text>
            <Text style={n.bodyText}>{m.content}</Text>
          </View>
        ))}

        {tab === 'Moon' && MOON_METHODS.map((m) => (
          <View key={m.name} style={n.card}>
            <Text style={n.cardTitle}>{m.name}</Text>
            <Text style={n.bodyText}>{m.content}</Text>
          </View>
        ))}

        {tab === 'Compass' && COMPASS_METHODS.map((m) => (
          <TouchableOpacity key={m.name} style={n.card} onPress={() => toggle(m.name)}>
            <View style={n.cardHeader}>
              <Text style={n.cardTitle}>{m.name}</Text>
              <Text style={n.chevron}>{expanded === m.name ? '▲' : '▼'}</Text>
            </View>
            {expanded === m.name && (
              <View style={n.cardBody}>
                {m.steps.map((s, i) => <Text key={i} style={n.step}>{i + 1}. {s}</Text>)}
                {'note' in m && m.note && <View style={n.noteBox}><Text style={n.noteText}>⚠️ {(m as any).note}</Text></View>}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {tab === 'Terrain' && TERRAIN_METHODS.map((m) => (
          <View key={m.name} style={n.card}>
            <Text style={n.cardTitle}>{m.name}</Text>
            <Text style={n.bodyText}>{m.content}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const n = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabBar: { maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  tabBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  content: { padding: 12, gap: 10, paddingBottom: 40 },
  disclaimer: { backgroundColor: Colors.warningBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.warning },
  disclaimerText: { color: Colors.warning, fontSize: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  cardBody: { marginTop: 10, gap: 6 },
  bodyText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  step: { color: Colors.textPrimary, fontSize: 13, lineHeight: 20 },
  chevron: { color: Colors.textMuted, fontSize: 14 },
  noteBox: { backgroundColor: Colors.infoBg, borderRadius: 6, padding: 8, borderWidth: 1, borderColor: Colors.info, marginTop: 6 },
  noteText: { color: Colors.info, fontSize: 12 },
});
