import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, FlatList, SafeAreaView, Animated,
} from 'react-native';
import { getLatestReadinessScan } from '../db/readinessScan';
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
import { getDrillInfo } from '../utils/dailyDrill';
import { getTodayDrillState } from '../db/contentLoader';
import { getAllFlows, Flow } from '../utils/flowRegistry';
import { calculatePrepLevel, PrepLevel } from '../utils/prepLevel';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { loadBookmarks, loadRecentlyViewed, recentlyViewed, isBookmarked, toggleBookmark, nightOpsEnabled, toggleNightOps } = useAppStore();

  const [drillInfo] = useState(() => getDrillInfo());
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [drillScore, setDrillScore] = useState<number | null>(null);
  const [readinessScan, setReadinessScan] = useState<{ overall_score: number } | null>(null);
  const [prepLevel, setPrepLevel] = useState<PrepLevel | null>(null);

  // Pulsing animation for emergency button border
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    loadBookmarks();
    loadRecentlyViewed();
    getTodayDrillState()
      .then((state) => {
        if (state?.completed) {
          setDrillCompleted(true);
          setDrillScore(state.score ?? null);
        }
      })
      .catch(() => {});
    getLatestReadinessScan().then(setReadinessScan).catch(() => {});
    calculatePrepLevel().then((status) => setPrepLevel(status.currentLevel)).catch(() => {});

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const allGuides = getAllGuides();
  const fieldManuals = getFieldManuals();
  const criticalGuides = allGuides.filter((g) => g.priority === 'critical').slice(0, 8);
  const recentGuides = recentlyViewed
    .map((id) => allGuides.find((g) => g.id === id))
    .filter(Boolean) as Guide[];

  const flows = getAllFlows();

  return (
    <SafeAreaView style={styles.safe}>
      <EmergencyBanner />

      {/* ── EMERGENCY MODE BUTTON ── */}
      <Animated.View style={[styles.emergencyWrapper, { opacity: pulseAnim }]}>
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => navigation.navigate('EmergencyMode')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Emergency Mode"
          accessibilityHint="Opens full-screen emergency reference screen"
        >
          <Text style={styles.emergencyBtnText}>⚠  EMERGENCY MODE</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>GRIDDOWN</Text>
            <Text style={styles.tagline}>When help is not coming.</Text>
            {prepLevel && (
              <View style={[styles.levelBadge, { borderColor: prepLevel.color + '60' }]}>
                <Ionicons name={prepLevel.icon as any} size={10} color={prepLevel.color} />
                <Text style={[styles.levelBadgeText, { color: prepLevel.color }]}>
                  {prepLevel.name.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => void toggleNightOps()}
              style={styles.nightOpsBtn}
              accessibilityLabel="Toggle Night Ops Mode"
            >
              <Ionicons
                name={nightOpsEnabled ? 'moon' : 'moon-outline'}
                size={20}
                color={nightOpsEnabled ? '#B85020' : Colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          </View>
        </View>

        {/* Search bar — tappable */}
        <TouchableOpacity onPress={() => navigation.navigate('Learn' as any, { screen: 'Search' })}>
          <SearchBar editable={false} onPress={() => navigation.navigate('Learn' as any, { screen: 'Search' })} />
        </TouchableOpacity>

        {/* TODAY'S DRILL CARD */}
        {drillInfo.quizId ? (
          <TouchableOpacity
            style={styles.drillCard}
            onPress={() => {
              if (!drillCompleted) {
                navigation.navigate('Drill' as any, {
                  screen: 'QuizPlay',
                  params: { quizId: drillInfo.quizId, isDailyDrill: true },
                });
              }
            }}
            activeOpacity={drillCompleted ? 1 : 0.7}
          >
            <View style={styles.drillHeader}>
              <Text style={styles.drillLabel}>🎯 TODAY'S DRILL</Text>
              {drillCompleted && (
                <Text style={styles.drillCompletedTag}>✓ COMPLETED</Text>
              )}
            </View>
            <Text style={styles.drillMeta}>
              {drillInfo.category.toUpperCase()} · {drillInfo.difficulty.toUpperCase()} ·{' '}
              {drillInfo.format.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.drillTitle} numberOfLines={2}>
              {drillInfo.title}
            </Text>
            {drillCompleted && drillScore !== null ? (
              <Text style={styles.drillScore}>Score: {drillScore}%</Text>
            ) : (
              <View style={styles.drillStartBtn}>
                <Text style={styles.drillStartBtnText}>START DRILL</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        {/* READINESS SCAN CARD */}
        <TouchableOpacity
          style={[styles.readinessCard, readinessScan ? styles.readinessCardDone : styles.readinessCardNew]}
          onPress={() => navigation.navigate('Tools' as any, { screen: 'ReadinessScan' })}
          activeOpacity={0.8}
        >
          <View style={styles.readinessRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.readinessLabel}>
                {readinessScan ? '🎯 YOUR READINESS SCORE' : '🎯 72-HOUR READINESS SCAN'}
              </Text>
              <Text style={styles.readinessTitle}>
                {readinessScan
                  ? `${readinessScan.overall_score}/100 — Tap to Update`
                  : 'Take Your Readiness Scan'}
              </Text>
              <Text style={styles.readinessSub}>
                {readinessScan
                  ? 'See your gaps and recommended actions'
                  : '50 questions · 3-4 minutes · Builds your personal prep plan'}
              </Text>
            </View>
            {readinessScan && (
              <View style={[
                styles.scoreBadge,
                { backgroundColor: readinessScan.overall_score >= 71 ? '#1E3325' : readinessScan.overall_score >= 41 ? '#2A200A' : '#2A1A0D' }
              ]}>
                <Text style={[
                  styles.scoreBadgeText,
                  { color: readinessScan.overall_score >= 71 ? '#4A7C59' : readinessScan.overall_score >= 41 ? '#D4A017' : '#8B9E67' }
                ]}>{readinessScan.overall_score}</Text>
              </View>
            )}
          </View>
          {!readinessScan && (
            <View style={styles.readinessStartBtn}>
              <Text style={styles.readinessStartBtnText}>START SCAN →</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* QUICK ACTIONS ROW */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Tools' as any, { screen: 'FamilyPlanner' })}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionEmoji}>👨‍👩‍👧</Text>
            <Text style={styles.quickActionLabel}>Family Plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Tools' as any, { screen: 'GearInventory' })}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionEmoji}>🎽</Text>
            <Text style={styles.quickActionLabel}>Gear Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Tools' as any, { screen: 'KnotGuide' })}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionEmoji}>🪢</Text>
            <Text style={styles.quickActionLabel}>Knot Guide</Text>
          </TouchableOpacity>
        </View>

        {/* REAL-WORLD FLOWS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REAL-WORLD FLOWS</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Flows')}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>SEE ALL</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={flows}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ paddingRight: 16 }}
            renderItem={({ item }: { item: Flow }) => (
              <TouchableOpacity
                style={styles.flowChip}
                onPress={() => navigation.navigate('Flows')}
                activeOpacity={0.75}
              >
                <View style={[styles.flowChipIcon, { backgroundColor: item.color + '33' }]}>
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text style={styles.flowChipTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.flowChipMeta}>{item.steps.length} steps</Text>
              </TouchableOpacity>
            )}
          />
        </View>

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
  // Emergency button
  emergencyWrapper: {
    marginHorizontal: 0,
  },
  emergencyBtn: {
    backgroundColor: '#8B9E67',
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nightOpsBtn: {
    padding: 4,
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
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  levelBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
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
  // Daily Drill card
  drillCard: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primaryDim,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  drillLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  drillCompletedTag: {
    color: Colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drillMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  drillTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  drillScore: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  drillStartBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  drillStartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // Readiness scan card
  readinessCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  readinessCardNew: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryDim,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  readinessCardDone: {
    backgroundColor: Colors.surface,
    borderColor: Colors.secondaryDim,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readinessLabel: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  readinessTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  readinessSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreBadgeText: {
    fontSize: 20,
    fontWeight: '900',
  },
  readinessStartBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  readinessStartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  // Quick actions row
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  quickActionEmoji: {
    fontSize: 22,
  },
  quickActionLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  // See all link
  seeAllBtn: {
    marginLeft: 'auto',
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Flow compact chips for HomeScreen
  flowChip: {
    width: 130,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 12,
    marginRight: 10,
    gap: 8,
  },
  flowChipIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowChipTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  flowChipMeta: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
