import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export function MapScreen() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermDenied(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.placeholderTitle}>Offline Map Packs</Text>
          <Text style={styles.placeholderSub}>
            Downloadable offline map tiles are coming in the next update.
            Navigate without internet using pre-downloaded regional topo and satellite maps.
          </Text>

          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>COMING NEXT UPDATE</Text>
          </View>
        </View>

        {/* Current location */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="navigate" size={18} color={Colors.secondary} />
            <Text style={styles.locationTitle}>LAST KNOWN POSITION</Text>
          </View>

          {permDenied ? (
            <Text style={styles.locationDenied}>
              Location permission denied. Enable location access in Settings to see your position.
            </Text>
          ) : location ? (
            <View style={styles.coordRow}>
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LATITUDE</Text>
                <Text style={styles.coordValue}>{location.lat.toFixed(6)}°</Text>
              </View>
              <View style={styles.coordDivider} />
              <View style={styles.coordItem}>
                <Text style={styles.coordLabel}>LONGITUDE</Text>
                <Text style={styles.coordValue}>{location.lon.toFixed(6)}°</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.locationPending}>Acquiring location…</Text>
          )}
        </View>

        {/* Planned features */}
        <View style={styles.featureList}>
          <Text style={styles.featureListTitle}>PLANNED MAP FEATURES</Text>
          {[
            'Downloadable topo and satellite tile packs',
            'Regional coverage — CONUS, Alaska, Hawaii',
            'Mark waypoints and routes offline',
            'Grid coordinate display (MGRS / UTM)',
            'Compass overlay and bearing tracker',
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 16, gap: 16 },
  mapPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    padding: 32,
    gap: 12,
    borderStyle: 'dashed',
  },
  placeholderTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  placeholderSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  comingSoonBadge: {
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  comingSoonText: { color: Colors.secondary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    gap: 12,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  coordRow: { flexDirection: 'row', gap: 16 },
  coordItem: { flex: 1, gap: 4 },
  coordLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  coordValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  coordDivider: { width: 1, backgroundColor: Colors.divider },
  locationDenied: { color: Colors.textSecondary, fontSize: 13 },
  locationPending: { color: Colors.textMuted, fontSize: 14 },
  featureList: { gap: 10 },
  featureListTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.secondary, marginTop: 7 },
  featureText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 },
});
