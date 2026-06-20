import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  StyleSheet, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrillStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { getQuizById, getQuizzesByCategory } from '../utils/quizRegistry';
import { saveQuizResult, markDrillComplete } from '../db/contentLoader';
import {
  Quiz, MultipleChoiceQuiz, PriorityOrderQuiz, DecisionTreeQuiz, POItem,
} from '../types/quiz';

type NavProp = NativeStackNavigationProp<DrillStackParamList>;
type RouteType = RouteProp<DrillStackParamList, 'QuizPlay'>;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const { category, quizId, isDailyDrill } = route.params ?? {};

  const quizzes = useMemo<Quiz[]>(() => {
    if (quizId) { const q = getQuizById(quizId); return q ? [q] : []; }
    if (category) return getQuizzesByCategory(category);
    return [];
  }, [category, quizId]);

  const [quizIndex, setQuizIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const startTime = useRef(Date.now());

  // MC state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // PO state
  const [shuffledItems, setShuffledItems] = useState<POItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // DT state
  const [currentNodeId, setCurrentNodeId] = useState('start');
  const [dtComplete, setDtComplete] = useState(false);
  const [dtOutcome, setDtOutcome] = useState<'success' | 'poor' | null>(null);
  const [dtExplanation, setDtExplanation] = useState<string | undefined>(undefined);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuiz = quizzes[quizIndex];

  useEffect(() => {
    if (!currentQuiz) return;
    setSelectedOption(null);
    setIsAnswered(false);
    setSelectedOrder([]);
    setIsSubmitted(false);
    setCurrentNodeId('start');
    setDtComplete(false);
    setDtOutcome(null);
    setDtExplanation(undefined);
    if (currentQuiz.type === 'priority_order') {
      setShuffledItems(shuffleArray((currentQuiz as PriorityOrderQuiz).items));
    }
  }, [quizIndex]);

  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    if (!currentQuiz) return;
    await saveQuizResult(currentQuiz.category, currentQuiz.id, currentQuiz.type, isCorrect);
    if (!isCorrect) setMissedIds(prev => [...prev, currentQuiz.id]);
    setCorrectCount(prev => prev + (isCorrect ? 1 : 0));
  }, [currentQuiz]);

  const handleNext = useCallback(async () => {
    if (!currentQuiz) return;
    if (quizIndex + 1 < quizzes.length) {
      setQuizIndex(i => i + 1);
    } else {
      if (isDailyDrill) {
        const today = new Date().toISOString().split('T')[0];
        const finalScore = Math.round((correctCount / quizzes.length) * 100);
        await markDrillComplete(today, quizzes[0].id, finalScore);
      }
      navigation.replace('QuizResult', {
        category: category ?? currentQuiz.category,
        total: quizzes.length,
        correct: correctCount,
        timeTaken: Math.floor((Date.now() - startTime.current) / 1000),
        missedQuizIds: missedIds,
      });
    }
  }, [currentQuiz, quizIndex, quizzes, isDailyDrill, correctCount, category, missedIds, navigation]);

  // MC handlers
  const handleMCPress = useCallback(async (optionId: string) => {
    if (isAnswered) return;
    setSelectedOption(optionId);
    setIsAnswered(true);
    const mc = currentQuiz as MultipleChoiceQuiz;
    await handleAnswer(optionId === mc.correct);
  }, [isAnswered, currentQuiz, handleAnswer]);

  // PO handlers
  const handlePOItemPress = useCallback((itemId: string) => {
    if (isSubmitted) return;
    setSelectedOrder(prev => {
      if (prev.includes(itemId)) return prev.filter(id => id !== itemId);
      return [...prev, itemId];
    });
  }, [isSubmitted]);

  const handlePOSubmit = useCallback(async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    const po = currentQuiz as PriorityOrderQuiz;
    const isCorrect = JSON.stringify(selectedOrder) === JSON.stringify(po.correct_order);
    await handleAnswer(isCorrect);
  }, [isSubmitted, currentQuiz, selectedOrder, handleAnswer]);

  // DT handlers
  const handleDTChoice = useCallback((nextNodeId: string) => {
    const dt = currentQuiz as DecisionTreeQuiz;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const nextNode = dt.nodes[nextNodeId];
    if (!nextNode) return;
    if (nextNode.outcome) {
      setDtComplete(true);
      setDtOutcome(nextNode.outcome);
      setDtExplanation(nextNode.explanation);
      handleAnswer(nextNode.outcome === 'success');
    } else {
      setCurrentNodeId(nextNodeId);
    }
  }, [currentQuiz, fadeAnim, handleAnswer]);

  const handleDTReplay = useCallback(() => {
    setCurrentNodeId('start');
    setDtComplete(false);
    setDtOutcome(null);
    setDtExplanation(undefined);
  }, []);

  if (!currentQuiz) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No quizzes found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLastQuiz = quizIndex + 1 === quizzes.length;

  const renderMC = () => {
    const mc = currentQuiz as MultipleChoiceQuiz;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.formatLabel}>MULTIPLE CHOICE</Text>
        <Text style={styles.scenario}>{mc.scenario}</Text>
        <View style={styles.optionsContainer}>
          {mc.options.map(opt => {
            let btnStyle = styles.optionBtn;
            let txtStyle = styles.optionText;
            if (isAnswered) {
              if (opt.id === mc.correct) {
                btnStyle = { ...styles.optionBtn, backgroundColor: Colors.secondaryDim, borderColor: Colors.success } as any;
                txtStyle = { ...styles.optionText, color: Colors.success } as any;
              } else if (opt.id === selectedOption) {
                btnStyle = { ...styles.optionBtn, backgroundColor: Colors.dangerBg, borderColor: Colors.danger } as any;
                txtStyle = { ...styles.optionText, color: Colors.danger } as any;
              }
            }
            return (
              <TouchableOpacity key={opt.id} style={btnStyle} onPress={() => handleMCPress(opt.id)} activeOpacity={0.75}>
                <Text style={txtStyle}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isAnswered && (
          <View style={[styles.explanationCard,
            selectedOption === mc.correct ? { backgroundColor: Colors.successBg, borderColor: Colors.success } :
            { backgroundColor: Colors.dangerBg, borderColor: Colors.danger }
          ]}>
            <Text style={styles.explanationLabel}>
              {selectedOption === mc.correct ? '✓ CORRECT' : '✗ INCORRECT'}
            </Text>
            <Text style={styles.explanationText}>{mc.explanation}</Text>
          </View>
        )}
        {isAnswered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{isLastQuiz ? 'FINISH' : 'NEXT'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderPO = () => {
    const po = currentQuiz as PriorityOrderQuiz;
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.formatLabel}>PRIORITY ORDER</Text>
        <Text style={styles.scenario}>{po.scenario}</Text>
        <Text style={styles.poInstruction}>Tap items in the correct sequence:</Text>
        <View style={styles.optionsContainer}>
          {shuffledItems.map(item => {
            const selectedIdx = selectedOrder.indexOf(item.id);
            const isSelected = selectedIdx >= 0;
            let itemBgColor = Colors.surface;
            let itemBorderColor = Colors.cardBorder;
            if (isSubmitted) {
              const correctIdx = po.correct_order.indexOf(item.id);
              itemBgColor = selectedIdx === correctIdx ? Colors.secondaryDim : Colors.dangerBg;
              itemBorderColor = selectedIdx === correctIdx ? Colors.success : Colors.danger;
            } else if (isSelected) {
              itemBgColor = Colors.primaryDim;
              itemBorderColor = Colors.primary;
            }
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.poItem, { backgroundColor: itemBgColor, borderColor: itemBorderColor }]}
                onPress={() => handlePOItemPress(item.id)}
                activeOpacity={0.75}
              >
                {isSelected && !isSubmitted && (
                  <View style={styles.seqBadge}><Text style={styles.seqBadgeText}>{selectedIdx + 1}</Text></View>
                )}
                <Text style={styles.poItemText}>{item.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!isSubmitted && (
          <TouchableOpacity
            style={[styles.nextBtn, selectedOrder.length < shuffledItems.length && styles.btnDisabled]}
            onPress={handlePOSubmit}
            disabled={selectedOrder.length < shuffledItems.length}
          >
            <Text style={styles.nextBtnText}>SUBMIT ORDER</Text>
          </TouchableOpacity>
        )}
        {isSubmitted && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationText}>{po.explanation}</Text>
            <TouchableOpacity style={[styles.nextBtn, { marginTop: 12 }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>{isLastQuiz ? 'FINISH' : 'NEXT'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderDT = () => {
    const dt = currentQuiz as DecisionTreeQuiz;
    const currentNode = dt.nodes[currentNodeId];
    if (!currentNode) return null;

    if (dtComplete) {
      const isSuccess = dtOutcome === 'success';
      return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={[styles.outcomeBanner,
            { backgroundColor: isSuccess ? Colors.successBg : Colors.dangerBg,
              borderColor: isSuccess ? Colors.success : Colors.danger }
          ]}>
            <Text style={[styles.outcomeText, { color: isSuccess ? Colors.success : Colors.danger }]}>
              {isSuccess ? '✓ MISSION SUCCESS' : '✗ POOR OUTCOME'}
            </Text>
          </View>
          {dtExplanation && (
            <Text style={styles.explanationText}>{dtExplanation}</Text>
          )}
          <View style={styles.dtButtonRow}>
            <TouchableOpacity style={styles.replayBtn} onPress={handleDTReplay}>
              <Text style={styles.replayBtnText}>REPLAY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={handleNext}>
              <Text style={styles.nextBtnText}>{isLastQuiz ? 'DONE' : 'NEXT'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.formatLabel}>DECISION SCENARIO</Text>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.dtScenario}>{currentNode.scenario}</Text>
          <View style={styles.optionsContainer}>
            {(currentNode.options ?? []).map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.dtChoiceBtn}
                onPress={() => handleDTChoice(opt.next)}
                activeOpacity={0.75}
              >
                <Text style={styles.dtChoiceText}>{opt.text}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {quizIndex + 1} of {quizzes.length}
          </Text>
          <Text style={styles.categoryChip}>{currentQuiz.category.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${((quizIndex) / quizzes.length) * 100}%` as any }]} />
      </View>
      {currentQuiz.type === 'multiple_choice' && renderMC()}
      {currentQuiz.type === 'priority_order' && renderPO()}
      {currentQuiz.type === 'decision_tree' && renderDT()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  progressHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  backBtn: { padding: 4 },
  progressInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 14, color: Colors.textSecondary },
  categoryChip: { fontSize: 10, color: Colors.primary, fontWeight: '700', letterSpacing: 1 },
  progressBarBg: { height: 2, backgroundColor: Colors.surfaceBorder, marginHorizontal: 16, marginBottom: 4 },
  progressBarFill: { height: 2, backgroundColor: Colors.primary },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  formatLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  scenario: { fontSize: 16, color: Colors.textPrimary, lineHeight: 24, marginBottom: 20 },
  optionsContainer: { gap: 10 },
  optionBtn: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 8, paddingVertical: 14, paddingHorizontal: 14, minHeight: 56,
    justifyContent: 'center',
  },
  optionText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  explanationCard: {
    marginTop: 16, padding: 14, borderRadius: 8, borderWidth: 1,
    borderColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  explanationLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  explanationText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  nextBtn: {
    marginTop: 16, backgroundColor: Colors.primary, borderRadius: 8,
    paddingVertical: 13, alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  btnDisabled: { backgroundColor: Colors.surfaceBorder },
  poInstruction: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  poItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 14, minHeight: 52,
  },
  seqBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  seqBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  poItemText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  dtScenario: {
    fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dtChoiceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: 8, paddingVertical: 14, paddingHorizontal: 14,
  },
  dtChoiceText: { flex: 1, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  outcomeBanner: { padding: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', marginBottom: 16 },
  outcomeText: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  dtButtonRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  replayBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 8,
    paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center',
  },
  replayBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
