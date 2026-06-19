import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { GuideCard } from '../components/GuideCard';
import { useAppStore } from '../store/useAppStore';
import { categoryIcon, categoryDescription } from '../utils/helpers';
import { CATEGORY_LABELS } from '../components/CategoryGrid';
import { getGuidesByCategory } from '../utils/guideRegistry';
import { Guide } from '../db/contentLoader';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Category'>;
type Route = RouteProp<HomeStackParamList, 'Category'>;

type Filter = 'all' | 'critical' | 'beginner' | 'advanced';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'beginner', label: 'Beginner' },
];

const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  advanced: 1,
  beginner: 2,
};

function sortGuides(guides: Guide[]): Guide[] {
  return [...guides].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99),
  );
}

export function CategoryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { categoryId } = route.params;
  const [filter, setFilter] = useState<Filter>('all');
  const { isBookmarked, toggleBookmark } = useAppStore();

  const rawGuides = getGuidesByCategory(categoryId);

  const filtered = useMemo(() => {
    const subset = filter === 'all' ? rawGuides : rawGuides.filter((g) => g.priority === filter);
    return sortGuides(subset);
  }, [rawGuides, filter]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${CATEGORY_LABELS[categoryId] ?? categoryId}`,
    });
  }, [categoryId]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Category header */}
      <View style={styles.header}>
        <Text style={styles.icon}>{categoryIcon(categoryId)}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title}>{CATEGORY_LABELS[categoryId] ?? categoryId}</Text>
          <Text style={styles.description}>{categoryDescription(categoryId)}</Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{filtered.length}</Text>
        </View>
      </View>

      {/* Guide list */}
      <FlatList
        data={filtered}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No guides match this filter.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <GuideCard
            guide={item}
            onPress={() => navigation.navigate('Guide', { guideId: item.id })}
            isBookmarked={isBookmarked(item.id)}
            onBookmark={() => toggleBookmark(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 36 },
  headerText: { flex: 1, gap: 4 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  countBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  list: { padding: 16, gap: 10, paddingBottom: 48 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
