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

// ── Math helpers ─────────────────────────────────────────────────────────────

const PI = Math.PI;

function toRad(deg: number): number { return deg * PI / 180; }

interface DMS { deg: number; min: number; sec: number; dir: string; }

function ddToDMS(dd: number, isLat: boolean): DMS {
  const abs = Math.abs(dd);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = (minFull - min) * 60;
  const dir = isLat ? (dd >= 0 ? 'N' : 'S') : (dd >= 0 ? 'E' : 'W');
  return { deg, min, sec, dir };
}

function dmsToDD(deg: number, min: number, sec: number, dir: string): number {
  const abs = deg + min / 60 + sec / 3600;
  return (dir === 'S' || dir === 'W') ? -abs : abs;
}

// UTM zone letter
function utmZoneLetter(lat: number): string {
  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  if (lat < -80 || lat > 84) return 'Z';
  const idx = Math.floor((lat + 80) / 8);
  return letters[Math.min(idx, 20)];
}

interface UTMCoord { zone: number; letter: string; easting: number; northing: number; }

function ddToUTM(lat: number, lon: number): UTMCoord {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = 1 - (b / a) * (b / a);
  const k0 = 0.9996;

  const latRad = toRad(lat);
  const zone = Math.floor((lon + 180) / 6) + 1;
  const lon0 = toRad((zone - 1) * 6 - 180 + 3);

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * ((lon * PI / 180) - lon0);
  const ep2 = e2 / (1 - e2);

  const M = a * (
    (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad)
    - (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad)
  );

  const easting =
    k0 * N * (
      A
      + (1 - T + C) * A ** 3 / 6
      + (5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5 / 120
    ) + 500000;

  let northing =
    k0 * (
      M + N * Math.tan(latRad) * (
        A ** 2 / 2
        + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24
        + (61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6 / 720
      )
    );

  if (lat < 0) northing += 10000000;

  return { zone, letter: utmZoneLetter(lat), easting, northing };
}

function utmToMGRS(utm: UTMCoord): string {
  const { zone, letter, easting, northing } = utm;

  const colSets: Record<number, string> = { 1: 'ABCDEFGH', 2: 'JKLMNPQR', 0: 'STUVWXYZ' };
  const colSet = colSets[zone % 3];
  const colIdx = Math.floor((easting - 100000) / 100000);
  const colLetter = colSet[Math.min(colIdx, colSet.length - 1)] ?? 'A';

  const rowLettersOdd  = 'ABCDEFGHJKLMNPQRSTUV';
  const rowLettersEven = 'FGHJKLMNPQRSTUVABCDE';
  const rowLetters = zone % 2 === 0 ? rowLettersEven : rowLettersOdd;
  const rowIdx = Math.floor((northing % 2000000) / 100000) % 20;
  const rowLetter = rowLetters[rowIdx] ?? 'A';

  const e5 = String(Math.floor(easting % 100000)).padStart(5, '0');
  const n5 = String(Math.floor(northing % 100000)).padStart(5, '0');

  return `${zone}${letter} ${colLetter}${rowLetter} ${e5} ${n5}`;
}

// ── Format parsers ────────────────────────────────────────────────────────────

type CoordFormat = 'DD' | 'DMS' | 'UTM' | 'MGRS';

interface AllFormats {
  dd: string;
  dms: string;
  utm: string;
  mgrs: string;
}

function formatDD(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(6)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(6)}° ${lon >= 0 ? 'E' : 'W'}`;
}

function formatDMS(lat: number, lon: number): string {
  const la = ddToDMS(lat, true);
  const lo = ddToDMS(lon, false);
  return (
    `${la.deg}°${la.min}'${la.sec.toFixed(2)}"${la.dir} ` +
    `${lo.deg}°${lo.min}'${lo.sec.toFixed(2)}"${lo.dir}`
  );
}

function formatUTM(utm: UTMCoord): string {
  return `${utm.zone}${utm.letter} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
}

function parseDD(input: string): { lat: number; lon: number } | null {
  const m = input.match(/([\d.]+)\s*°?\s*([NS]),?\s*([\d.]+)\s*°?\s*([EW])/i);
  if (!m) return null;
  const lat = parseFloat(m[1]) * (m[2].toUpperCase() === 'S' ? -1 : 1);
  const lon = parseFloat(m[3]) * (m[4].toUpperCase() === 'W' ? -1 : 1);
  return { lat, lon };
}

function parseDMS(input: string): { lat: number; lon: number } | null {
  const m = input.match(
    /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/i
  );
  if (!m) return null;
  const lat = dmsToDD(+m[1], +m[2], +m[3], m[4].toUpperCase());
  const lon = dmsToDD(+m[5], +m[6], +m[7], m[8].toUpperCase());
  return { lat, lon };
}

function parseUTM(input: string): { lat: number; lon: number } | null {
  const m = input.match(/(\d{1,2})([A-Z])\s+(\d+)\s+(\d+)/i);
  if (!m) return null;
  const zone = parseInt(m[1]);
  const bandLetter = m[2].toUpperCase();
  const easting = parseFloat(m[3]);
  const northing = parseFloat(m[4]);
  return utmToDD(zone, bandLetter, easting, northing);
}

function parseMGRS(input: string): { lat: number; lon: number } | null {
  // Simplified MGRS parse: extract zone + band + two letters + easting + northing
  const m = input.match(/(\d{1,2})([A-Z])\s*([A-Z]{2})\s*(\d{5})\s*(\d{5})/i);
  if (!m) return null;
  const zone = parseInt(m[1]);
  const bandLetter = m[2].toUpperCase();
  const sqLetters = m[3].toUpperCase();

  const colSets: Record<number, string> = { 1: 'ABCDEFGH', 2: 'JKLMNPQR', 0: 'STUVWXYZ' };
  const colSet = colSets[zone % 3];
  const colIdx = colSet.indexOf(sqLetters[0]);

  const rowLettersOdd  = 'ABCDEFGHJKLMNPQRSTUV';
  const rowLettersEven = 'FGHJKLMNPQRSTUVABCDE';
  const rowLetters = zone % 2 === 0 ? rowLettersEven : rowLettersOdd;
  const rowIdx = rowLetters.indexOf(sqLetters[1]);

  if (colIdx < 0 || rowIdx < 0) return null;

  const easting  = (colIdx + 1) * 100000 + parseInt(m[4]);
  const northing = rowIdx * 100000 + parseInt(m[5]);
  return utmToDD(zone, bandLetter, easting, northing);
}

function utmToDD(zone: number, bandLetter: string, easting: number, northing: number): { lat: number; lon: number } {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = 1 - (b / a) * (b / a);
  const k0 = 0.9996;
  const ep2 = e2 / (1 - e2);

  const letters = 'CDEFGHJKLMNPQRSTUVWXX';
  const bandIdx = letters.indexOf(bandLetter);
  const isSouth = bandIdx < letters.indexOf('N');

  const x = easting - 500000;
  const y = isSouth ? northing - 10000000 : northing;

  const lon0 = toRad((zone - 1) * 6 - 180 + 3);

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);

  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ep2 * Math.cos(phi1) ** 2;
  const R1 = a * (1 - e2) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D = x / (N1 * k0);

  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
    D ** 2 / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6 / 720
  );

  const lon = lon0 + (
    D
    - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5 / 120
  ) / Math.cos(phi1);

  return { lat: lat * 180 / PI, lon: lon * 180 / PI };
}

function convertFromInput(raw: string, fmt: CoordFormat): AllFormats | string {
  let latLon: { lat: number; lon: number } | null = null;

  if (fmt === 'DD')   latLon = parseDD(raw);
  if (fmt === 'DMS')  latLon = parseDMS(raw);
  if (fmt === 'UTM')  latLon = parseUTM(raw);
  if (fmt === 'MGRS') latLon = parseMGRS(raw);

  if (!latLon) return 'Could not parse input. Check format and try again.';

  const { lat, lon } = latLon;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return 'Coordinates out of valid range.';

  const utm = ddToUTM(lat, lon);
  return {
    dd:   formatDD(lat, lon),
    dms:  formatDMS(lat, lon),
    utm:  formatUTM(utm),
    mgrs: utmToMGRS(utm),
  };
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
