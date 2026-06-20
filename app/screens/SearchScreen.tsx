import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet,
  SafeAreaView, SectionList, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { SearchBar } from '../components/SearchBar';
import { GuideCard } from '../components/GuideCard';
import { useAppStore } from '../store/useAppStore';
import { categoryIcon } from '../utils/helpers';
import { CATEGORY_LABELS } from '../components/CategoryGrid';
import { searchGroupedByCategory } from '../utils/search';
import { Guide } from '../db/contentLoader';

type SearchFilter = 'all' | 'children';

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<SearchFilter>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isBookmarked, toggleBookmark } = useAppStore();

  // 150ms debounce on keystrokes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const rawGrouped = debouncedQuery.trim()
    ? searchGroupedByCategory(debouncedQuery)
    : [];

  const grouped = searchFilter === 'children'
    ? rawGrouped.map(({ category, guides }) => ({
        category,
        guides: guides.filter(
          (g) => g.category === 'children' || g.tags?.includes('child-safety') || g.tags?.includes('children'),
        ),
      })).filter(({ guides }) => guides.length > 0)
    : rawGrouped;

  const sections = grouped.map(({ category, guides }) => ({
    title: category,
    data: guides as Guide[],
  }));

  const totalResults = grouped.reduce((sum, g) => sum + g.guides.length, 0);

  const navigateToGuide = (guideId: string) => {
    navigation.navigate('Home', { screen: 'Guide', params: { guideId } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          autoFocus
          editable
          onClear={() => {
            setQuery('');
            setDebouncedQuery('');
          }}
          placeholder="Search guides, skills, topics..."
        />
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(['all', 'children'] as SearchFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, searchFilter === f && styles.filterChipActive]}
            onPress={() => setSearchFilter(f)}
          >
            <Text style={[styles.filterChipText, searchFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All Guides' : '👧 For Children'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {query.length === 0 ? (
        <View style={styles.promptContainer}>
          <Text style={styles.promptIcon}>🔍</Text>
          <Text style={styles.promptTitle}>Search all guides</Text>
          <Text style={styles.promptSub}>
            100% offline — all content is on your device.{'\n'}
            Search by title, topic, or tag.
          </Text>
        </View>
      ) : totalResults === 0 ? (
        <View style={styles.promptContainer}>
          <Text style={styles.promptIcon}>📭</Text>
          <Text style={styles.promptTitle}>No results for "{debouncedQuery}"</Text>
          <Text style={styles.promptSub}>Try a different term or check your spelling.</Text>
        </View>
      ) : (
        <>
          <View style={styles.resultsMeta}>
            <Text style={styles.resultsCount}>
              {totalResults} result{totalResults !== 1 ? 's' : ''} for "{debouncedQuery}"
            </Text>
          </View>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{categoryIcon(section.title)}</Text>
                <Text style={styles.sectionTitle}>
                  {CATEGORY_LABELS[section.title] ?? section.title.toUpperCase()} — {section.data.length}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <GuideCard
                guide={item}
                onPress={() => navigateToGuide(item.id)}
                isBookmarked={isBookmarked(item.id)}
                onBookmark={() => toggleBookmark(item.id)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { padding: 16, paddingBottom: 8 },
  promptContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  promptIcon: { fontSize: 48, marginBottom: 16 },
  promptTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  promptSub: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  resultsMeta: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsCount: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  list: { padding: 16, paddingTop: 4, paddingBottom: 48 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  filterChipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: Colors.primary },
});
