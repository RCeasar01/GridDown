import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  StyleSheet, Alert, Share, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { DrillStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { getCategoryReadiness, getKits, addGuideToKit, KitRow } from '../db/contentLoader';
import { getQuizById } from '../utils/quizRegistry';
import { getGuideById } from '../utils/guideRegistry';
import { MultipleChoiceQuiz, PriorityOrderQuiz } from '../types/quiz';

type RouteType = RouteProp<DrillStackParamList, 'QuizResult'>;

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// Static map of category → guide IDs for the "pin to kit" feature.
// Falls back to relatedGuide fields extracted from missed questions.
const CATEGORY_GUIDE_MAP: Record<string, string[]> = {
  medical:    ['medical-001', 'medical-002', 'medical-003', 'medical-004'],
  water:      ['water-001', 'water-002'],
  shelter:    ['shelter-001', 'shelter-002'],
  comms:      ['comms-001', 'comms-002', 'comms-003'],
  fire:       ['fire-001'],
  navigation: ['navigation-001', 'navigation-002'],
  security:   ['security-001'],
  food:       ['food-001'],
  vehicle:    ['vehicle-001'],
  disaster:   ['disaster-001', 'disaster-002', 'disaster-003', 'disaster-004'],
};

export default function QuizResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const { category, total, correct, timeTaken, missedQuizIds } = route.params;

  // ── Core state ──────────────────────────────────────────────────────────────
  const [categoryReadiness, setCategoryReadiness] = useState<number | null>(null);
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
  const [reminderScheduled, setReminderScheduled] = useState(false);
  const [kitAdded, setKitAdded] = useState(false);
  const [kits, setKits] = useState<KitRow[]>([]);
  const [showKitPicker, setShowKitPicker] = useState(false);

  // ── Load data on mount ───────────────────────────────────────────────────────
  useEffect(() => {
    getCategoryReadiness(category).then(setCategoryReadiness).catch(() => {});
    getKits().then(setKits).catch(() => {});
  }, [category]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreColor =
    accuracy >= 80 ? Colors.success :
    accuracy >= 50 ? Colors.primary : Colors.danger;

  const missedQuizzes = missedQuizIds
    .map(id => getQuizById(id))
    .filter(Boolean) as (MultipleChoiceQuiz | PriorityOrderQuiz)[];

  // Related guides: static map first, then fall back to relatedGuide on missed questions
  const relatedGuides = useMemo(() => {
    const fromMap = CATEGORY_GUIDE_MAP[category?.toLowerCase()] ?? [];
    if (fromMap.length > 0) return fromMap;
    return missedQuizzes
      .map(q => (q as MultipleChoiceQuiz & { relatedGuide?: string }).relatedGuide)
      .filter((g): g is string => !!g)
      .filter((v, i, a) => a.indexOf(v) === i);
  }, [category, missedQuizzes]);

  // ── Kit handlers ─────────────────────────────────────────────────────────────
  function toggleGuideSelection(guideId: string) {
    setSelectedGuides(prev =>
      prev.includes(guideId) ? prev.filter(id => id !== guideId) : [...prev, guideId]
    );
  }

  async function addSelectedGuidesToKit() {
    if (selectedGuides.length === 0) return;
    if (kits.length === 1) {
      await commitGuidesToKit(kits[0].id);
    } else if (kits.length > 1) {
      setShowKitPicker(true);
    } else {
      Alert.alert('No Kits', 'Create a Kit in My Kit first.');
    }
  }

  async function commitGuidesToKit(kitId: string) {
    await Promise.all(selectedGuides.map(gId => addGuideToKit(kitId, gId)));
    setKitAdded(true);
    setShowKitPicker(false);
    setSelectedGuides([]);
    Alert.alert('Added to Kit', `${selectedGuides.length} guide(s) added.`);
  }

  // ── Notification handler ─────────────────────────────────────────────────────
  async function scheduleReviewReminder() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions Required', 'Enable notifications in Settings to use reminders.');
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'GridDown Daily Drill',
          body: `Review your ${category} quiz — keep your skills sharp!`,
        },
        trigger: { seconds: 3 * 24 * 60 * 60 },
      });
      setReminderScheduled(true);
    } catch {
      Alert.alert('Reminder Scheduled', 'You will be reminded to review in 3 days.');
      setReminderScheduled(true);
    }
  }

  // ── Share handler ────────────────────────────────────────────────────────────
  async function shareResult() {
    const percent = Math.round((correct / total) * 100);
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    await Share.share({
      message: `GridDown Readiness — ${categoryName.toUpperCase()}: ${percent}% — Daily Drill completed\nTrain for when help isn't coming. griddown.app`,
    });
  }

  // ── Kit picker modal ─────────────────────────────────────────────────────────
  const kitPickerModal = (
    <Modal
      visible={showKitPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowKitPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Choose a Kit</Text>
          <FlatList
            data={kits}
            keyExtractor={k => k.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.kitPickerRow}
                onPress={() => commitGuidesToKit(item.id)}
              >
                <Text style={styles.kitPickerIcon}>{item.icon ?? '🎒'}</Text>
                <Text style={styles.kitPickerName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={() => setShowKitPicker(false)}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Score Header */}
        <View style={styles.scoreCard}>
          <Text style={[styles.scorefraction, { color: scoreColor }]}>
            {correct} / {total}
          </Text>
          <Text style={[styles.accuracyPct, { color: scoreColor }]}>{accuracy}% Accuracy</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{formatTime(timeTaken)}</Text>
            </View>
            {categoryReadiness !== null && (
              <View style={styles.metaItem}>
                <Ionicons name="bar-chart-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>Category Readiness: {categoryReadiness}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Missed Quizzes */}
        {missedQuizzes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MISSED QUESTIONS ({missedQuizzes.length})</Text>
            {missedQuizzes.map(q => {
              const scenario = (q as MultipleChoiceQuiz).scenario ?? (q as PriorityOrderQuiz).scenario ?? '';
              const correctAnswer = q.type === 'multiple_choice'
                ? (q as MultipleChoiceQuiz).options.find(o => o.id === (q as MultipleChoiceQuiz).correct)?.text ?? ''
                : (q as PriorityOrderQuiz).correct_order.join(' → ');
              return (
                <View key={q.id} style={styles.missedCard}>
                  <Text style={styles.missedScenario}>{truncate(scenario, 80)}</Text>
                  <View style={styles.correctRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
                    <Text style={styles.correctText}>{truncate(correctAnswer, 80)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.replace('QuizPlay', { category, isDailyDrill: false })}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
            <Text style={styles.outlineBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filledBtn}
            onPress={() => navigation.navigate('DrillMain')}
          >
            <Text style={styles.filledBtnText}>Back to Categories</Text>
          </TouchableOpacity>
        </View>

        {/* ── Section 1: Pin Guides to My Kit ─────────────────────────────── */}
        {relatedGuides.length > 0 && (
          <View style={styles.actionSection}>
            <Text style={styles.actionTitle}>Pin Guides to Your Kit?</Text>
            <Text style={styles.actionSubtitle}>Add guides from this quiz to keep them handy</Text>

            {relatedGuides.map(guideId => {
              const guide = getGuideById(guideId);
              const checked = selectedGuides.includes(guideId);
              return (
                <TouchableOpacity
                  key={guideId}
                  style={styles.guideRow}
                  onPress={() => toggleGuideSelection(guideId)}
                  accessibilityLabel={`${checked ? 'Unselect' : 'Select'} guide: ${guide?.title ?? guideId}`}
                  accessibilityRole="checkbox"
                >
                  <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={checked ? Colors.secondary : '#555'}
                  />
                  <Text style={styles.guideRowText}>{guide?.title ?? guideId}</Text>
                </TouchableOpacity>
              );
            })}

            {selectedGuides.length > 0 && !kitAdded && (
              <TouchableOpacity
                style={styles.addToKitBtn}
                onPress={addSelectedGuidesToKit}
                accessibilityLabel={`Add ${selectedGuides.length} guide(s) to kit`}
                accessibilityRole="button"
              >
                <Ionicons name="bag-add-outline" size={16} color="#fff" />
                <Text style={styles.addToKitBtnText}>
                  Add {selectedGuides.length} guide(s) to Kit
                </Text>
              </TouchableOpacity>
            )}
            {kitAdded && (
              <View style={styles.kitAddedRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.kitAddedText}>Guides added to your kit</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Section 2: Review Reminder ───────────────────────────────────── */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Review Again?</Text>
          <TouchableOpacity
            style={[styles.reminderBtn, reminderScheduled && styles.reminderBtnDone]}
            onPress={scheduleReviewReminder}
            disabled={reminderScheduled}
            accessibilityLabel={reminderScheduled ? 'Reminder set' : 'Schedule review reminder in 3 days'}
            accessibilityRole="button"
          >
            <Ionicons
              name={reminderScheduled ? 'checkmark-circle' : 'notifications-outline'}
              size={18}
              color={reminderScheduled ? Colors.success : Colors.primary}
            />
            <Text style={[styles.reminderBtnText, reminderScheduled && styles.reminderBtnTextDone]}>
              {reminderScheduled ? 'Reminder Set for 3 Days' : 'Review Again in 3 Days'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Section 3: Share Result ──────────────────────────────────────── */}
        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Share Your Result</Text>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={shareResult}
            accessibilityLabel="Share quiz score"
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={18} color="#F0F0F0" />
            <Text style={styles.shareBtnText}>Share Score</Text>
          </TouchableOpacity>
          <Text style={styles.sharePreview}>
            {`"GridDown Readiness — ${category.toUpperCase()}: ${accuracy}% — Daily Drill completed"`}
          </Text>
        </View>

      </ScrollView>

      {kitPickerModal}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  // ── Score card ───────────────────────────────────────────────────────────────
  scoreCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20,
  },
  scorefraction: { fontSize: 48, fontWeight: '800', letterSpacing: 2 },
  accuracyPct: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: Colors.textSecondary },

  // ── Missed questions ─────────────────────────────────────────────────────────
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.5, marginBottom: 10,
  },
  missedCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 8, padding: 12, marginBottom: 8,
  },
  missedScenario: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, lineHeight: 18 },
  correctRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  correctText: { flex: 1, fontSize: 13, color: Colors.success, lineHeight: 18 },

  // ── Action buttons ───────────────────────────────────────────────────────────
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  outlineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8, paddingVertical: 12,
  },
  outlineBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  filledBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
  },
  filledBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // ── Action sections (shared) ─────────────────────────────────────────────────
  actionSection: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: -4,
  },

  // ── Section 1: Guide pins ────────────────────────────────────────────────────
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  guideRowText: { color: Colors.textSecondary, fontSize: 13, flex: 1 },
  addToKitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  addToKitBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  kitAddedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kitAddedText: { color: Colors.success, fontSize: 13, fontWeight: '600' },

  // ── Section 2: Reminder ──────────────────────────────────────────────────────
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  reminderBtnDone: { borderColor: Colors.success, backgroundColor: '#0D1F12' },
  reminderBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  reminderBtnTextDone: { color: Colors.success },

  // ── Section 3: Share ─────────────────────────────────────────────────────────
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A2A3A',
    borderRadius: 8,
    paddingVertical: 10,
  },
  shareBtnText: { color: '#F0F0F0', fontSize: 14, fontWeight: '700' },
  sharePreview: {
    color: Colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    textAlign: 'center',
  },

  // ── Kit picker modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  kitPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  kitPickerIcon: { fontSize: 22 },
  kitPickerName: { color: Colors.textPrimary, fontSize: 15 },
  modalCancel: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: Colors.textMuted, fontSize: 15 },
});
