import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, TextInput, FlatList,
  Alert, Share,
} from 'react-native';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// ── Types ──────────────────────────────────────────────────────────────────

type PointType = 'Water Source' | 'Shelter' | 'Repeater' | 'Rally Point' | 'Hazard' | 'Custom';

interface MapPoint {
  id: string;
  label: string;
  type: PointType;
  lat: number;
  lon: number;
  notes: string;
  created_at: number;
}

const POINT_TYPES: PointType[] = ['Water Source', 'Shelter', 'Repeater', 'Rally Point', 'Hazard', 'Custom'];

const TYPE_COLORS: Record<PointType, string> = {
  'Water Source': '#3A8FC4',
  'Shelter': '#4A7C59',
  'Repeater': '#7B5EA7',
  'Rally Point': '#8B9E67',
  'Hazard': '#C4483A',
  'Custom': '#666666',
};

// ── Database ───────────────────────────────────────────────────────────────

let mapDb: SQLite.SQLiteDatabase | null = null;

async function getMapDb(): Promise<SQLite.SQLiteDatabase> {
  if (!mapDb) {
    mapDb = await SQLite.openDatabaseAsync('griddown.db');
    await mapDb.execAsync(`
      CREATE TABLE IF NOT EXISTS map_points (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        type TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        notes TEXT,
        created_at INTEGER
      );
    `);
  }
  return mapDb;
}

async function loadMapPoints(): Promise<MapPoint[]> {
  const db = await getMapDb();
  const rows = await db.getAllAsync<MapPoint>(
    'SELECT * FROM map_points ORDER BY created_at DESC'
  );
  return rows;
}

async function saveMapPoint(point: MapPoint): Promise<void> {
  const db = await getMapDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO map_points (id, label, type, lat, lon, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [point.id, point.label, point.type, point.lat, point.lon, point.notes, point.created_at]
  );
}

async function deleteMapPoint(id: string): Promise<void> {
  const db = await getMapDb();
  await db.runAsync('DELETE FROM map_points WHERE id = ?', [id]);
}

// ── Geo helpers ────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function cardinalBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(brng / 45) % 8];
}

function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}  ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}

function generateId(): string {
  return `pt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MapScreen() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  const [showMGRS, setShowMGRS] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [marking, setMarking] = useState(false);
  const [selectedType, setSelectedType] = useState<PointType>('Custom');
  const [pointLabel, setPointLabel] = useState('');
  const [pointNotes, setPointNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const locationRef = useRef<{ lat: number; lon: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Location polling ─────────────────────────────────────────────────────

  const fetchLocation = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setLocation(coords);
      locationRef.current = coords;
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermDenied(true);
        return;
      }
      await fetchLocation();
      intervalRef.current = setInterval(() => { void fetchLocation(); }, 5000);
    })();

    getMapDb()
      .then(() => loadMapPoints())
      .then(setPoints)
      .catch(() => {});

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Clipboard / Share ────────────────────────────────────────────────────

  const handleCopyCoords = useCallback(async () => {
    if (!location) return;
    const text = `${location.lat.toFixed(6)},${location.lon.toFixed(6)}`;
    try {
      await Share.share({ message: text, title: 'Coordinates' });
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    } catch {
      Alert.alert('Copy failed', 'Could not copy coordinates.');
    }
  }, [location]);

  // ── Mark Point ───────────────────────────────────────────────────────────

  const handleSavePoint = useCallback(async () => {
    const loc = locationRef.current;
    if (!loc) {
      Alert.alert('No Location', 'Waiting for GPS fix. Try again in a moment.');
      return;
    }
    if (!pointLabel.trim()) {
      Alert.alert('Label Required', 'Enter a name for this point.');
      return;
    }
    setSaving(true);
    try {
      const newPoint: MapPoint = {
        id: generateId(),
        label: pointLabel.trim(),
        type: selectedType,
        lat: loc.lat,
        lon: loc.lon,
        notes: pointNotes.trim(),
        created_at: Date.now(),
      };
      await saveMapPoint(newPoint);
      setPoints((prev) => [newPoint, ...prev]);
      setMarking(false);
      setPointLabel('');
      setPointNotes('');
      setSelectedType('Custom');
    } catch {
      Alert.alert('Error', 'Failed to save point.');
    } finally {
      setSaving(false);
    }
  }, [pointLabel, pointNotes, selectedType]);

  const handleDeletePoint = useCallback((id: string) => {
    Alert.alert('Delete Point', 'Remove this marked point?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMapPoint(id);
            setPoints((prev) => prev.filter((p) => p.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete point.');
          }
        },
      },
    ]);
  }, []);

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderCoordDisplay = () => {
    if (permDenied) {
      return (
        <Text style={styles.coordError}>
          Location permission denied. Enable in device Settings.
        </Text>
      );
    }
    if (!location) {
      return <Text style={styles.coordAcquiring}>ACQUIRING LOCATION...</Text>;
    }
    return (
      <>
        <Text style={styles.coordValue}>{formatCoords(location.lat, location.lon)}</Text>
        {showMGRS && (
          <Text style={styles.mgrsNote}>
            MGRS: Grid Converter tool required for MGRS conversion
          </Text>
        )}
      </>
    );
  };

  const renderPoint = ({ item }: { item: MapPoint }) => {
    const dist = location
      ? haversineDistance(location.lat, location.lon, item.lat, item.lon)
      : null;
    const bearing = location
      ? cardinalBearing(location.lat, location.lon, item.lat, item.lon)
      : null;
    const chipColor = TYPE_COLORS[item.type] ?? '#666';

    return (
      <View style={styles.pointRow}>
        <View style={styles.pointInfo}>
          <View style={styles.pointTitleRow}>
            <Text style={styles.pointLabel}>{item.label}</Text>
            <View style={[styles.typeChip, { backgroundColor: chipColor + '33', borderColor: chipColor }]}>
              <Text style={[styles.typeChipText, { color: chipColor }]}>{item.type}</Text>
            </View>
          </View>
          {item.notes ? <Text style={styles.pointNotes} numberOfLines={1}>{item.notes}</Text> : null}
          {dist !== null && bearing !== null && (
            <Text style={styles.pointDist}>
              {formatDistance(dist)} · {bearing}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeletePoint(item.id)}
          accessibilityLabel="Delete point"
        >
          <Ionicons name="trash-outline" size={18} color="#C4483A" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Coordinate Card */}
        <View style={styles.coordCard}>
          <Text style={styles.coordTitle}>📍 CURRENT POSITION</Text>
          {renderCoordDisplay()}

          <View style={styles.coordActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowMGRS((v) => !v)}
            >
              <Text style={styles.actionBtnText}>{showMGRS ? 'LAT-LON' : 'MGRS'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, !location && styles.actionBtnDisabled]}
              onPress={() => void handleCopyCoords()}
              disabled={!location}
            >
              <Ionicons name="copy-outline" size={14} color={location ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.actionBtnText, !location && styles.actionBtnTextDisabled]}>
                {copiedMsg ? 'COPIED!' : 'COPY'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.markBtn]}
              onPress={() => setMarking(true)}
            >
              <Ionicons name="flag-outline" size={14} color="#fff" />
              <Text style={styles.markBtnText}>MARK POINT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺 Map requires build</Text>
          <Text style={styles.mapPlaceholderSub}>Expo Go: coordinates only</Text>
        </View>

        {/* Saved Points */}
        <Text style={styles.sectionHeader}>SAVED POINTS</Text>
        {points.length === 0 ? (
          <View style={styles.emptyPoints}>
            <Ionicons name="location-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No saved points yet</Text>
            <Text style={styles.emptyHint}>Use MARK POINT to save your position</Text>
          </View>
        ) : (
          <FlatList
            data={points}
            keyExtractor={(item) => item.id}
            renderItem={renderPoint}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            style={styles.pointsList}
          />
        )}
      </ScrollView>

      {/* Mark Point Modal */}
      <Modal visible={marking} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>MARK POINT</Text>
            <Text style={styles.modalSubtitle}>
              {location ? formatCoords(location.lat, location.lon) : 'No location'}
            </Text>

            <TextInput
              style={styles.labelInput}
              placeholder="Point name..."
              placeholderTextColor={Colors.textMuted}
              value={pointLabel}
              onChangeText={setPointLabel}
              maxLength={40}
              autoFocus
            />

            <Text style={styles.typeLabel}>TYPE</Text>
            <View style={styles.typeGrid}>
              {POINT_TYPES.map((pt) => {
                const color = TYPE_COLORS[pt];
                const active = selectedType === pt;
                return (
                  <TouchableOpacity
                    key={pt}
                    style={[
                      styles.typeOption,
                      { borderColor: color },
                      active && { backgroundColor: color + '33' },
                    ]}
                    onPress={() => setSelectedType(pt)}
                  >
                    <Text style={[styles.typeOptionText, { color: active ? color : Colors.textSecondary }]}>
                      {pt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)..."
              placeholderTextColor={Colors.textMuted}
              value={pointNotes}
              onChangeText={setPointNotes}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setMarking(false);
                  setPointLabel('');
                  setPointNotes('');
                  setSelectedType('Custom');
                }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={() => void handleSavePoint()}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  // Coordinate card
  coordCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 16,
    gap: 12,
  },
  coordTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  coordValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B9E67',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  coordAcquiring: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  coordError: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  mgrsNote: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  coordActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionBtnTextDisabled: {
    color: Colors.textMuted,
  },
  markBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  markBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Map placeholder
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Section header
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },

  // Saved points
  pointsList: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  pointInfo: { flex: 1, gap: 4 },
  pointTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pointLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  typeChip: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  pointNotes: { color: Colors.textSecondary, fontSize: 12 },
  pointDist: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  deleteBtn: { padding: 6 },
  separator: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 14 },
  emptyPoints: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  emptyHint: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2A2A2A',
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  labelInput: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    color: Colors.textPrimary,
    fontSize: 15,
    padding: 12,
  },
  typeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    color: Colors.textPrimary,
    fontSize: 14,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
