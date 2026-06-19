import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, FlatList, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { SearchBar } from '../components/SearchBar';
import { CategoryGrid } from '../components/CategoryGrid';
import { GuideCard } from '../components/GuideCard';
import { useAppStore } from '../store/useAppStore';
import { Guide } from '../db/contentLoader';
import { getAllGuides, getFieldManuals } from '../utils/guideRegistry';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { loadBookmarks, loadRecentlyViewed, recentlyViewed, isBookmarked, toggleBookmark } = useAppStore();

  useEffect(() => {
    loadBookmarks();
    loadRecentlyViewed();
  }, []);

  const allGuides = getAllGuides();
  const fieldManuals = getFieldManuals();
  const criticalGuides = allGuides.filter((g) => g.priority === 'critical').slice(0, 8);
  const recentGuides = recentlyViewed
    .map((id) => allGuides.find((g) => g.id === id))
    .filter(Boolean) as Guide[];

  return (
    <SafeAreaView style={styles.safe}>
      <EmergencyBanner />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>GRIDDOWN</Text>
            <Text style={styles.tagline}>When help is not coming.</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        </View>

        {/* Search bar — tappable */}
        <TouchableOpacity onPress={() => navigation.navigate('Search' as any)}>
          <SearchBar editable={false} onPress={() => navigation.navigate('Search' as any)} />
        </TouchableOpacity>

        {/* Critical Guides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ CRITICAL GUIDES</Text>
          <FlatList
            data={criticalGuides}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(g) => g.id}
            contentContainerStyle={{ paddingRight: 16 }}
            renderItem={({ item }) => (
              <GuideCard
                guide={item}
                compact
                onPress={() => navigation.navigate('Guide', { guideId: item.id })}
                isBookmarked={isBookmarked(item.id)}
                onBookmark={() => toggleBookmark(item.id)}
              />
            )}
          />
        </View>

        {/* Field Manuals Row */}
        {fieldManuals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-half" size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.sectionTitle}>FIELD MANUALS</Text>
            </View>
            <FlatList
              data={fieldManuals}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(g) => g.id}
              contentContainerStyle={{ paddingRight: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.fmCard}
                  onPress={() => navigation.navigate('Guide', { guideId: item.id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.fmBadge}>
                    <Text style={styles.fmBadgeText}>US ARMY</Text>
                  </View>
                  <Text style={styles.fmTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.fmCategory}>{item.category.toUpperCase()}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Category grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 CATEGORIES</Text>
          <CategoryGrid onSelectCategory={(cat) => navigation.navigate('Category', { categoryId: cat })} />
        </View>

        {/* Recently Viewed */}
        {recentGuides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 RECENTLY VIEWED</Text>
            {recentGuides.slice(0, 5).map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onPress={() => navigation.navigate('Guide', { guideId: guide.id })}
                isBookmarked={isBookmarked(guide.id)}
                onBookmark={() => toggleBookmark(guide.id)}
              />
            ))}
          </View>
        )}

        {/* Footer */}
        <TouchableOpacity style={styles.founderBtn} onPress={() => navigation.navigate('Founder')}>
          <Text style={styles.founderText}>🎖️ 100% Veteran-Owned — BannedProduct Media Inc.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  appName: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offlineText: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: { marginTop: 24, gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // Field Manual cards
  fmCard: {
    width: 180,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginRight: 10,
    gap: 8,
    minHeight: 110,
  },
  fmBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondaryDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  fmBadgeText: {
    color: Colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fmTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  fmCategory: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  founderBtn: {
    marginTop: 32,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  founderText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
