import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { saveReadinessScan } from '../db/readinessScan';

// ─── Types ────────────────────────────────────────────────────────────────────

type Answer = 'yes' | 'partial' | 'no' | null;

interface Question {
  id: number;
  domain: Domain;
  text: string;
}

type Domain =
  | 'Water'
  | 'Shelter'
  | 'Medical'
  | 'Comms'
  | 'Power'
  | 'Navigation'
  | 'Planning';

interface DomainScore {
  domain: Domain;
  score: number;
  total: number;
  pct: number;
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // Water (7)
  { id: 1,  domain: 'Water',      text: 'Do you have at least 1 gallon of water per person per day stored for 72 hours?' },
  { id: 2,  domain: 'Water',      text: 'Do you have a water filter capable of removing bacteria and protozoa?' },
  { id: 3,  domain: 'Water',      text: 'Do you know how to locate a natural water source within 1 mile of your home?' },
  { id: 4,  domain: 'Water',      text: 'Do you own water purification tablets?' },
  { id: 5,  domain: 'Water',      text: 'Do you know the signs of dehydration and how to treat them?' },
  { id: 6,  domain: 'Water',      text: 'Can you construct a solar still?' },
  { id: 7,  domain: 'Water',      text: 'Do you have a way to boil water if utilities are unavailable?' },
  // Shelter (7)
  { id: 8,  domain: 'Shelter',    text: 'Do you have materials to shelter-in-place for 72 hours without utilities?' },
  { id: 9,  domain: 'Shelter',    text: 'Do you have a bug-out location identified and a route planned?' },
  { id: 10, domain: 'Shelter',    text: 'Do you have a rally point established with your household?' },
  { id: 11, domain: 'Shelter',    text: 'Do you have a way to secure your home if locks or doors are compromised?' },
  { id: 12, domain: 'Shelter',    text: 'Do you have a blackout plan (light discipline) for grid-down scenarios?' },
  { id: 13, domain: 'Shelter',    text: 'Do you have a 72-hour bag packed and accessible within 5 minutes?' },
  { id: 14, domain: 'Shelter',    text: 'Do you know your immediate neighbors and have a mutual aid plan?' },
  // Medical (8)
  { id: 15, domain: 'Medical',    text: 'Do you have at least 72 hours of non-perishable food stored?' },
  { id: 16, domain: 'Medical',    text: 'Do you have a manual can opener?' },
  { id: 17, domain: 'Medical',    text: 'Do you have a tourniquet and know how to apply it?' },
  { id: 18, domain: 'Medical',    text: 'Do you have a chest seal or wound packing gauze?' },
  { id: 19, domain: 'Medical',    text: 'Do you have a complete first aid kit?' },
  { id: 20, domain: 'Medical',    text: 'Do you know how to treat shock?' },
  { id: 21, domain: 'Medical',    text: 'Do you have a 30-day supply of any prescription medications?' },
  { id: 22, domain: 'Medical',    text: 'Do you know the blood types of everyone in your household?' },
  // Comms (7)
  { id: 23, domain: 'Comms',      text: 'Do you have a battery-powered or hand-crank NOAA weather radio?' },
  { id: 24, domain: 'Comms',      text: 'Do you have a HAM radio or GMRS radio?' },
  { id: 25, domain: 'Comms',      text: 'Do you have a predetermined out-of-area contact your household will reach out to?' },
  { id: 26, domain: 'Comms',      text: 'Do you know the local emergency broadcast frequency?' },
  { id: 27, domain: 'Comms',      text: 'Do you have a signal mirror or whistle?' },
  { id: 28, domain: 'Comms',      text: 'Do you know your local emergency shelter locations?' },
  { id: 29, domain: 'Comms',      text: 'Can you send and receive Morse code SOS?' },
  // Power (7)
  { id: 30, domain: 'Power',      text: 'Do you have a portable battery bank (10,000 mAh or larger)?' },
  { id: 31, domain: 'Power',      text: 'Do you have a way to charge devices without grid power (solar, vehicle, generator)?' },
  { id: 32, domain: 'Power',      text: 'Do you have at least 72 hours of fuel for your generator or vehicle?' },
  { id: 33, domain: 'Power',      text: 'Do you have backup lighting (flashlights, lanterns, candles)?' },
  { id: 34, domain: 'Power',      text: 'Do you know how to safely operate a generator outdoors?' },
  { id: 35, domain: 'Power',      text: 'Do you have extra batteries in common sizes (AA, AAA, CR123)?' },
  { id: 36, domain: 'Power',      text: 'Do you have a solar charger for small devices?' },
  // Navigation (7)
  { id: 37, domain: 'Navigation', text: 'Do you have a physical map of your local area (not digital)?' },
  { id: 38, domain: 'Navigation', text: 'Do you own a compass and know how to use it?' },
  { id: 39, domain: 'Navigation', text: 'Do you have at least half a tank of fuel in your primary vehicle at all times?' },
  { id: 40, domain: 'Navigation', text: 'Do you have a paper list of important phone numbers (not stored only in your phone)?' },
  { id: 41, domain: 'Navigation', text: 'Do you know two alternate routes out of your neighborhood?' },
  { id: 42, domain: 'Navigation', text: 'Do you have basic vehicle emergency supplies (jumper cables, tire patch, water)?' },
  { id: 43, domain: 'Navigation', text: 'Do you know how to read basic terrain features on a map?' },
  // Planning (7)
  { id: 44, domain: 'Planning',   text: 'Does every member of your household know the emergency rally point?' },
  { id: 45, domain: 'Planning',   text: 'Do you have a written family emergency plan?' },
  { id: 46, domain: 'Planning',   text: 'Do children in your household know how to call 911?' },
  { id: 47, domain: 'Planning',   text: 'Do you have emergency contact cards printed and distributed?' },
  { id: 48, domain: 'Planning',   text: 'Do you have copies of critical documents (ID, insurance, medical) in a waterproof bag?' },
  { id: 49, domain: 'Planning',   text: 'Do you have cash in small bills stored at home?' },
  { id: 50, domain: 'Planning',   text: 'Do you have a pet emergency plan if applicable?' },
];

const TOTAL = QUESTIONS.length;

const DOMAIN_ORDER: Domain[] = [
  'Water', 'Shelter', 'Medical', 'Comms', 'Power', 'Navigation', 'Planning',
];

const DOMAIN_ICONS: Record<Domain, keyof typeof Ionicons.glyphMap> = {
  Water:      'water-outline',
  Shelter:    'home-outline',
  Medical:    'medkit-outline',
  Comms:      'radio-outline',
  Power:      'flash-outline',
  Navigation: 'compass-outline',
  Planning:   'clipboard-outline',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function answerValue(a: Answer): number {
  if (a === 'yes')     return 1;
  if (a === 'partial') return 0.5;
  return 0;
}

function scoreColor(pct: number): string {
  if (pct >= 71) return Colors.success;
  if (pct >= 41) return Colors.warning;
  return Colors.danger;
}

function computeDomainScores(answers: Answer[]): DomainScore[] {
  return DOMAIN_ORDER.map((domain) => {
    const qs = QUESTIONS.filter((q) => q.domain === domain);
    const total = qs.length;
    const score = qs.reduce((acc, q) => acc + answerValue(answers[q.id - 1]), 0);
    const pct = Math.round((score / total) * 100);
    return { domain, score, total, pct };
  });
}

function computeOverallScore(answers: Answer[]): number {
  const sum = answers.reduce((acc, a) => acc + answerValue(a), 0);
  return Math.round((sum / TOTAL) * 100);
}

function getTop5Gaps(answers: Answer[]): Question[] {
  return QUESTIONS
    .filter((q) => answers[q.id - 1] === 'no')
    .slice(0, 5);
}

function getReadinessPlan(domainScores: DomainScore[]): string[] {
  return [...domainScores]
    .sort((a, b) => a.pct - b.pct)
    .map((ds) => {
      const label =
        ds.pct < 40  ? `[CRITICAL] ${ds.domain}` :
        ds.pct < 70  ? `[IMPROVE] ${ds.domain}` :
                       `[MAINTAIN] ${ds.domain}`;
      return `${label} — ${ds.pct}% ready`;
    });
}

// ─── QuestionView ─────────────────────────────────────────────────────────────

interface QuestionViewProps {
  questionIndex: number;
  onAnswer: (answer: 'yes' | 'partial' | 'no') => void;
}

function QuestionView({ questionIndex, onAnswer }: QuestionViewProps) {
  const question = QUESTIONS[questionIndex];
  const progress = (questionIndex + 1) / TOTAL;
  const domain = question.domain;
  const icon = DOMAIN_ICONS[domain];

  return (
    <View style={styles.questionContainer}>
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>{questionIndex + 1} / {TOTAL}</Text>
          <Text style={styles.domainLabel}>{domain.toUpperCase()}</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Question card */}
      <View style={styles.questionCard}>
        <View style={styles.questionIconRow}>
          <Ionicons name={icon} size={28} color={Colors.primary} />
        </View>
        <Text style={styles.questionText}>{question.text}</Text>
      </View>

      {/* Answer buttons */}
      <View style={styles.answerButtons}>
        <TouchableOpacity
          style={[styles.answerBtn, styles.answerBtnYes]}
          onPress={() => onAnswer('yes')}
          activeOpacity={0.75}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.answerBtnText}>YES</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerBtn, styles.answerBtnPartial]}
          onPress={() => onAnswer('partial')}
          activeOpacity={0.75}
        >
          <Ionicons name="remove-circle-outline" size={22} color="#fff" />
          <Text style={styles.answerBtnText}>PARTIAL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.answerBtn, styles.answerBtnNo]}
          onPress={() => onAnswer('no')}
          activeOpacity={0.75}
        >
          <Ionicons name="close-circle-outline" size={22} color="#fff" />
          <Text style={styles.answerBtnText}>NO</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.partialHint}>
        PARTIAL = aware of it but don't have it yet
      </Text>
    </View>
  );
}

// ─── DomainBar ────────────────────────────────────────────────────────────────

interface DomainBarProps {
  ds: DomainScore;
}

function DomainBar({ ds }: DomainBarProps) {
  const color = scoreColor(ds.pct);
  const icon = DOMAIN_ICONS[ds.domain];
  return (
    <View style={styles.domainBarRow}>
      <View style={styles.domainBarHeader}>
        <Ionicons name={icon} size={16} color={color} style={{ marginRight: 6 }} />
        <Text style={styles.domainBarName}>{ds.domain}</Text>
        <Text style={[styles.domainBarPct, { color }]}>{ds.pct}%</Text>
      </View>
      <View style={styles.domainBarTrack}>
        <View
          style={[
            styles.domainBarFill,
            { width: `${ds.pct}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

// ─── ResultsView ──────────────────────────────────────────────────────────────

interface ResultsViewProps {
  answers: Answer[];
  onRestart: () => void;
  onStartTraining: () => void;
}

function ResultsView({ answers, onRestart, onStartTraining }: ResultsViewProps) {
  const domainScores = computeDomainScores(answers);
  const overallPct   = computeOverallScore(answers);
  const overallColor = scoreColor(overallPct);
  const top5Gaps     = getTop5Gaps(answers);
  const plan         = getReadinessPlan(domainScores);

  const overallLabel =
    overallPct >= 71 ? 'PREPARED' :
    overallPct >= 41 ? 'DEVELOPING' :
                       'CRITICAL';

  return (
    <ScrollView
      style={styles.resultsScroll}
      contentContainerStyle={styles.resultsContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>READINESS SCAN{'\n'}COMPLETE</Text>
      </View>

      {/* Overall score */}
      <View style={[styles.overallCard, { borderColor: overallColor }]}>
        <Text style={styles.overallLabel}>OVERALL READINESS</Text>
        <Text style={[styles.overallPct, { color: overallColor }]}>{overallPct}%</Text>
        <Text style={[styles.overallStatus, { color: overallColor }]}>{overallLabel}</Text>
      </View>

      {/* Domain breakdown */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>DOMAIN BREAKDOWN</Text>
        {domainScores.map((ds) => (
          <DomainBar key={ds.domain} ds={ds} />
        ))}
      </View>

      {/* Top 5 Critical Gaps */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="warning-outline" size={18} color={Colors.danger} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>TOP 5 CRITICAL GAPS</Text>
        </View>
        {top5Gaps.length === 0 ? (
          <Text style={styles.noGapsText}>No critical gaps — excellent work!</Text>
        ) : (
          top5Gaps.map((q, idx) => (
            <View key={q.id} style={styles.gapRow}>
              <View style={styles.gapNumber}>
                <Text style={styles.gapNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.gapContent}>
                <Text style={styles.gapDomain}>{q.domain.toUpperCase()}</Text>
                <Text style={styles.gapText}>{q.text}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Readiness Plan */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="list-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>YOUR READINESS PLAN</Text>
        </View>
        {plan.map((item, idx) => (
          <View key={idx} style={styles.planRow}>
            <Ionicons
              name={
                item.startsWith('[CRITICAL]') ? 'alert-circle' :
                item.startsWith('[IMPROVE]')  ? 'arrow-up-circle-outline' :
                                                'checkmark-circle-outline'
              }
              size={16}
              color={
                item.startsWith('[CRITICAL]') ? Colors.danger :
                item.startsWith('[IMPROVE]')  ? Colors.warning :
                                                Colors.success
              }
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text style={styles.planText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Action buttons */}
      <TouchableOpacity style={styles.primaryBtn} onPress={onStartTraining} activeOpacity={0.8}>
        <Ionicons name="fitness-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryBtnText}>START TRAINING</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={onRestart} activeOpacity={0.8}>
        <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 6 }} />
        <Text style={styles.secondaryBtnText}>RETAKE SCAN</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ReadinessScanScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(Array(TOTAL).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAnswer = useCallback(
    async (answer: 'yes' | 'partial' | 'no') => {
      const newAnswers = [...answers];
      newAnswers[currentIndex] = answer;
      setAnswers(newAnswers);

      if (currentIndex < TOTAL - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // All 50 answered — compute & save
        if (!saving) {
          setSaving(true);
          try {
            const domainScores = computeDomainScores(newAnswers);
            const overall      = computeOverallScore(newAnswers);
            const dsMap: Record<string, number> = {};
            domainScores.forEach((ds) => { dsMap[ds.domain] = ds.pct; });

            await saveReadinessScan({
              completed_at:     Date.now(),
              water_score:      dsMap['Water']      ?? 0,
              shelter_score:    dsMap['Shelter']    ?? 0,
              medical_score:    dsMap['Medical']    ?? 0,
              comms_score:      dsMap['Comms']      ?? 0,
              power_score:      dsMap['Power']      ?? 0,
              navigation_score: dsMap['Navigation'] ?? 0,
              planning_score:   dsMap['Planning']   ?? 0,
              overall_score:    overall,
              answers:          JSON.stringify(newAnswers),
            });
          } catch (e) {
            // Non-fatal — still show results
          } finally {
            setSaving(false);
          }
        }
        setShowResults(true);
      }
    },
    [answers, currentIndex, saving]
  );

  const handleRestart = useCallback(() => {
    setAnswers(Array(TOTAL).fill(null));
    setCurrentIndex(0);
    setShowResults(false);
  }, []);

  const handleStartTraining = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        {!showResults && (
          <View style={styles.topBarInner}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
            <Text style={styles.topBarTitle}>READINESS SCAN</Text>
          </View>
        )}
        {showResults && (
          <View style={styles.topBarInner}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <Text style={styles.topBarTitle}>SCAN RESULTS</Text>
          </View>
        )}
      </View>

      {showResults ? (
        <ResultsView
          answers={answers}
          onRestart={handleRestart}
          onStartTraining={handleStartTraining}
        />
      ) : (
        <QuestionView
          questionIndex={currentIndex}
          onAnswer={handleAnswer}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },

  // ── Question view ──────────────────────────────────────────────────
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  progressSection: {
    marginBottom: 28,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  domainLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
    marginBottom: 32,
    minHeight: 160,
    justifyContent: 'center',
  },
  questionIconRow: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 28,
    fontWeight: '500',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  answerBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 10,
    gap: 6,
  },
  answerBtnYes: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  answerBtnPartial: {
    backgroundColor: '#5A4A10',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  answerBtnNo: {
    backgroundColor: Colors.primaryDim,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  answerBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  partialHint: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },

  // ── Results view ───────────────────────────────────────────────────
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  resultsHeader: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 3,
    lineHeight: 30,
  },
  overallCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  overallPct: {
    fontSize: 64,
    fontWeight: '900',
    lineHeight: 72,
  },
  overallStatus: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  // Domain bar
  domainBarRow: {
    marginBottom: 12,
  },
  domainBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  domainBarName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  domainBarPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  domainBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  domainBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Gaps
  noGapsText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  gapRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  gapNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  gapNumberText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  gapContent: {
    flex: 1,
  },
  gapDomain: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  gapText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },

  // Plan
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
