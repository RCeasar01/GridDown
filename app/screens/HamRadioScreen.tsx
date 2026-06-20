// TODO: Lock to Monthly+ tier via useAppStore
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Clipboard,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../theme/colors';
import repeaterData from '../assets/content/ham-repeaters.json';
import {
  getSavedRepeaters,
  saveRepeater,
  deleteRepeater,
  updateRepeaterNotes,
  SavedRepeater,
} from '../db/contentLoader';

interface Repeater {
  id: string;
  state: string;
  city: string;
  frequency_output: number;
  frequency_input: number;
  offset: string;
  tone_ctcss: number;
  call_sign: string;
  use: string;
  operational_status: string;
  notes: string;
}

const USE_FILTERS = ['ALL', 'OPEN', 'ARES', 'RACES', 'SKYWARN', 'CLUB'] as const;
type UseFilter = typeof USE_FILTERS[number];

type TagType = 'Primary' | 'Backup' | 'ARES' | 'RACES' | 'Local';

const USE_COLORS: Record<string, string> = {
  OPEN: Colors.secondary,
  ARES: Colors.primary,
  RACES: '#4A6FA5',
  SKYWARN: Colors.warning,
  CLUB: '#8B5CF6',
  CLOSED: Colors.textMuted,
};

const TAG_COLORS: Record<string, string> = {
  Primary: '#22C55E',
  Backup: '#EAB308',
  ARES: '#3B82F6',
  RACES: '#8B5CF6',
  Local: '#6B7280',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function HamRadioScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<UseFilter>('ALL');
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [savedRepeaters, setSavedRepeaters] = useState<SavedRepeater[]>([]);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveModalRepeater, setSaveModalRepeater] = useState<Repeater | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagType>('Local');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
      const saved = await getSavedRepeaters();
      setSavedRepeaters(saved);
    })();
  }, []);

  const refreshSaved = useCallback(async () => {
    const saved = await getSavedRepeaters();
    setSavedRepeaters(saved);
  }, []);

  const filteredData = useMemo(() => {
    const allRepeaters = repeaterData as Repeater[];
    const query = searchText.trim().toLowerCase();

    let results = allRepeaters.filter((r) => {
      const matchesSearch =
        query === '' ||
        r.state.toLowerCase().includes(query) ||
        r.city.toLowerCase().includes(query) ||
        r.call_sign.toLowerCase().includes(query) ||
        r.notes.toLowerCase().includes(query);

      const matchesFilter = activeFilter === 'ALL' || r.use === activeFilter;

      return matchesSearch && matchesFilter;
    });

    results.sort((a, b) => {
      const aOnAir = a.operational_status === 'On-air' ? 0 : 1;
      const bOnAir = b.operational_status === 'On-air' ? 0 : 1;
      if (aOnAir !== bOnAir) return aOnAir - bOnAir;
      const stateCompare = a.state.localeCompare(b.state);
      if (stateCompare !== 0) return stateCompare;
      return a.city.localeCompare(b.city);
    });

    // Distance sort: only applies when the JSON data includes coordinates per repeater.
    // The current ham-repeaters.json does not carry lat/lon per entry, so this toggle
    // preserves the default sort order and shows the UI affordance for future use.
    if (sortByDistance && userLocation) {
      // No-op: repeater JSON lacks coordinates; fallback to default sort above.
    }

    return results;
  }, [searchText, activeFilter, sortByDistance, userLocation]);

  const handleCopyFreq = (repeater: Repeater) => {
    const freqStr = `${repeater.frequency_output.toFixed(3)} MHz`;
    Clipboard.setString(freqStr);
    Alert.alert('Copied', `${freqStr} copied to clipboard`);
  };

  const handleSaveRepeater = async () => {
    if (!saveModalRepeater) return;
    await saveRepeater({
      callsign: saveModalRepeater.call_sign,
      frequency: saveModalRepeater.frequency_output.toFixed(3),
      tone: saveModalRepeater.tone_ctcss ? saveModalRepeater.tone_ctcss.toFixed(1) : undefined,
      location: `${saveModalRepeater.city}, ${saveModalRepeater.state}`,
      tag: selectedTag,
    });
    await refreshSaved();
    setSaveModalVisible(false);
    setSaveModalRepeater(null);
    Alert.alert('Saved', `${saveModalRepeater.call_sign} saved to My Repeaters`);
  };

  const handleDeleteRepeater = (id: string, callsign: string) => {
    Alert.alert('Delete Repeater', `Remove ${callsign} from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRepeater(id);
          await refreshSaved();
        },
      },
    ]);
  };

  const handleNotesChange = async (id: string, notes: string) => {
    setSavedRepeaters((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));
    await updateRepeaterNotes(id, notes);
  };

  const renderRepeaterCard = ({ item }: { item: Repeater }) => {
    const useColor = USE_COLORS[item.use] ?? Colors.textSecondary;
    const isOnAir = item.operational_status === 'On-air';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.callSign}>{item.call_sign}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isOnAir ? Colors.secondaryDim : Colors.warningBg }]}>
              <Text style={[styles.badgeText, { color: isOnAir ? Colors.secondary : Colors.warning }]}>
                {item.operational_status}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: useColor + '22' }]}>
              <Text style={[styles.badgeText, { color: useColor }]}>{item.use}</Text>
            </View>
          </View>
        </View>

        <View style={styles.freqRow}>
          <Ionicons name="radio-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.freqText}>{item.frequency_output.toFixed(3)} MHz</Text>
          <Text style={styles.offsetText}>({item.offset} MHz)</Text>
          <Text style={styles.toneText}>  PL {item.tone_ctcss.toFixed(1)}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.locationText}>
            {item.city}, {item.state}
          </Text>
        </View>

        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.copyButton} onPress={() => handleCopyFreq(item)}>
            <Ionicons name="copy-outline" size={13} color={Colors.primary} />
            <Text style={styles.copyButtonText}>Copy Freq</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              setSaveModalRepeater(item);
              setSelectedTag('Local');
              setSaveModalVisible(true);
            }}
          >
            <Text style={styles.saveButtonText}>💾 SAVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="radio" size={48} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>No Repeaters Found</Text>
      <Text style={styles.emptySubtitle}>
        Try a different state abbreviation, city name, or filter.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Disclaimer Banner */}
      <View style={styles.disclaimer}>
        <Ionicons name="warning-outline" size={14} color={Colors.warning} />
        <Text style={styles.disclaimerText}>
          Data sourced from RepeaterBook. Verify before use — frequencies may change.
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'search' && styles.tabBtnActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={styles.tabBtnText}>SEARCH</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
          onPress={() => setActiveTab('saved')}
        >
          <Text style={styles.tabBtnText}>MY REPEATERS</Text>
        </TouchableOpacity>
      </View>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <>
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search state (AL), city, callsign..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="characters"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            {USE_FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Result Count + Sort Toggle */}
          <View style={styles.resultCountRow}>
            <Text style={styles.resultCount}>
              {filteredData.length} repeater{filteredData.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity style={styles.sortToggle} onPress={() => setSortByDistance(!sortByDistance)}>
              <Text style={styles.sortToggleText}>
                Sort: {sortByDistance ? 'Distance ↑' : 'Default'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Repeater List */}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderRepeaterCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        </>
      )}

      {/* My Repeaters Tab */}
      {activeTab === 'saved' && (
        <FlatList
          data={savedRepeaters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Saved Repeaters</Text>
              <Text style={styles.emptySubtitle}>Save repeaters from the Search tab.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.callSign}>{item.callsign}</Text>
                <View style={[styles.badge, { backgroundColor: TAG_COLORS[item.tag] + '33' }]}>
                  <Text style={[styles.badgeText, { color: TAG_COLORS[item.tag] }]}>{item.tag}</Text>
                </View>
              </View>
              <Text style={styles.freqText}>{item.frequency} MHz</Text>
              {item.tone ? <Text style={styles.toneText}>PL {item.tone}</Text> : null}
              <Text style={styles.locationText}>{item.location}</Text>
              {userLocation && item.lat != null && item.lon != null ? (
                <Text style={styles.distanceText}>
                  {haversineKm(userLocation.lat, userLocation.lon, item.lat, item.lon).toFixed(1)} km away
                </Text>
              ) : null}
              <TextInput
                style={styles.notesInput}
                value={item.notes ?? ''}
                onChangeText={(text) => handleNotesChange(item.id, text)}
                placeholder="Notes..."
                placeholderTextColor={Colors.textMuted}
                multiline
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onLongPress={() => handleDeleteRepeater(item.id, item.callsign)}
              >
                <Text style={styles.deleteButtonText}>Hold to Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Save Modal */}
      <Modal visible={saveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Save Repeater</Text>
            <Text style={styles.modalSubtitle}>
              {saveModalRepeater?.call_sign} — {saveModalRepeater?.frequency_output.toFixed(3)} MHz
            </Text>
            <Text style={styles.modalLabel}>Select Tag:</Text>
            <View style={styles.tagRow}>
              {(['Primary', 'Backup', 'ARES', 'RACES', 'Local'] as const).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { borderColor: TAG_COLORS[tag] },
                    selectedTag === tag && { backgroundColor: TAG_COLORS[tag] + '44' },
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagChipText, { color: TAG_COLORS[tag] }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveRepeater}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '44',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.warning,
    lineHeight: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryDim,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 6,
    flexWrap: 'nowrap',
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  resultCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sortToggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sortToggleText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  callSign: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '55%',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  freqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  freqText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  offsetText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  toneText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primaryDim,
    backgroundColor: Colors.primaryDim + '55',
  },
  copyButtonText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primaryDim,
    backgroundColor: Colors.primaryDim + '55',
  },
  saveButtonText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 6,
    color: Colors.textPrimary,
    fontSize: 13,
    padding: 8,
    marginTop: 8,
    minHeight: 40,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF4444' + '66',
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#FF4444',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalSave: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
