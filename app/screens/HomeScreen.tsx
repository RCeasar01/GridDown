/**
 * Home — "Lean" layout (design canvas, Oct 2026).
 *
 * Order of importance, top to bottom: Emergency Mode (one big control, no banner strips),
 * Today's Drill (the single hero CTA), the readiness scan as a quiet row, three quick-access
 * tiles, Real-World Flows, recently viewed, footer. Built from components/ui so the whole
 * screen restyles from one place.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { UnlockAllBanner } from '../components/FeatureGate';
import { GuideCard } from '../components/GuideCard';
import { Button, Card, Icon, IconButton, SectionHeader, Space, Tile } from '../components/ui';
import { useAppStore } from '../store/useAppStore';
import { Guide } from '../db/contentLoader';
import { getAllGuides } from '../utils/guideRegistry';
import { getDrillInfo } from '../utils/dailyDrill';
import { getTodayDrillState } from '../db/contentLoader';
import { getLatestReadinessScan } from '../db/readinessScan';
import { getAllFlows, Flow } from '../utils/flowRegistry';
import { formatQuizFormat, titleCase } from '../utils/labels';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { loadBookmarks, loadRecentlyViewed, recentlyViewed, isBookmarked, toggleBookmark, nightOpsEnabled, toggleNightOps } = useAppStore();

  const [drillInfo] = useState(() => getDrillInfo());
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [drillScore, setDrillScore] = useState<number | null>(null);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);

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
    getLatestReadinessScan()
      .then((scan) => setReadinessScore(scan ? scan.overall_score : null))
      .catch(() => {});
  }, []);

  const allGuides = getAllGuides();
  const recentGuides = recentlyViewed
    .map((id) => allGuides.find((g) => g.id === id))
    .filter(Boolean)
    .slice(0, 3) as Guide[];
  const flows = getAllFlows();

  // Cross-tab jumps: the root tab navigator isn't in HomeStackParamList, so these go through
  // the loosely-typed navigate the existing screens already use.
  const nav = navigation as unknown as { navigate: (name: string, params?: object) => void };
  const goTools = (screen: string) => nav.navigate('Tools', { screen });

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <UnlockAllBanner />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.appName} accessibilityRole="header">
              GRID DOWN <Text style={styles.appNameAccent}>SURVIVAL</Text>
            </Text>
            <Text style={styles.tagline}>When help is not coming.</Text>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon={nightOpsEnabled ? 'moonFilled' : 'moon'}
              color={nightOpsEnabled ? Colors.primary : Colors.textSecondary}
              onPress={() => void toggleNightOps()}
              accessibilityLabel={nightOpsEnabled ? 'Turn off Night Ops mode' : 'Turn on Night Ops mode'}
            />
            <IconButton
              icon="search"
              onPress={() => nav.navigate('Learn', { screen: 'Search' })}
              accessibilityLabel="Search guides"
            />
          </View>
        </View>

        {/* Emergency Mode — the one control that must be findable in a panic */}
        <TouchableOpacity
          style={styles.emergency}
          onPress={() => navigation.navigate('EmergencyMode')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Emergency Mode"
          accessibilityHint="Opens large-print crisis cards: bleeding, CPR, shock, SOS and your coordinates"
        >
          <Icon name="alert" size={28} color={Colors.background} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>EMERGENCY MODE</Text>
            <Text style={styles.emergencySub}>Bleeding · CPR · Shock · SOS · Your coordinates</Text>
          </View>
        </TouchableOpacity>

        {/* Today's Drill — the hero */}
        {drillInfo.quizId ? (
          <View style={styles.section}>
            <SectionHeader
              title="TODAY'S DRILL"
              tone="accent"
              right={`${titleCase(drillInfo.category)} · ${titleCase(drillInfo.difficulty)}`}
            />
            <Card>
              <Text style={styles.drillTitle} numberOfLines={3}>{drillInfo.title}</Text>
              <View style={styles.drillFooter}>
                <Text style={styles.drillMeta}>
                  {drillCompleted && drillScore !== null
                    ? `Completed · ${drillScore}%`
                    : `${formatQuizFormat(drillInfo.format)} · 2 min`}
                </Text>
                {drillCompleted ? (
                  <View style={styles.doneBadge}>
                    <Icon name="checkCircle" size={16} color={Colors.primary} />
                    <Text style={styles.doneText}>DONE</Text>
                  </View>
                ) : (
                  <Button
                    label="START"
                    onPress={() => nav.navigate('Drill', { screen: 'QuizPlay', params: { quizId: drillInfo.quizId, isDailyDrill: true } })}
                    accessibilityLabel="Start today's drill"
                  />
                )}
              </View>
            </Card>
          </View>
        ) : null}

        {/* Readiness scan — one quiet row */}
        <Card tone="subtle" onPress={() => goTools('ReadinessScan')} style={styles.readinessRow} accessibilityLabel="72-Hour Readiness Scan" accessibilityHint="50 questions, builds your prep plan">
          <View style={styles.ring}>
            <Text style={styles.ringText}>{readinessScore === null ? '—' : `${readinessScore}`}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.rowTitle}>72-Hour Readiness Scan</Text>
            <Text style={styles.rowSub}>
              {readinessScore === null ? '50 questions · builds your prep plan' : 'See your gaps and what to fix first'}
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={Colors.textSecondary} />
        </Card>

        {/* Quick access */}
        <View style={styles.section}>
          <SectionHeader title="QUICK ACCESS" />
          <View style={styles.quickRow}>
            <Tile icon="backpack" label="My Kit" layout="column" onPress={() => navigation.navigate('MyKit')} style={styles.quickTile} />
            <Tile icon="compass" label="Position" layout="column" onPress={() => goTools('Map')} style={styles.quickTile} />
            <Tile icon="advisor" label="Advisor" layout="column" onPress={() => goTools('Advisor')} style={styles.quickTile} />
          </View>
        </View>

        {/* Real-World Flows */}
        <View style={styles.section}>
          <SectionHeader title="REAL-WORLD FLOWS" actionLabel="See all" onAction={() => navigation.navigate('Flows')} />
          <FlatList
            data={flows}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f.id}
            contentContainerStyle={{ gap: Space.sm + 2, paddingRight: Space.lg }}
            renderItem={({ item }: { item: Flow }) => (
              <Card onPress={() => navigation.navigate('Flows')} style={styles.flowCard} accessibilityLabel={`${item.title}, ${item.steps.length} steps`}>
                <Text style={styles.flowMeta}>{item.estimatedTime}</Text>
                <Text style={styles.flowTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.flowMeta}>{item.steps.length} steps</Text>
              </Card>
            )}
          />
        </View>

        {/* Recently viewed */}
        {recentGuides.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="RECENTLY VIEWED" />
            {recentGuides.map((guide) => (
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

        <TouchableOpacity style={styles.founderBtn} onPress={() => navigation.navigate('Founder')} accessibilityRole="button" accessibilityLabel="About the founder">
          <Text style={styles.founderText}>100% Veteran-Owned — BannedProduct Media Inc.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Space.xl, paddingTop: Space.sm, paddingBottom: 32, gap: Space.xl + 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appName: { color: Colors.textPrimary, fontSize: 19, fontWeight: '900', letterSpacing: 2.5 },
  appNameAccent: { color: Colors.primary },
  tagline: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: Space.sm, flexShrink: 0 },

  emergency: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 18, minHeight: 64 },
  emergencyTitle: { color: Colors.background, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  emergencySub: { color: Colors.background, fontSize: 12, fontWeight: '600', opacity: 0.8, marginTop: 2 },

  section: { gap: 0 },
  drillTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', lineHeight: 23 },
  drillFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  drillMeta: { color: Colors.textSecondary, fontSize: 12 },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: { color: Colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' },
  ringText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  rowTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  rowSub: { color: Colors.textSecondary, fontSize: 12 },

  quickRow: { flexDirection: 'row', gap: Space.sm + 2 },
  quickTile: { flex: 1, minHeight: 84 },

  flowCard: { width: 150, gap: 8, padding: 14 },
  flowTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  flowMeta: { color: Colors.textSecondary, fontSize: 11 },

  founderBtn: { paddingVertical: 12, alignItems: 'center' },
  founderText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
});
