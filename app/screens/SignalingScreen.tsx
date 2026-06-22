import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StyleSheet, Animated, Easing,
} from 'react-native';
import { Colors } from '../theme/colors';

// ─── Morse code table ─────────────────────────────────────────────────────────

const MORSE: Record<string, string> = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.',
  H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.',
  O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-',
  V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..',
  '0':'-----', '1':'.----', '2':'..---', '3':'...--', '4':'....-',
  '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.',
};

function textToMorse(text: string): string {
  return text.toUpperCase().split('').map((c) => {
    if (c === ' ') return '/';
    return MORSE[c] ?? '?';
  }).join(' ');
}

// Returns array of symbols for flash sequence
// Each symbol: { on: boolean, durationMs: number }
interface FlashSymbol { on: boolean; durationMs: number; }

const DOT = 60;      // 60ms per unit
const DASH = DOT * 3;
const INTRA = DOT;   // gap between dots/dashes within a character
const INTER = DOT * 3; // gap between characters
const WORD = DOT * 7;  // gap between words

function buildFlash(text: string): FlashSymbol[] {
  const result: FlashSymbol[] = [];
  const words = text.toUpperCase().split(' ');
  words.forEach((word, wi) => {
    word.split('').forEach((ch, ci) => {
      const code = MORSE[ch];
      if (!code) return;
      code.split('').forEach((sym, si) => {
        result.push({ on: true, durationMs: sym === '.' ? DOT : DASH });
        if (si < code.length - 1) result.push({ on: false, durationMs: INTRA });
      });
      if (ci < word.length - 1) result.push({ on: false, durationMs: INTER });
    });
    if (wi < words.length - 1) result.push({ on: false, durationMs: WORD });
  });
  return result;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

type SigTab = 'Visual' | 'GroundAir' | 'Morse' | 'Whistle' | 'Urban';

const TABS: SigTab[] = ['Visual', 'GroundAir', 'Morse', 'Whistle', 'Urban'];

const VISUAL_SECTIONS = [
  {
    title: 'VS-17 Signal Panel',
    content: `The VS-17 is a bright orange/pink nylon panel (18" × 36") visible from aircraft at 5+ miles under good conditions.

Placement rules:
• Lay flat in a clearing — never fold or bunch.
• Orient longest edge perpendicular to the aircraft's flight path.
• Place on contrasting background (dark soil, snow, vegetation).
• Use multiple panels in an "X" pattern for maximum visibility.
• Move the panel — movement catches a pilot's eye.

Colors: Orange side is used in most scenarios. Opposite (pink/magenta) may be used to signal specific messages per SERE codes.`,
  },
  {
    title: 'Signal Mirror Technique',
    content: `A signal mirror can be seen up to 10 miles away on a clear day.

Aim technique (with sighting hole):
1. Extend one arm at arm's length.
2. Form a V with two fingers — place the target aircraft/sun in that V.
3. Tilt the mirror so the reflected light spot falls on your finger V.
4. The beam is aimed at the target. Flash slowly (don't spin rapidly).

Without sighting hole:
1. Hold mirror face-out at eye level.
2. Reflect sun onto your other palm to find the reflection.
3. While watching your palm, adjust until the sun spot disappears — now the mirror is aimed at the sun.
4. Tilt slowly toward target.

Flash at regular intervals — three flashes (SOS pattern) is universal distress.
Always signal even if you don't see an aircraft — rescuers may not be visible.`,
  },
];

interface GroundAirSymbol {
  code: string;
  symbol: string;
  meaning: string;
  howTo: string;
}

const GROUND_AIR: GroundAirSymbol[] = [
  { code: 'V', symbol: 'V', meaning: 'Require assistance — I need help', howTo: 'Two lines diverging at ~60° angle. Minimum 10 ft long each. Use rocks, logs, or trampled vegetation.' },
  { code: 'X', symbol: 'X', meaning: 'Require medical assistance — need doctor', howTo: 'Two lines crossing at 90°. Each arm at least 10 ft long. Medical emergency only.' },
  { code: '→', symbol: '→ (arrow)', meaning: 'Traveling in this direction', howTo: 'Long straight line with an arrowhead. Point in direction of travel. Minimum 20 ft long.' },
  { code: '△', symbol: '△ (triangle)', meaning: 'Safe to land here / all well', howTo: 'Equilateral triangle. Pilot interprets as "area is clear and secure." Each side 10+ ft.' },
  { code: 'F', symbol: 'F', meaning: 'Need food and water', howTo: 'Letter F. Combine with V for full emergency.' },
  { code: 'LL', symbol: 'LL', meaning: 'All is well / no assistance required', howTo: 'Two parallel lines. Signals to aircraft that survivor is OK.' },
  { code: 'N', symbol: 'N', meaning: 'Negative / no', howTo: 'Letter N. Response signal to aircraft.' },
  { code: 'Y', symbol: 'Y', meaning: 'Yes / affirmative', howTo: 'Letter Y. Response signal to aircraft.' },
];

const WHISTLE_SIGNALS = [
  { signal: '3 blasts', meaning: 'Universal distress signal — I need help', detail: 'Standard: 3 short blasts, pause, repeat. Used globally. Response: 2 blasts = "help coming."' },
  { signal: '1 blast',  meaning: 'Attention / I am here',                  detail: 'Navigation/recall. Used by group leaders to get attention or call scattered members back.' },
  { signal: '2 blasts', meaning: 'Response / acknowledgment',              detail: '"Heard you / on my way." Use to respond to a distress signal or recall blast.' },
  { signal: 'Continuous', meaning: 'Extreme emergency or attract attention', detail: 'Only when other signals are not working. Can cause whistle fatigue — use intermittently.' },
];

const URBAN_SIGNALS = [
  { title: 'Rooftop Signaling', content: 'Large "HELP" or "SOS" on a rooftop visible from helicopters. Use paint, fabric, or debris. Letters should be 8–10 ft tall with high contrast against the roof color. Add an arrow pointing to your position if you are not on the roof.' },
  { title: 'Light Signals at Night', content: 'Flash in groups of three (SOS). A white LED flashlight is visible 3–5 miles at night. Point away from clouds to avoid diffusion. Flash toward sound of aircraft engines.' },
  { title: 'Whistle in Buildings', content: 'Three blasts against a hard wall creates resonance that rescuers can triangulate. USAR (Urban Search and Rescue) uses a "Quiet Time" protocol — when all power stops, listen for survivors and signal.' },
  { title: 'Body Signals (Standing)', content: 'Arms straight up = need help / pick up here. Arms waving in X = do not land here / do not need help. One arm up, one pointing = land this way.' },
  { title: 'Smoke Signals (Daytime)', content: 'White smoke on dark backgrounds, black smoke on light backgrounds. Create white smoke: add green vegetation/rubber to a bright fire. Create black smoke: burn petroleum, rubber, or plastic. Three fires in a triangle = universal distress.' },
];

// ─── Morse flash player ───────────────────────────────────────────────────────

function MorsePlayer() {
  const [inputText, setInputText] = useState('SOS');
  const [playing, setPlaying] = useState(false);
  const [currentSymIdx, setCurrentSymIdx] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = textToMorse(inputText);
  const symbols = buildFlash(inputText);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
    setCurrentSymIdx(-1);
  }, []);

  const play = useCallback(() => {
    if (inputText.trim().length === 0) return;
    stop();
    setPlaying(true);
    let idx = 0;
    const step = () => {
      if (idx >= symbols.length) { setPlaying(false); setCurrentSymIdx(-1); return; }
      setCurrentSymIdx(idx);
      timerRef.current = setTimeout(() => { idx++; step(); }, symbols[idx].durationMs + 10);
    };
    step();
  }, [inputText, symbols, stop]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const isOn = playing && currentSymIdx >= 0 && symbols[currentSymIdx]?.on;

  return (
    <View style={mp.container}>
      <Text style={mp.label}>Enter text to flash in Morse:</Text>
      <TextInput
        style={mp.input}
        value={inputText}
        onChangeText={(t) => { setInputText(t); stop(); }}
        placeholder="SOS"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="characters"
        maxLength={30}
      />
      <Text style={mp.morseText}>{flash}</Text>

      {/* Flash display */}
      <View style={[mp.flashCircle, isOn && mp.flashCircleOn]}>
        <Text style={[mp.flashLabel, isOn && mp.flashLabelOn]}>{isOn ? '●' : '○'}</Text>
      </View>

      {/* Dot-dash visual */}
      <View style={mp.symbolRow}>
        {symbols.map((sym, i) => (
          sym.on ? (
            <View
              key={i}
              style={[
                mp.dot,
                sym.durationMs === DASH && mp.dash,
                currentSymIdx === i && playing && mp.symbolActive,
              ]}
            />
          ) : null
        ))}
      </View>

      <View style={mp.controls}>
        {!playing
          ? <TouchableOpacity style={mp.playBtn} onPress={play}><Text style={mp.playBtnText}>▶ Flash</Text></TouchableOpacity>
          : <TouchableOpacity style={[mp.playBtn, mp.stopBtn]} onPress={stop}><Text style={mp.playBtnText}>■ Stop</Text></TouchableOpacity>
        }
      </View>
      <Text style={mp.hint}>Speed is set to standard CW practice pace (60ms unit). SOS = · · · — — — · · ·</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SignalingScreen() {
  const [tab, setTab] = useState<SigTab>('Visual');
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) => setExpanded(expanded === key ? null : key);

  return (
    <SafeAreaView style={sg.safe}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sg.tabBar} contentContainerStyle={sg.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[sg.tabBtn, tab === t && sg.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[sg.tabLabel, tab === t && sg.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={sg.content} showsVerticalScrollIndicator={false}>

        {tab === 'Visual' && VISUAL_SECTIONS.map((sec) => (
          <View key={sec.title} style={sg.card}>
            <Text style={sg.cardTitle}>{sec.title}</Text>
            <Text style={sg.bodyText}>{sec.content}</Text>
          </View>
        ))}

        {tab === 'GroundAir' && (
          <>
            <View style={sg.infoBanner}>
              <Text style={sg.infoBannerText}>Ground-to-air symbols must be at least 10 feet (3m) wide to be visible from 1,000 ft altitude. Make them as large as possible.</Text>
            </View>
            {GROUND_AIR.map((g) => (
              <TouchableOpacity key={g.code} style={sg.card} onPress={() => toggle(g.code)}>
                <View style={sg.gaHeader}>
                  <View style={sg.gaCodeBox}><Text style={sg.gaCode}>{g.symbol}</Text></View>
                  <View style={sg.gaHeaderText}>
                    <Text style={sg.cardTitle}>{g.meaning}</Text>
                  </View>
                  <Text style={sg.chevron}>{expanded === g.code ? '▲' : '▼'}</Text>
                </View>
                {expanded === g.code && <Text style={[sg.bodyText, { marginTop: 10 }]}>{g.howTo}</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {tab === 'Morse' && (
          <>
            <MorsePlayer />
            <Text style={sg.sectionHead}>Morse Alphabet Reference</Text>
            <View style={sg.morseGrid}>
              {Object.entries(MORSE).map(([ch, code]) => (
                <View key={ch} style={sg.morseCell}>
                  <Text style={sg.morseCh}>{ch}</Text>
                  <Text style={sg.morseCode}>{code}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {tab === 'Whistle' && WHISTLE_SIGNALS.map((w) => (
          <View key={w.signal} style={sg.card}>
            <Text style={sg.whistleSignal}>{w.signal}</Text>
            <Text style={sg.cardTitle}>{w.meaning}</Text>
            <Text style={sg.bodyText}>{w.detail}</Text>
          </View>
        ))}

        {tab === 'Urban' && URBAN_SIGNALS.map((u) => (
          <View key={u.title} style={sg.card}>
            <Text style={sg.cardTitle}>{u.title}</Text>
            <Text style={sg.bodyText}>{u.content}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const sg = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabBar: { maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  tabBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  content: { padding: 12, gap: 10, paddingBottom: 40 },
  infoBanner: { backgroundColor: Colors.warningBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.warning },
  infoBannerText: { color: Colors.warning, fontSize: 12 },
  card: { backgroundColor: Colors.surface, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cardTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  bodyText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  chevron: { color: Colors.textMuted, fontSize: 14 },
  gaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gaCodeBox: { width: 44, height: 44, backgroundColor: Colors.primaryDim, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  gaCode: { color: Colors.primary, fontSize: 18, fontWeight: '900' },
  gaHeaderText: { flex: 1 },
  sectionHead: { color: Colors.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  morseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  morseCell: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: 10, minWidth: 64, alignItems: 'center' },
  morseCh: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  morseCode: { color: Colors.primary, fontSize: 12, marginTop: 2, fontFamily: 'monospace' },
  whistleSignal: { color: Colors.danger, fontSize: 16, fontWeight: '900', marginBottom: 4 },
});

const mp = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: Colors.background, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, color: Colors.textPrimary, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, marginBottom: 8 },
  morseText: { color: Colors.primary, fontFamily: 'monospace', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  flashCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceBorder, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  flashCircleOn: { backgroundColor: Colors.warning },
  flashLabel: { fontSize: 40, color: Colors.textMuted },
  flashLabelOn: { color: Colors.textOnPrimary },
  symbolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12, minHeight: 20 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.textMuted },
  dash: { width: 28, height: 10, borderRadius: 5 },
  symbolActive: { backgroundColor: Colors.warning },
  controls: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  playBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  stopBtn: { backgroundColor: Colors.danger },
  playBtnText: { color: Colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  hint: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
