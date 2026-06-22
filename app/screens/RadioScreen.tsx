import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StyleSheet, FlatList, Alert,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import { Colors } from '../theme/colors';
import RADIO_DATA from '../assets/content/radio-frequencies.json';

// ─── SQLite helpers ──────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;
async function getDb() {
  if (!_db) _db = await SQLite.openDatabaseAsync('griddown.db');
  return _db;
}

async function initFavoritesTable() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS radio_favorites (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      freq TEXT NOT NULL,
      tab TEXT NOT NULL
    );
  `);
}

async function loadFavorites(): Promise<Favorite[]> {
  const db = await getDb();
  return db.getAllAsync<Favorite>('SELECT * FROM radio_favorites ORDER BY label ASC');
}

async function addFavorite(fav: Favorite) {
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO radio_favorites (id, label, freq, tab) VALUES (?, ?, ?, ?)',
    [fav.id, fav.label, fav.freq, fav.tab]
  );
}

async function removeFavorite(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM radio_favorites WHERE id = ?', [id]);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'Weather' | 'FRS' | 'GMRS' | 'MURS' | 'HAM' | 'Emergency' | 'CB' | 'Aviation' | 'Favorites';
const TABS: Tab[] = ['Weather', 'FRS', 'GMRS', 'MURS', 'HAM', 'Emergency', 'CB', 'Aviation', 'Favorites'];

interface Favorite { id: string; label: string; freq: string; tab: string; }

interface FreqRow {
  id: string;
  label: string;
  freq: string;
  sub: string;
  tab: Tab;
}

// ─── Data normalisation ───────────────────────────────────────────────────────

function buildRows(): Record<Tab, FreqRow[]> {
  const weather: FreqRow[] = (RADIO_DATA.weather as any[]).map((w) => ({
    id: `wx-${w.name}`, label: w.name, freq: `${w.freq} MHz`, sub: w.desc, tab: 'Weather' as Tab,
  }));

  const frs: FreqRow[] = (RADIO_DATA.frs as any[]).map((r) => ({
    id: `frs-${r.ch}`, label: `FRS Ch ${r.ch}`, freq: `${r.freq} MHz`,
    sub: `${r.power} · ${r.note}`, tab: 'FRS' as Tab,
  }));

  const gmrs: FreqRow[] = (RADIO_DATA.gmrs as any[]).map((r) => ({
    id: `gmrs-${r.ch}`, label: `GMRS Ch ${r.ch}`, freq: `${r.freq} MHz`,
    sub: `${r.power} · ${r.note}`, tab: 'GMRS' as Tab,
  }));

  const murs: FreqRow[] = (RADIO_DATA.murs as any[]).map((r) => ({
    id: `murs-${r.ch}`, label: `MURS Ch ${r.ch}`, freq: `${r.freq} MHz`,
    sub: `${r.power} · ${r.note}`, tab: 'MURS' as Tab,
  }));

  const ham: FreqRow[] = (RADIO_DATA.ham as any[]).map((r) => ({
    id: `ham-${r.freq}`, label: r.name, freq: `${r.freq} MHz`,
    sub: `${r.band} · ${r.mode} · ${r.note}`, tab: 'HAM' as Tab,
  }));

  const emergency: FreqRow[] = (RADIO_DATA.emergency as any[]).map((r) => ({
    id: `em-${r.freq}`, label: r.name, freq: `${r.freq} MHz`,
    sub: r.note, tab: 'Emergency' as Tab,
  }));

  const cb: FreqRow[] = (RADIO_DATA.cb as any[]).map((r) => ({
    id: `cb-${r.ch}`, label: `CB Ch ${r.ch}`, freq: `${r.freq} MHz`,
    sub: r.note, tab: 'CB' as Tab,
  }));

  const aviation: FreqRow[] = (RADIO_DATA.aviation as any[]).map((r) => ({
    id: `av-${r.freq}`, label: r.name, freq: `${r.freq} MHz`,
    sub: r.note, tab: 'Aviation' as Tab,
  }));

  return { Weather: weather, FRS: frs, GMRS: gmrs, MURS: murs, HAM: ham,
           Emergency: emergency, CB: cb, Aviation: aviation, Favorites: [] };
}

const ALL_ROWS = buildRows();

// ─── Main screen ─────────────────────────────────────────────────────────────

export function RadioScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Weather');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    initFavoritesTable().then(refreshFavorites);
  }, []);

  const refreshFavorites = useCallback(async () => {
    const favs = await loadFavorites();
    setFavorites(favs);
    setFavIds(new Set(favs.map((f) => f.id)));
  }, []);

  const toggleFav = useCallback(async (row: FreqRow) => {
    if (favIds.has(row.id)) {
      await removeFavorite(row.id);
    } else {
      await addFavorite({ id: row.id, label: row.label, freq: row.freq, tab: row.tab });
    }
    await refreshFavorites();
  }, [favIds, refreshFavorites]);

  const rows: FreqRow[] = activeTab === 'Favorites'
    ? favorites.map((f) => ({ id: f.id, label: f.label, freq: f.freq, sub: f.tab, tab: f.tab as Tab }))
    : ALL_ROWS[activeTab];

  const filtered = query.trim()
    ? rows.filter((r) =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.freq.includes(query) ||
        r.sub.toLowerCase().includes(query.toLowerCase()))
    : rows;

  const renderRow = ({ item }: { item: FreqRow }) => {
    const isFav = favIds.has(item.id);
    const isEmergency = item.tab === 'Emergency' || item.label.toLowerCase().includes('guard') || item.label.toLowerCase().includes('distress');
    return (
      <View style={[styles.row, isEmergency && styles.rowEmergency]}>
        <View style={styles.rowText}>
          <Text style={[styles.rowLabel, isEmergency && styles.rowLabelEmergency]}>{item.label}</Text>
          <Text style={styles.rowFreq}>{item.freq}</Text>
          <Text style={styles.rowSub}>{item.sub}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFav(item)} style={styles.favBtn}>
          <Text style={[styles.favIcon, isFav && styles.favIconActive]}>{isFav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Search frequency, channel…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => { setActiveTab(t); setQuery(''); }}
          >
            <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Info banner */}
      {activeTab === 'HAM' && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>⚠️ HAM frequencies require an FCC Amateur Radio license to transmit. Listening is legal for anyone.</Text>
        </View>
      )}
      {activeTab === 'GMRS' && (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>ℹ️ GMRS requires an FCC GMRS license ($35 / 10 years). Covers entire household.</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{activeTab === 'Favorites' ? 'No favorites yet. Tap ☆ on any frequency to save it.' : 'No results.'}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { padding: 12 },
  search: {
    backgroundColor: Colors.surface,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder,
    color: Colors.textPrimary, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  tabBar: { maxHeight: 48 },
  tabBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  tabBtnActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: Colors.primary },
  infoBanner: {
    marginHorizontal: 12, marginTop: 8, padding: 10,
    backgroundColor: Colors.warningBg, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warning,
  },
  infoBannerText: { color: Colors.warning, fontSize: 12 },
  list: { padding: 12, gap: 8 },
  row: {
    backgroundColor: Colors.surface, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    flexDirection: 'row', alignItems: 'center', padding: 12,
  },
  rowEmergency: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg },
  rowText: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  rowLabelEmergency: { color: Colors.danger },
  rowFreq: { color: Colors.primary, fontSize: 16, fontWeight: '800', marginTop: 2 },
  rowSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  favBtn: { padding: 8 },
  favIcon: { fontSize: 20, color: Colors.textMuted },
  favIconActive: { color: Colors.warning },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
