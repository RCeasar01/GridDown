import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StyleSheet, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { DrillStackParamList } from '../navigation/AppNavigator';
import {
  getCategoryReadiness, getOverallReadiness, getTodayDrillState,
} from '../db/contentLoader';
import { getDrillInfo } from '../utils/dailyDrill';

const FREE_CATEGORIES = ['water', 'fire', 'shelter'];

const CATEGORY_INFO = [
  { id: 'water', label: 'Water', icon: 'water-outline', count: 5 },
  { id: 'fire', label: 'Fire', icon: 'flame-outline', count: 4 },
  { id: 'shelter', label: 'Shelter', icon: 'home-outline', count: 5 },
  { id: 'food', label: 'Food & Foraging', icon: 'leaf-outline', count: 4 },
  { id: 'medical', label: 'Medical', icon: 'medkit-outline', count: 8 },
  { id: 'navigation', label: 'Navigation', icon: 'compass-outline', count: 4 },
  { id: 'comms', label: 'Comms & Signal', icon: 'radio-outline', count: 3 },
  { id: 'security', label: 'Security', icon: 'shield-outline', count: 4 },
  { id: 'vehicle', label: 'Vehicle', icon: 'car-outline', count: 4 },
  { id: 'homesteading', label: 'Homesteading', icon: 'construct-outline', count: 3 },
  { id: 'field-manuals', label: 'Field Manuals', icon: 'book-outline', count: 4 },
  { id: 'disaster', label: 'Disaster', icon: 'warning-outline', count: 5 },
];

type Nav = NativeStackNavigationProp<DrillStackParamList, 'DrillMain'>;

export function DrillScreen() {
  const navigation = useNavigation<Nav>();
  const { hasAccess } = useAppStore();
  const drillInfo = getDrillInfo();

  const [readiness, setReadiness] = useState<Record<string, number>>({});
  const [overallReadiness, setOverallReadiness] = useState(0);
  const [drillState, setDrillState] = useState<{ completed: boolean; score: number | null }>({
    completed: false, score: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const overall = await getOverallReadiness();
        setOverallReadiness(overall);
        const scores: Record<string, number> = {};
        for (const cat of CATEGORY_INFO) {
          scores[cat.id] = await getCategoryReadiness(cat.id);
        }
        setReadiness(scores);
        const drill = await getTodayDrillState();
        if (drill) {
          setDrillState({ completed: drill.completed === 1, score: drill.score });
        }
      } catch (e) {
        console.error('DrillScreen load error:', e);
      }
    };
    load();
  }, []);

  const handleCategoryPress = useCallback((catId: string) => {
    const isFree = FREE_CATEGORIES.includes(catId);
    if (isFree || hasAccess('monthly')) {
      navigation.navigate('QuizPlay', { category: catId });
    } else {
      Alert.alert(
        'Upgrade Required',
        'Full quiz access requires a subscription.',
        [{ text: 'Cancel', style: 'cancel' }],
      );
    }
  }, [hasAccess, navigation]);

  const renderCategoryCard = ({ item }: { item: typeof CATEGORY_INFO[0] }) => {
    const isFree = FREE_CATEGORIES.includes(item.id);
    const locked = !isFree && !hasAccess('monthly');
    const score = readiness[item.id] ?? 0;
    const iconColor = locked ? Colors.textMuted : Colors.primary;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.75}
      >
        <Ionicons name={item.icon as any} size={24} color={iconColor} />
        <Text style={[styles.categoryLabel, locked && { color: Colors.textMuted }]}>
          {item.label}
        </Text>
        <Text style={styles.categoryCount}>{item.count} quizzes</Text>
        <View style={styles.readinessBarBg}>
          <View style={[styles.readinessBarFill, { width: `${score}%` as any }]} />
        </View>
        <Text style={styles.readinessPct}>{score}%</Text>
        {locked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const readinessColor =
    overallReadiness >= 80 ? Colors.success :
    overallReadiness >= 50 ? Colors.primary : Colors.danger;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>READINESS DRILL</Text>
          <View style={[styles.readinessBadge, { borderColor: readinessColor }]}>
            <Text style={[styles.readinessBadgeText, { color: readinessColor }]}>
              {overallReadiness}%
            </Text>
          </View>
        </View>

        {/* Daily Drill Card */}
        <TouchableOpacity
          style={styles.drillCard}
          onPress={() => navigation.navigate('QuizPlay', {
            quizId: drillInfo.quizId, isDailyDrill: true,
          })}
          activeOpacity={0.8}
        >
          <Text style={styles.drillLabel}>🎯 TODAY'S DRILL</Text>
          <Text style={styles.drillTitle}>{drillInfo.title}</Text>
          <View style={styles.drillBadgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{drillInfo.category}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{drillInfo.difficulty}</Text></View>
            <View style={styles.badge}><Text style={styles.badgeText}>{drillInfo.format}</Text></View>
          </View>
          {drillState.completed ? (
            <View style={styles.drillCompletedRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.drillCompletedText}>
                COMPLETED — Score: {drillState.score ?? 0}%
              </Text>
            </View>
          ) : (
            <View style={styles.drillStartBtn}>
              <Text style={styles.drillStartText}>START DRILL</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>CATEGORIES</Text>

        <FlatList
          data={CATEGORY_INFO}
          renderItem={renderCategoryCard}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700',
    color: Colors.textPrimary, letterSpacing: 1,
  },
  readinessBadge: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  readinessBadgeText: { fontSize: 14, fontWeight: '700' },
  drillCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    borderRadius: 10, padding: 14, marginBottom: 20,
  },
  drillLabel: {
    fontSize: 11, fontWeight: '700',
    color: Colors.primary, letterSpacing: 1, marginBottom: 4,
  },
  drillTitle: {
    fontSize: 15, fontWeight: '600',
    color: Colors.textPrimary, marginBottom: 8,
  },
  drillBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  badge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  drillStartBtn: {
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingVertical: 9, alignItems: 'center',
  },
  drillStartText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  drillCompletedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  drillCompletedText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 12,
  },
  columnWrapper: { gap: 10, marginBottom: 10 },
  categoryCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 10, padding: 12, minHeight: 130, overflow: 'hidden',
  },
  categoryLabel: {
    fontSize: 13, fontWeight: '600',
    color: Colors.textPrimary, marginTop: 8, marginBottom: 2,
  },
  categoryCount: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  readinessBarBg: {
    height: 3, backgroundColor: Colors.surfaceBorder,
    borderRadius: 2, marginBottom: 4,
  },
  readinessBarFill: { height: 3, backgroundColor: Colors.success, borderRadius: 2 },
  readinessPct: { fontSize: 11, color: Colors.textSecondary },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,13,13,0.6)',
    justifyContent: 'center', alignItems: 'center', borderRadius: 10,
  },
});
