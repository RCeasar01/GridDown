import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Clipboard,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { HomeStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface MicroCard {
  title: string;
  doThisFirst: string[];
  ifThen: string;
  guideId: string;
}

interface Section {
  key: string;
  label: string;
  cards: MicroCard[];
}

// ─── Content ──────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    key: 'medical',
    label: '🩺 MEDICAL',
    cards: [
      {
        title: 'SEVERE BLEEDING',
        doThisFirst: [
          '1. CALL 911 FIRST IF POSSIBLE',
          '2. Apply tourniquet 2-3 inches above wound, twist until bleeding stops',
          '3. Note time applied on skin with marker',
        ],
        ifThen: 'IF wound is to torso/neck → THEN pack wound tightly with cloth and maintain pressure',
        guideId: 'medical-002',
      },
      {
        title: 'AIRWAY / BREATHING',
        doThisFirst: [
          '1. CALL 911 FIRST IF POSSIBLE',
          '2. Tilt head back, lift chin — look/listen/feel for breath',
          '3. If not breathing and trained: begin CPR at 30:2 ratio',
        ],
        ifThen: 'IF victim is breathing but unconscious → THEN recovery position (on side, head tilted back)',
        guideId: 'medical-001',
      },
      {
        title: 'SHOCK',
        doThisFirst: [
          '1. CALL 911 FIRST IF POSSIBLE',
          '2. Lay flat, elevate legs 12 inches (unless head/spine injury)',
          '3. Keep warm, do NOT give food/water',
        ],
        ifThen: 'IF skin is pale/cold/clammy AND pulse rapid → THEN treat as hemorrhagic shock — control bleeding immediately',
        guideId: 'medical-004',
      },
      {
        title: 'TRIAGE — MULTIPLE VICTIMS',
        doThisFirst: [
          '1. CALL 911 FIRST IF POSSIBLE',
          '2. Don\'t move anyone yet — scan for immediate threats',
          '3. Tag: BLACK (dead/unsurvivable), RED (immediate), YELLOW (delayed), GREEN (minor)',
        ],
        ifThen: 'IF victim is breathing AND can follow commands → THEN GREEN — move them out and continue triage',
        guideId: 'medical-001',
      },
    ],
  },
  {
    key: 'survival',
    label: '🛖 SURVIVAL',
    cards: [
      {
        title: 'WATER PROCUREMENT',
        doThisFirst: [
          '1. Find water within 24 hours (not 72 — hydration is critical)',
          '2. Collect rain water in any clean container',
          '3. Filter with cloth then boil 1 minute (3 min at altitude)',
        ],
        ifThen: 'IF no fire available → THEN use 8 drops plain bleach per gallon, wait 30 minutes',
        guideId: 'water-001',
      },
      {
        title: 'EMERGENCY SHELTER',
        doThisFirst: [
          '1. Get out of wind and precipitation immediately',
          '2. Insulate from ground first — ground steals heat 20x faster than air',
          '3. Build smallest shelter that fits your body — retains heat better',
        ],
        ifThen: 'IF temperature dropping AND wet → THEN hypothermia risk is extreme — prioritize dry insulation',
        guideId: 'shelter-001',
      },
      {
        title: 'FIRE STARTING',
        doThisFirst: [
          '1. Collect tinder (dry grass, bark shavings) before attempting ignition',
          '2. Shield from wind with your body or debris',
          '3. Ignite tinder bundle first, then build up with finger-sized then wrist-sized fuel',
        ],
        ifThen: 'IF lighter/matches fail → THEN use ferro rod or bow drill — practice these before you need them',
        guideId: 'fire-001',
      },
      {
        title: 'NAVIGATE TO SAFETY',
        doThisFirst: [
          '1. Identify your cardinal directions — sun rises East, sets West',
          '2. Follow water downstream to civilization',
          '3. Stay on ridgelines for visibility and signal range',
        ],
        ifThen: 'IF completely disoriented → THEN STOP: Stop, Think, Observe, Plan before moving',
        guideId: 'navigation-001',
      },
    ],
  },
  {
    key: 'comms',
    label: '📡 COMMS & SIGNAL',
    cards: [
      {
        title: 'SOS SIGNAL',
        doThisFirst: [
          '1. Three of anything = universal distress: 3 fires, 3 whistle blasts, 3 shots',
          '2. In open terrain: lay out HELP or SOS in rocks/logs at least 10ft tall for aerial view',
          '3. Signal mirror toward aircraft: reflect sun at target, flash 6 times, pause, repeat',
        ],
        ifThen: 'IF in wilderness → THEN SOS in Morse: 3 short, 3 long, 3 short — works on any light or sound',
        guideId: 'comms-003',
      },
      {
        title: 'RADIO / HAM',
        doThisFirst: [
          '1. NOAA Weather Radio: 162.400–162.550 MHz for emergency broadcasts',
          '2. HAM 2m calling frequency: 146.520 MHz — always monitored',
          '3. CB Channel 9 is the emergency channel',
        ],
        ifThen: 'IF you have a HAM radio → THEN 146.520 is the national simplex calling frequency — key up and say your location',
        guideId: 'comms-001',
      },
      {
        title: 'WHISTLE CODES',
        doThisFirst: [
          '1. 3 blasts = I need help',
          '2. 2 blasts = come to me / acknowledged',
          '3. 1 blast = where are you?',
        ],
        ifThen: 'IF no whistle → THEN bang metal on metal: 3 sets of 3 strikes = universal SOS',
        guideId: 'comms-003',
      },
    ],
  },
  {
    key: 'disaster',
    label: '🌀 DISASTER',
    cards: [
      {
        title: 'HURRICANE',
        doThisFirst: [
          '1. Evacuate if ordered — storm surge kills more than wind',
          '2. If sheltering: interior room, lowest floor, away from windows',
          '3. Water supply: fill tubs and all containers before storm',
        ],
        ifThen: 'IF storm surge warning → THEN leave immediately — 20ft walls of water move faster than you can react',
        guideId: 'disaster-001',
      },
      {
        title: 'TORNADO',
        doThisFirst: [
          '1. Go to basement or interior room on lowest floor NOW',
          '2. Bathtub with mattress over you if no basement',
          '3. Stay until warning expires — 2nd tornadoes hit the same area',
        ],
        ifThen: 'IF outside with no shelter → THEN lay flat in lowest ground (ditch), hands over head, away from cars and trees',
        guideId: 'disaster-002',
      },
      {
        title: 'FLOOD',
        doThisFirst: [
          '1. Never walk/drive through flood water — 6 inches sweeps adults off feet, 2ft floats cars',
          '2. Move to highest ground immediately',
          '3. If trapped in rising water: move to roof, signal for help',
        ],
        ifThen: 'IF water is rising faster than you can reach high ground → THEN go to roof — do NOT go to attic without roof access',
        guideId: 'disaster-003',
      },
      {
        title: 'NUCLEAR / EMP EVENT',
        doThisFirst: [
          '1. Immediately get inside a solid building — brick/concrete preferred',
          '2. Turn off HVAC, seal doors/windows with tape or wet towels',
          '3. Shelter in place for minimum 24 hours — radiation falls off sharply with time',
        ],
        ifThen: 'IF you were outside at time of event → THEN remove and bag outer clothes (removes 80% of contamination), shower immediately',
        guideId: 'disaster-004',
      },
      {
        title: 'CIVIL UNREST',
        doThisFirst: [
          '1. Stay home — looters target people who are out',
          '2. Lock doors, darken windows, reduce visible activity',
          '3. Have exit plan: when to leave and where to go',
        ],
        ifThen: 'IF threat is immediate/active → THEN shelter in place in interior room, away from windows and doors',
        guideId: 'security-001',
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MicroCardProps {
  card: MicroCard;
  onViewGuide: (guideId: string) => void;
}

function MicroCardView({ card, onViewGuide }: MicroCardProps) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.cardHeader}>{card.title}</Text>
      <Text style={cardStyles.doLabel}>DO THIS FIRST:</Text>
      {card.doThisFirst.map((step, i) => (
        <Text key={i} style={cardStyles.step}>{step}</Text>
      ))}
      <View style={cardStyles.ifThenBox}>
        <Text style={cardStyles.ifThenText}>{card.ifThen}</Text>
      </View>
      <TouchableOpacity
        style={cardStyles.viewGuideBtn}
        onPress={() => onViewGuide(card.guideId)}
        accessibilityLabel={`View full guide for ${card.title}`}
        accessibilityRole="button"
      >
        <Text style={cardStyles.viewGuideBtnText}>View Full Guide →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Location Section ─────────────────────────────────────────────────────────

interface LocationSectionProps {
  expanded: boolean;
  onToggle: () => void;
}

function LocationSection({ expanded, onToggle }: LocationSectionProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLocationError(true); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (active) {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        if (active) setLocationError(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const coordText = coords
    ? `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`
    : locationError ? 'LOCATION UNAVAILABLE' : 'ACQUIRING GPS...';

  const handleCopy = () => {
    if (coords) {
      Clipboard.setString(coordText);
    }
  };

  return (
    <View style={sectionStyles.wrapper}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel="My Location section"
      >
        <Text style={sectionStyles.headerText}>📍 MY LOCATION</Text>
        <Text style={sectionStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={sectionStyles.body}>
          <Text style={locStyles.coordsLabel}>COORDINATES</Text>
          <Text style={locStyles.coords} selectable>{coordText}</Text>

          {coords && (
            <TouchableOpacity
              style={locStyles.copyBtn}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel="Copy coordinates"
            >
              <Text style={locStyles.copyBtnText}>COPY COORDINATES</Text>
            </TouchableOpacity>
          )}

          <View style={locStyles.flashRow}>
            <Text style={locStyles.flashLabel}>FLASHLIGHT</Text>
            <TouchableOpacity
              style={[locStyles.flashToggle, flashlightOn && locStyles.flashToggleOn]}
              onPress={() => setFlashlightOn((v) => !v)}
              accessibilityRole="switch"
              accessibilityLabel={flashlightOn ? 'Flashlight on' : 'Flashlight off'}
            >
              <Text style={locStyles.flashToggleText}>
                {flashlightOn ? '🔦 ON' : '🔦 OFF'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={locStyles.flashNote}>
            * Full flashlight control requires camera permission in device settings
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function EmergencyModeScreen() {
  const navigation = useNavigation<Nav>();
  const [expandedSection, setExpandedSection] = useState<string | null>('medical');

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const handleViewGuide = (guideId: string) => {
    navigation.navigate('Guide', { guideId });
  };

  const handleExit = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={screenStyles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Top bar */}
      <View style={screenStyles.topBar}>
        <Text style={screenStyles.topBarTitle}>⚠ EMERGENCY MODE</Text>
        <Text style={screenStyles.topBarSub}>SELECT A CATEGORY BELOW</Text>
      </View>

      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Sections */}
        {SECTIONS.map((section) => (
          <View key={section.key} style={sectionStyles.wrapper}>
            <TouchableOpacity
              style={sectionStyles.header}
              onPress={() => toggleSection(section.key)}
              accessibilityRole="button"
              accessibilityLabel={`${section.label} section`}
            >
              <Text style={sectionStyles.headerText}>{section.label}</Text>
              <Text style={sectionStyles.chevron}>
                {expandedSection === section.key ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expandedSection === section.key && (
              <View style={sectionStyles.body}>
                {section.cards.map((card, idx) => (
                  <MicroCardView
                    key={idx}
                    card={card}
                    onViewGuide={handleViewGuide}
                  />
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Location Section */}
        <LocationSection
          expanded={expandedSection === 'location'}
          onToggle={() => toggleSection('location')}
        />

        {/* Bottom spacing so content clears the exit button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Persistent EXIT button */}
      <View style={screenStyles.exitContainer}>
        <TouchableOpacity
          style={screenStyles.exitBtn}
          onPress={handleExit}
          accessibilityRole="button"
          accessibilityLabel="Exit emergency mode"
        >
          <Text style={screenStyles.exitBtnText}>EXIT EMERGENCY MODE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = '#E8642A';
const EXIT_GREEN = '#4A7C59';
const BG = '#0A0A0A';
const SURFACE = '#151515';
const BORDER = '#2A2A2A';
const TEXT = '#F0F0F0';
const TEXT_DIM = '#AAAAAA';

const screenStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  topBarSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    letterSpacing: 2,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  exitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG,
    borderTopWidth: 2,
    borderTopColor: EXIT_GREEN,
    padding: 12,
  },
  exitBtn: {
    backgroundColor: EXIT_GREEN,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

const sectionStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 64,
  },
  headerText: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chevron: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    backgroundColor: BG,
    padding: 12,
    gap: 12,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  doLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  step: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 30,
    paddingLeft: 4,
  },
  ifThenBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
    padding: 12,
    marginTop: 4,
  },
  ifThenText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  viewGuideBtn: {
    backgroundColor: ACCENT,
    borderRadius: 6,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  viewGuideBtnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

const locStyles = StyleSheet.create({
  coordsLabel: {
    color: TEXT_DIM,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  coords: {
    color: TEXT,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  copyBtn: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 6,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  copyBtnText: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  flashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  flashLabel: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  flashToggle: {
    backgroundColor: '#2A2A2A',
    borderRadius: 6,
    height: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  flashToggleOn: {
    backgroundColor: '#3A3A00',
    borderColor: '#FFD700',
  },
  flashToggleText: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '800',
  },
  flashNote: {
    color: TEXT_DIM,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
