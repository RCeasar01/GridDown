// TODO: Lock to Monthly+ tier via useAppStore
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import repeaterData from '../assets/content/ham-repeaters.json';

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

const USE_COLORS: Record<string, string> = {
  OPEN: Colors.secondary,
  ARES: Colors.primary,
  RACES: '#4A6FA5',
  SKYWARN: Colors.warning,
  CLUB: '#8B5CF6',
  CLOSED: Colors.textMuted,
};

export function HamRadioScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<UseFilter>('ALL');

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

      const matchesFilter =
        activeFilter === 'ALL' || r.use === activeFilter;

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

    return results;
  }, [searchText, activeFilter]);

  const handleCopyFreq = (repeater: Repeater) => {
    const freqStr = `${repeater.frequency_output.toFixed(3)} MHz`;
    Clipboard.setString(freqStr);
    Alert.alert('Copied', `${freqStr} copied to clipboard`);
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
          <Text style={styles.freqText}>
            {item.frequency_output.toFixed(3)} MHz
          </Text>
          <Text style={styles.offsetText}>({item.offset} MHz)</Text>
          <Text style={styles.toneText}>  PL {item.tone_ctcss.toFixed(1)}</Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.locationText}>{item.city}, {item.state}</Text>
        </View>

        {item.notes ? (
          <Text style={styles.notesText}>{item.notes}</Text>
        ) : null}

        <TouchableOpacity style={styles.copyButton} onPress={() => handleCopyFreq(item)}>
          <Ionicons name="copy-outline" size={13} color={Colors.primary} />
          <Text style={styles.copyButtonText}>Copy Freq</Text>
        </TouchableOpacity>
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

      {/* Result Count */}
      <View style={styles.resultCountRow}>
        <Text style={styles.resultCount}>
          {filteredData.length} repeater{filteredData.length !== 1 ? 's' : ''}
        </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 12,
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
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  resultCount: {
    fontSize: 12,
    color: Colors.textMuted,
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primaryDim,
    backgroundColor: Colors.primaryDim + '55',
    marginTop: 2,
  },
  copyButtonText: {
    fontSize: 11,
    color: Colors.primary,
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
});
