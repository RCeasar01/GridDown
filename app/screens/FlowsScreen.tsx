import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getAllFlows, Flow, FlowStep } from '../utils/flowRegistry';
import { HomeStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Flows'>;

// ─── Flow List ────────────────────────────────────────────────────────────────

interface FlowCardProps {
  flow: Flow;
  onPress: () => void;
}

function FlowCard({ flow, onPress }: FlowCardProps) {
  return (
    <TouchableOpacity style={styles.flowCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.flowIconContainer, { backgroundColor: flow.color + '33' }]}>
        <Ionicons name={flow.icon as keyof typeof Ionicons.glyphMap} size={28} color={flow.color} />
      </View>
      <View style={styles.flowCardContent}>
        <Text style={styles.flowTitle}>{flow.title}</Text>
        <Text style={styles.flowMeta}>{flow.steps.length} steps · {flow.estimatedTime}</Text>
        <Text style={styles.flowDescription} numberOfLines={2}>{flow.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#555" />
    </TouchableOpacity>
  );
}

// ─── Checklist Item ───────────────────────────────────────────────────────────

interface CheckItemProps {
  text: string;
  checked: boolean;
  onToggle: () => void;
}

function CheckItem({ text, checked, onToggle }: CheckItemProps) {
  return (
    <TouchableOpacity style={styles.checkItem} onPress={onToggle} activeOpacity={0.7}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={checked ? Colors.secondary : '#555'}
      />
      <Text style={[styles.checkItemText, checked && styles.checkItemChecked]}>{text}</Text>
    </TouchableOpacity>
  );
}

// ─── Step Detail Card ─────────────────────────────────────────────────────────

interface StepCardProps {
  step: FlowStep;
  checked: Record<string, boolean>;
  onToggle: (step: number, itemIndex: number) => void;
  onViewGuide: (guideId: string) => void;
}

function StepDetailCard({ step, checked, onToggle, onViewGuide }: StepCardProps) {
  return (
    <View style={styles.stepDetailCard}>
      <Text style={styles.stepNum}>STEP {step.step}</Text>
      <Text style={styles.stepDetailTitle}>{step.title}</Text>
      <Text style={styles.stepDetailSummary}>{step.summary}</Text>

      <View style={styles.checklistContainer}>
        {step.checklistItems.map((item, i) => (
          <CheckItem
            key={i}
            text={item}
            checked={checked[`${step.step}-${i}`] ?? false}
            onToggle={() => onToggle(step.step, i)}
          />
        ))}
      </View>

      {step.guideId != null && (
        <TouchableOpacity
          style={styles.viewGuideBtn}
          onPress={() => onViewGuide(step.guideId!)}
          activeOpacity={0.75}
        >
          <Text style={styles.viewGuideBtnText}>View Full Guide</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Flow Detail View ─────────────────────────────────────────────────────────

interface FlowDetailProps {
  flow: Flow;
  navigation: Nav;
  onBack: () => void;
}

function FlowDetailView({ flow, navigation, onBack }: FlowDetailProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const totalSteps = flow.steps.length;
  const completedSteps = flow.steps.filter(s =>
    s.checklistItems.every((_, i) => checked[`${s.step}-${i}`] ?? false)
  ).length;
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const activeStep = flow.steps.find(s => s.step === currentStep) ?? flow.steps[0];

  function toggleCheck(step: number, itemIndex: number) {
    const key = `${step}-${itemIndex}`;
    setChecked(prev => ({ ...prev, [key]: !(prev[key] ?? false) }));
  }

  function resetFlow() {
    setCurrentStep(1);
    setChecked({});
  }

  function navigateToGuide(guideId: string) {
    navigation.navigate('Learn' as any, { screen: 'Guide', params: { guideId } });
  }

  return (
    <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
        <Text style={styles.backBtnText}>Back to Flows</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={[styles.detailHeader, { borderLeftColor: flow.color }]}>
        <View style={[styles.detailIconWrap, { backgroundColor: flow.color + '33' }]}>
          <Ionicons name={flow.icon as keyof typeof Ionicons.glyphMap} size={32} color={flow.color} />
        </View>
        <View style={styles.detailHeaderText}>
          <Text style={styles.detailTitle}>{flow.title}</Text>
          <Text style={styles.detailMeta}>{totalSteps} steps · {flow.estimatedTime}</Text>
        </View>
      </View>

      <Text style={styles.detailDescription}>{flow.description}</Text>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedSteps} of {totalSteps} steps complete
        </Text>
      </View>

      {/* Step selector pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.stepPillsScroll}
        contentContainerStyle={styles.stepPillsContent}
      >
        {flow.steps.map(s => {
          const stepDone = s.checklistItems.every((_, i) => checked[`${s.step}-${i}`] ?? false);
          const isActive = s.step === currentStep;
          return (
            <TouchableOpacity
              key={s.step}
              style={[
                styles.stepPill,
                isActive && styles.stepPillActive,
                stepDone && !isActive && styles.stepPillDone,
              ]}
              onPress={() => setCurrentStep(s.step)}
              activeOpacity={0.7}
            >
              {stepDone ? (
                <Ionicons name="checkmark" size={12} color={isActive ? '#fff' : Colors.secondary} />
              ) : (
                <Text style={[styles.stepPillNum, isActive && styles.stepPillNumActive]}>
                  {s.step}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Active step card */}
      {activeStep && (
        <StepDetailCard
          step={activeStep}
          checked={checked}
          onToggle={toggleCheck}
          onViewGuide={navigateToGuide}
        />
      )}

      {/* Prev / Next navigation */}
      <View style={styles.stepNav}>
        <TouchableOpacity
          style={[styles.stepNavBtn, currentStep === 1 && styles.stepNavBtnDisabled]}
          onPress={() => setCurrentStep(p => Math.max(1, p - 1))}
          disabled={currentStep === 1}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={currentStep === 1 ? Colors.textMuted : Colors.textPrimary} />
          <Text style={[styles.stepNavText, currentStep === 1 && styles.stepNavTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stepNavBtn, currentStep === totalSteps && styles.stepNavBtnDisabled]}
          onPress={() => setCurrentStep(p => Math.min(totalSteps, p + 1))}
          disabled={currentStep === totalSteps}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepNavText, currentStep === totalSteps && styles.stepNavTextDisabled]}>Next</Text>
          <Ionicons name="arrow-forward" size={16} color={currentStep === totalSteps ? Colors.textMuted : Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetFlow} activeOpacity={0.7}>
          <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
          <Text style={styles.resetBtnText}>Reset Flow</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.practiceBtn}
          onPress={() => navigation.navigate('Drill' as any, { screen: 'QuizMenu' })}
          activeOpacity={0.75}
        >
          <Ionicons name="fitness" size={16} color="#fff" />
          <Text style={styles.practiceBtnText}>Practice</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function FlowsScreen() {
  const navigation = useNavigation<Nav>();
  const flows = getAllFlows();
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);

  function handleSelectFlow(flow: Flow) {
    setActiveFlow(flow);
  }

  function handleBack() {
    setActiveFlow(null);
  }

  if (activeFlow) {
    return (
      <SafeAreaView style={styles.safe}>
        <FlowDetailView
          flow={activeFlow}
          navigation={navigation}
          onBack={handleBack}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenLabel}>REAL-WORLD FLOWS</Text>
        <Text style={styles.screenSub}>Guided scenario sequences for real emergencies</Text>

        {flows.map(flow => (
          <FlowCard
            key={flow.id}
            flow={flow}
            onPress={() => handleSelectFlow(flow)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: { flex: 1 },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Screen header
  screenLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  screenSub: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },

  // Flow list card
  flowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 12,
  },
  flowIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flowCardContent: {
    flex: 1,
    gap: 3,
  },
  flowTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  flowMeta: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  flowDescription: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  // Detail view
  detailScroll: { flex: 1 },
  detailContent: {
    padding: 16,
    paddingBottom: 48,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  detailIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  detailMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  detailDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },

  // Progress
  progressSection: {
    marginBottom: 16,
    gap: 6,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Step pills
  stepPillsScroll: {
    marginBottom: 16,
  },
  stepPillsContent: {
    gap: 8,
    paddingRight: 4,
  },
  stepPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepPillDone: {
    backgroundColor: Colors.secondaryDim,
    borderColor: Colors.secondary,
  },
  stepPillNum: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepPillNumActive: {
    color: '#fff',
  },

  // Step detail card
  stepDetailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16,
    gap: 8,
  },
  stepNum: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  stepDetailTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  stepDetailSummary: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  checklistContainer: {
    gap: 10,
    marginTop: 4,
  },

  // Checklist item
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkItemText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    paddingTop: 1,
  },
  checkItemChecked: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },

  // View guide button
  viewGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  viewGuideBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // Step navigation
  stepNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stepNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  stepNavBtnDisabled: {
    opacity: 0.4,
  },
  stepNavText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  stepNavTextDisabled: {
    color: Colors.textMuted,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  resetBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  practiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: Colors.primaryDim,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  practiceBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
