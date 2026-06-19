import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
  'SOS': '...---...',
};

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

const DOT_MS = 80;
const DASH_MS = 240;
const SYMBOL_GAP = 80;
const LETTER_GAP = 240;
const WORD_GAP = 560;

function encodeText(text: string): string {
  if (!text.trim()) return '';
  const words = text.toUpperCase().split(' ');
  return words
    .map(word =>
      word
        .split('')
        .map(char => MORSE_CODE[char] || '')
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .join(' / ');
}

function decodeMorse(morse: string): string {
  if (!morse.trim()) return '';
  const words = morse.split(' / ');
  return words
    .map(word =>
      word
        .split(' ')
        .map(symbol => REVERSE_MORSE[symbol] || '?')
        .join('')
    )
    .join(' ');
}

export function MorseCodeScreen() {
  const [activeTab, setActiveTab] = useState<'ENCODE' | 'DECODE'>('ENCODE');
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashSymbol, setFlashSymbol] = useState('');
  const [showTable, setShowTable] = useState(false);

  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (activeTab === 'ENCODE') {
      setResultText(encodeText(text));
    } else {
      setResultText(decodeMorse(text));
    }
  };

  const handleTabChange = (tab: 'ENCODE' | 'DECODE') => {
    setActiveTab(tab);
    setInputText('');
    setResultText('');
    stopPlayback();
  };

  const stopPlayback = useCallback(() => {
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
    setIsPlaying(false);
    setIsFlashing(false);
    setFlashSymbol('');
  }, []);

  const playMorse = useCallback((morseString: string) => {
    stopPlayback();
    const symbols = morseString.replace(/ \/ /g, ' WORD_GAP ').split(' ');
    let delay = 0;
    setIsPlaying(true);

    symbols.forEach((symbol, index) => {
      if (symbol === 'WORD_GAP') {
        delay += WORD_GAP;
        return;
      }
      const duration = symbol === '.' ? DOT_MS : DASH_MS;

      const onT = setTimeout(() => {
        setIsFlashing(true);
        setFlashSymbol(symbol);
      }, delay);
      timeoutRefs.current.push(onT);

      delay += duration;

      const offT = setTimeout(() => {
        setIsFlashing(false);
        setFlashSymbol('');
      }, delay);
      timeoutRefs.current.push(offT);

      delay += index < symbols.length - 1 ? SYMBOL_GAP : 0;
    });

    const endT = setTimeout(() => {
      setIsPlaying(false);
      setIsFlashing(false);
    }, delay + 100);
    timeoutRefs.current.push(endT);
  }, [stopPlayback]);

  const handleSOS = () => {
    setActiveTab('ENCODE');
    const sos = 'SOS';
    setInputText(sos);
    const morse = MORSE_CODE['SOS'];
    setResultText(morse);
    playMorse(morse);
  };

  const handleMAYDAY = () => {
    setActiveTab('ENCODE');
    const text = 'MAYDAY';
    setInputText(text);
    const morse = encodeText(text);
    setResultText(morse);
  };

  const handleCopy = () => {
    if (!resultText) return;
    Clipboard.setString(resultText);
    Alert.alert('Copied', 'Result copied to clipboard.');
  };

  const handlePlay = () => {
    const morseToPlay = activeTab === 'ENCODE' ? resultText : encodeText(resultText);
    if (!morseToPlay) return;
    playMorse(morseToPlay);
  };

  const ALPHA_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const NUM_KEYS = '0123456789'.split('');
  const TABLE_ENTRIES = [...ALPHA_KEYS, ...NUM_KEYS];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>— MORSE CODE —</Text>
          <Text style={styles.headerSubtitle}>Emergency communication tool</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {(['ENCODE', 'DECODE'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {activeTab === 'ENCODE' ? 'Enter text to encode:' : 'Enter Morse code to decode:'}
          </Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder={activeTab === 'ENCODE' ? 'Type text here...' : '. - / . . . (use spaces)'}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
          />
        </View>

        {/* Result */}
        {resultText ? (
          <View style={styles.resultBox}>
            <Text style={[styles.resultText, activeTab === 'ENCODE' && styles.morseFont]}>
              {resultText}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={18} color={Colors.textPrimary} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Playback Bar */}
        <View style={styles.playbackBar}>
          <TouchableOpacity
            style={[styles.playBtn, !resultText && styles.btnDisabled]}
            onPress={handlePlay}
            disabled={!resultText || isPlaying}
          >
            <Ionicons name="play" size={22} color={Colors.textPrimary} />
            <Text style={styles.playBtnText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopBtn} onPress={stopPlayback} disabled={!isPlaying}>
            <Ionicons name="stop" size={22} color={Colors.textPrimary} />
            <Text style={styles.playBtnText}>Stop</Text>
          </TouchableOpacity>
          <View style={[styles.flashDot, isFlashing && styles.flashDotActive]}>
            <Text style={styles.flashSymbol}>{flashSymbol}</Text>
          </View>
        </View>

        {/* SOS Shortcut */}
        <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
          <Text style={styles.sosBtnText}>⚠ SOS — Tap to encode &amp; flash</Text>
        </TouchableOpacity>

        {/* Common Emergency Codes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>⚡ COMMON EMERGENCY CODES</Text>
          <View style={styles.emergencyRow}>
            <TouchableOpacity style={styles.emergencyBtn} onPress={handleSOS}>
              <Text style={styles.emergencyBtnLabel}>SOS</Text>
              <Text style={styles.emergencyBtnMorse}>...---...</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emergencyBtn} onPress={handleMAYDAY}>
              <Text style={styles.emergencyBtnLabel}>MAYDAY</Text>
              <Text style={styles.emergencyBtnMorse}>-- .- -.-- -.. .- -.--</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Morse Reference Table */}
        <TouchableOpacity style={styles.tableToggle} onPress={() => setShowTable(v => !v)}>
          <Ionicons name={showTable ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          <Text style={styles.tableToggleText}>MORSE REFERENCE TABLE</Text>
        </TouchableOpacity>

        {showTable && (
          <View style={styles.tableGrid}>
            {TABLE_ENTRIES.map(char => (
              <View key={char} style={styles.tableCell}>
                <Text style={styles.tableCellChar}>{char}</Text>
                <Text style={styles.tableCellMorse}>{MORSE_CODE[char]}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 3, textAlign: 'center' },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1 },
  tabTextActive: { color: '#fff' },
  section: { marginBottom: 20 },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: Colors.primary, letterSpacing: 2, marginBottom: 10 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    color: Colors.textPrimary,
    fontSize: 16,
    padding: 14,
    minHeight: 70,
  },
  resultBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  resultText: { fontSize: 28, color: Colors.textPrimary, lineHeight: 38 },
  morseFont: { fontFamily: 'monospace', letterSpacing: 3, fontSize: 26 },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  copyBtnText: { color: Colors.textPrimary, fontSize: 13, marginLeft: 6 },
  playbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  btnDisabled: { opacity: 0.4 },
  playBtnText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 14 },
  flashDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  flashDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  flashSymbol: { color: Colors.textPrimary, fontSize: 20, fontWeight: '900' },

  sosBtn: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: Colors.primaryDim,
  },
  sosBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  emergencyRow: { flexDirection: 'row', gap: 10 },
  emergencyBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  emergencyBtnLabel: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 4 },
  emergencyBtnMorse: { color: Colors.textSecondary, fontSize: 13, fontFamily: 'monospace', letterSpacing: 2 },
  tableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
    marginBottom: 10,
  },
  tableToggleText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tableCell: {
    width: '22%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  tableCellChar: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  tableCellMorse: { color: Colors.textSecondary, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
});