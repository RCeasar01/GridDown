import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { convertFromInput, type AllFormats, type CoordFormat } from '../utils/coords';

let ClipboardAPI: { setString: (s: string) => void } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expo = require('expo-clipboard');
  ClipboardAPI = { setString: (s: string) => expo.setStringAsync(s) };
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rn = require('react-native');
    ClipboardAPI = rn.Clipboard ?? null;
  } catch {
    ClipboardAPI = null;
  }
}

function copyToClipboard(text: string) {
  if (ClipboardAPI) {
    ClipboardAPI.setString(text);
  } else {
    Alert.alert('Copy', text);
  }
}

// ── UI ────────────────────────────────────────────────────────────────────────

const FORMAT_LABELS: CoordFormat[] = ['DD', 'DMS', 'UTM', 'MGRS'];

const FORMAT_PLACEHOLDERS: Record<CoordFormat, string> = {
  DD:   '35.7796° N, 78.6382° W',
  DMS:  '35°46\'46.56"N 78°38\'17.52"W',
  UTM:  '17S 713913 3960547',
  MGRS: '17SQA 13913 60547',
};

export const CoordinateConverterScreen: React.FC = () => {
  const [inputFormat, setInputFormat] = useState<CoordFormat>('DD');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AllFormats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    if (!inputText.trim()) { setError('Enter coordinates above.'); return; }
    const out = convertFromInput(inputText.trim(), inputFormat);
    if (typeof out === 'string') { setError(out); setResult(null); }
    else { setResult(out); setError(null); }
  };

  const CopyRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.resultRow}>
      <View style={styles.resultRowLeft}>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
      <TouchableOpacity
        style={styles.copyBtn}
        onPress={() => { copyToClipboard(value); }}
      >
        <Text style={styles.copyBtnText}>COPY</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.screenTitle}>COORDINATE CONVERTER</Text>
      <Text style={styles.sectionLabel}>Input Format</Text>
      <View style={styles.formatRow}>
        {FORMAT_LABELS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.fmtBtn, inputFormat === f && styles.fmtBtnActive]}
            onPress={() => { setInputFormat(f); setInputText(''); setResult(null); setError(null); }}
          >
            <Text style={[styles.fmtBtnText, inputFormat === f && styles.fmtBtnTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.largeInput}
        value={inputText}
        onChangeText={setInputText}
        placeholder={FORMAT_PLACEHOLDERS[inputFormat]}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="characters"
        autoCorrect={false}
        multiline
      />
      <TouchableOpacity style={styles.convertBtn} onPress={convert}>
        <Text style={styles.convertBtnText}>CONVERT</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>All Formats</Text>
          <CopyRow label="Decimal Degrees" value={result.dd} />
          <CopyRow label="Deg Min Sec" value={result.dms} />
          <CopyRow label="UTM" value={result.utm} />
          <CopyRow label="MGRS" value={result.mgrs} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  screenTitle: {
    fontSize: 18, fontWeight: '800', color: Colors.primary,
    letterSpacing: 2, marginBottom: 20,
  },
  sectionLabel: { fontSize: 11, color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  formatRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  fmtBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  fmtBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  fmtBtnText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  fmtBtnTextActive: { color: Colors.primary },
  largeInput: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 8, padding: 14, color: Colors.textPrimary, fontSize: 15,
    minHeight: 72, textAlignVertical: 'top', marginBottom: 12,
  },
  convertBtn: {
    backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginBottom: 16,
  },
  convertBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
  errorText: { color: Colors.danger, fontSize: 13, marginBottom: 12 },
  resultCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, padding: 16, marginTop: 4,
  },
  resultTitle: { color: Colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  resultRowLeft: { flex: 1 },
  resultLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 2 },
  resultValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  copyBtn: {
    backgroundColor: Colors.primaryDim, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5,
  },
  copyBtnText: { color: Colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});

export default CoordinateConverterScreen;
