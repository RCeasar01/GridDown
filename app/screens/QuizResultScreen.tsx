import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MoreStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { getCategoryReadiness } from '../db/contentLoader';
import { getQuizById } from '../utils/quizRegistry';
import { MultipleChoiceQuiz, PriorityOrderQuiz } from '../types/quiz';

type RouteType = RouteProp<MoreStackParamList, 'QuizResult'>;

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function QuizResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const { category, total, correct, timeTaken, missedQuizIds } = route.params;

  const [categoryReadiness, setCategoryReadiness] = useState<number | null>(null);

  useEffect(() => {
    getCategoryReadiness(category).then(setCategoryReadiness).catch(() => {});
  }, [category]);

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreColor =
    accuracy >= 80 ? Colors.success :
    accuracy >= 50 ? Colors.primary : Colors.danger;

  const missedQuizzes = missedQuizIds
    .map(id => getQuizById(id))
    .filter(Boolean) as (MultipleChoiceQuiz | PriorityOrderQuiz)[];

  const relatedGuides = missedQuizzes
    .map(q => q.relatedGuide)
    .filter((g): g is string => !!g)
    .filter((v, i, a) => a.indexOf(v) === i);

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
            onPress={() => navigation.navigate('QuizMenu')}
          >
            <Text style={styles.filledBtnText}>Back to Categories</Text>
          </TouchableOpacity>
        </View>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RELATED GUIDES</Text>
            {relatedGuides.map(guide => (
              <Text key={guide} style={styles.guideLink}>• {guide}</Text>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  scoreCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20,
  },
  scorefraction: { fontSize: 48, fontWeight: '800', letterSpacing: 2 },
  accuracyPct: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 14 },
  metaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: Colors.textSecondary },
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
  guideLink: { fontSize: 13, color: Colors.primary, marginBottom: 4 },
});
