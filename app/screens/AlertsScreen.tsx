import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StyleSheet, Modal, Alert, FlatList,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme/colors';
import { supabase, isSupabaseConfigured, GdAlert, AlertType, AlertSeverity } from '../db/supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const RADIUS_MILES = 50;

const ALERT_TYPES: { type: AlertType; label: string; icon: string }[] = [
  { type: 'weather',       label: 'Weather',        icon: '🌩️' },
  { type: 'fire',          label: 'Fire',            icon: '🔥' },
  { type: 'flood',         label: 'Flood',           icon: '🌊' },
  { type: 'power_outage',  label: 'Power Outage',    icon: '⚡' },
  { type: 'road_closure',  label: 'Road Closure',    icon: '🚧' },
  { type: 'shelter',       label: 'Shelter',         icon: '🏠' },
  { type: 'evacuation',    label: 'Evacuation',      icon: '🚨' },
  { type: 'medical',       label: 'Medical',         icon: '🩺' },
  { type: 'security',      label: 'Security',        icon: '🔒' },
  { type: 'other',         label: 'Other',           icon: '⚠️' },
];

const SEVERITIES: { sev: AlertSeverity; label: string; color: string }[] = [
  { sev: 'info',     label: 'Info',     color: Colors.info },
  { sev: 'warning',  label: 'Warning',  color: Colors.warning },
  { sev: 'critical', label: 'Critical', color: Colors.danger },
];

const EXPIRY_OPTIONS = [
  { label: '1 hour',   hours: 1 },
  { label: '6 hours',  hours: 6 },
  { label: '24 hours', hours: 24 },
  { label: '3 days',   hours: 72 },
  { label: 'No expiry', hours: 0 },
];

function sevColor(sev: AlertSeverity) {
  return SEVERITIES.find((s) => s.sev === sev)?.color ?? Colors.info;
}

function typeIcon(type: AlertType) {
  return ALERT_TYPES.find((t) => t.type === type)?.icon ?? '⚠️';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ─── Post Alert Modal ─────────────────────────────────────────────────────────

interface PostAlertModalProps {
  visible: boolean;
  userLocation: { lat: number; lon: number } | null;
  onClose: () => void;
  onPosted: () => void;
}

function PostAlertModal({ visible, userLocation, onClose, onPosted }: PostAlertModalProps) {
  const [selType, setSelType] = useState<AlertType>('other');
  const [selSev, setSelSev] = useState<AlertSeverity>('info');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [expiryHours, setExpiryHours] = useState(6);
  const [posting, setPosting] = useState(false);

  const canPost = title.trim().length > 0 && userLocation !== null;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const expiresAt = expiryHours > 0
      ? new Date(Date.now() + expiryHours * 3600_000).toISOString()
      : null;

    const { error } = await supabase.from('gd_alerts').insert({
      user_id: user?.id ?? null,
      type: selType,
      title: title.trim(),
      description: desc.trim() || null,
      lat: userLocation!.lat,
      lon: userLocation!.lon,
      severity: selSev,
      expires_at: expiresAt,
    });
    setPosting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTitle(''); setDesc('');
      onPosted();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={m.container}>
        <View style={m.header}>
          <Text style={m.headerTitle}>Post Alert</Text>
          <TouchableOpacity onPress={onClose}><Text style={m.closeBtn}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={m.form} showsVerticalScrollIndicator={false}>
          {!userLocation && (
            <View style={m.locWarning}>
              <Text style={m.locWarningText}>⚠️ Location unavailable — enable location to post alerts.</Text>
            </View>
          )}

          <Text style={m.fieldLabel}>Alert Type</Text>
          <View style={m.typePicker}>
            {ALERT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.type}
                style={[m.typeBtn, selType === t.type && m.typeBtnActive]}
                onPress={() => setSelType(t.type)}
              >
                <Text style={m.typeBtnIcon}>{t.icon}</Text>
                <Text style={[m.typeBtnLabel, selType === t.type && m.typeBtnLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={m.fieldLabel}>Severity</Text>
          <View style={m.sevRow}>
            {SEVERITIES.map((s) => (
              <TouchableOpacity
                key={s.sev}
                style={[m.sevBtn, selSev === s.sev && { backgroundColor: s.color + '33', borderColor: s.color }]}
                onPress={() => setSelSev(s.sev)}
              >
                <Text style={[m.sevLabel, selSev === s.sev && { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={m.fieldLabel}>Title *</Text>
          <TextInput
            style={m.input}
            placeholder="e.g. Power out on Main St"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          <Text style={m.fieldLabel}>Details (optional)</Text>
          <TextInput
            style={[m.input, m.inputMulti]}
            placeholder="Additional information..."
            placeholderTextColor={Colors.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Text style={m.fieldLabel}>Expires After</Text>
          <View style={m.expiryRow}>
            {EXPIRY_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e.label}
                style={[m.expiryBtn, expiryHours === e.hours && m.expiryBtnActive]}
                onPress={() => setExpiryHours(e.hours)}
              >
                <Text style={[m.expiryLabel, expiryHours === e.hours && m.expiryLabelActive]}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[m.postBtn, (!canPost || posting) && m.postBtnDisabled]}
            onPress={handlePost}
            disabled={!canPost || posting}
          >
            {posting
              ? <ActivityIndicator color={Colors.textOnPrimary} />
              : <Text style={m.postBtnText}>Post Alert Anonymously</Text>
            }
          </TouchableOpacity>
          <Text style={m.anonNote}>Alerts are posted anonymously. Your name is never shown.</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function AlertsScreen() {
  const [alerts, setAlerts] = useState<GdAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showPost, setShowPost] = useState(false);
  const configured = isSupabaseConfigured();
  const subRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Request location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }
    })();
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    setLoading(true);
    let query = supabase
      .from('gd_alerts')
      .select('*')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(100);

    const { data, error } = await query;
    if (!error && data) {
      // Client-side Haversine filter if location available
      if (location) {
        const nearby = (data as GdAlert[]).filter((a) => haversine(location.lat, location.lon, a.lat, a.lon) <= RADIUS_MILES);
        setAlerts(nearby);
      } else {
        setAlerts(data as GdAlert[]);
      }
    }
    setLoading(false);
  }, [configured, location]);

  // Initial fetch
  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Realtime subscription
  useEffect(() => {
    if (!configured) return;
    subRef.current = supabase
      .channel('gd_alerts_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gd_alerts' }, async (payload) => {
        const newAlert = payload.new as GdAlert;
        // Filter by distance
        if (location && haversine(location.lat, location.lon, newAlert.lat, newAlert.lon) > RADIUS_MILES) return;
        setAlerts((prev) => [newAlert, ...prev]);
        // Push notification for critical alerts
        if (newAlert.severity === 'critical') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚨 Critical Alert: ${newAlert.title}`,
              body: newAlert.description ?? 'Tap to view details',
              sound: true,
            },
            trigger: null,
          });
        }
      })
      .subscribe();

    return () => { subRef.current?.unsubscribe(); };
  }, [configured, location]);

  if (!configured) {
    return (
      <SafeAreaView style={al.safe}>
        <View style={al.unconfigured}>
          <Text style={al.unconfiguredIcon}>📡</Text>
          <Text style={al.unconfiguredTitle}>Community Alerts</Text>
          <Text style={al.unconfiguredText}>
            Community alerts require a Supabase backend. Add{'\n'}
            EXPO_PUBLIC_SUPABASE_URL and{'\n'}
            EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderAlert = ({ item }: { item: GdAlert }) => (
    <View style={[al.alertCard, { borderLeftColor: sevColor(item.severity) }]}>
      <View style={al.alertHeader}>
        <Text style={al.alertIcon}>{typeIcon(item.type)}</Text>
        <View style={al.alertMeta}>
          <Text style={al.alertTitle}>{item.title}</Text>
          <Text style={al.alertTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <View style={[al.sevBadge, { backgroundColor: sevColor(item.severity) + '33' }]}>
          <Text style={[al.sevBadgeText, { color: sevColor(item.severity) }]}>{item.severity.toUpperCase()}</Text>
        </View>
      </View>
      {item.description ? <Text style={al.alertDesc}>{item.description}</Text> : null}
      {item.expires_at && (
        <Text style={al.alertExpiry}>
          Expires {new Date(item.expires_at).toLocaleString()}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={al.safe}>
      <View style={al.header}>
        <View>
          <Text style={al.headerTitle}>Community Alerts</Text>
          <Text style={al.headerSub}>{location ? `${RADIUS_MILES}-mile radius` : 'All alerts (no location)'}</Text>
        </View>
        <TouchableOpacity style={al.postBtn} onPress={() => setShowPost(true)}>
          <Text style={al.postBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={alerts}
            keyExtractor={(a) => a.id}
            renderItem={renderAlert}
            contentContainerStyle={al.list}
            onRefresh={fetchAlerts}
            refreshing={loading}
            ListEmptyComponent={
              <View style={al.empty}>
                <Text style={al.emptyIcon}>✅</Text>
                <Text style={al.emptyText}>No active alerts in your area. Stay prepared!</Text>
              </View>
            }
          />
        )}

      <PostAlertModal
        visible={showPost}
        userLocation={location}
        onClose={() => setShowPost(false)}
        onPosted={fetchAlerts}
      />
    </SafeAreaView>
  );
}

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const al = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  unconfigured: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  unconfiguredIcon: { fontSize: 48, marginBottom: 16 },
  unconfiguredTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  unconfiguredText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800' },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  postBtn: { backgroundColor: Colors.primaryDim, borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  postBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  alertCard: {
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderLeftWidth: 4, padding: 12,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  alertIcon: { fontSize: 20 },
  alertMeta: { flex: 1 },
  alertTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  alertTime: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sevBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  alertDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  alertExpiry: { color: Colors.textMuted, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', fontSize: 14 },
});

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  closeBtn: { color: Colors.textSecondary, fontSize: 20, padding: 4 },
  form: { padding: 16, gap: 8, paddingBottom: 40 },
  locWarning: { backgroundColor: Colors.warningBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.warning, marginBottom: 8 },
  locWarningText: { color: Colors.warning, fontSize: 13 },
  fieldLabel: { color: Colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center', minWidth: 72 },
  typeBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  typeBtnIcon: { fontSize: 16 },
  typeBtnLabel: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  typeBtnLabelActive: { color: Colors.primary },
  sevRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  sevBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center' },
  sevLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  input: { backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, color: Colors.textPrimary, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 4 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  expiryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  expiryBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  expiryBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  expiryLabel: { color: Colors.textSecondary, fontSize: 13 },
  expiryLabelActive: { color: Colors.primary },
  postBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  postBtnDisabled: { backgroundColor: Colors.textMuted },
  postBtnText: { color: Colors.textOnPrimary, fontSize: 15, fontWeight: '800' },
  anonNote: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
