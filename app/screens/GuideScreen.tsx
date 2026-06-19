import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { isModelDownloaded, translateText, type SupportedLanguage } from '../utils/translation';
import { getCachedTranslation, cacheTranslation } from '../db/contentLoader';

export interface GuideStep { step: number; title: string; body: string; }
export interface GuideData {
  id: string;
  category: string;
  title: string;
  priority: string;
  tags: string[];
  summary: string;
  steps: GuideStep[];
  warnings: string[];
  proTips: string[];
  relatedGuides: string[];
  /** Set true on any guide requiring the medical disclaimer, regardless of category. */
  requiresMedicalDisclaimer?: boolean;
}

interface TranslatedGuideContent {
  steps: GuideStep[];
  warnings: string[];
  proTips: string[];
}

interface Props { guide: GuideData; }

async function translateAndCache(
  text: string, lang: SupportedLanguage, guideId: string, field: string,
): Promise<string> {
  const cached = await getCachedTranslation(guideId, lang, field);
  if (cached !== null) return cached;
  const result = await translateText(text, lang);
  if (result !== text) await cacheTranslation(guideId, lang, field, result);
  return result;
}

export function GuideScreen({ guide }: Props) {
  const { t } = useTranslation();
  const { selectedLanguage, translateContentEnabled } = useAppStore();

  const [showingOriginal, setShowingOriginal] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<TranslatedGuideContent | null>(null);
  const [modelAvailable, setModelAvailable] = useState(false);

  const canTranslate = selectedLanguage !== 'en' && translateContentEnabled;
  const showMedicalDisclaimer =
    guide.category === 'medical' || guide.requiresMedicalDisclaimer === true;

  const checkModel = useCallback(async () => {
    if (!canTranslate) return;
    const lang = selectedLanguage as SupportedLanguage;
    const available = await isModelDownloaded(lang);
    setModelAvailable(available);
  }, [canTranslate, selectedLanguage]);

  const loadTranslations = useCallback(async () => {
    if (!canTranslate || !modelAvailable) return;
    setTranslating(true);
    try {
      const lang = selectedLanguage as SupportedLanguage;
      const tSteps = await Promise.all(
        guide.steps.map(async (step) => ({
          step: step.step,
          title: await translateAndCache(step.title, lang, guide.id, `step_${step.step}_title`),
          body: await translateAndCache(step.body, lang, guide.id, `step_${step.step}_body`),
        }))
      );
      const tWarnings = await Promise.all(
        guide.warnings.map((w, i) => translateAndCache(w, lang, guide.id, `warning_${i}`))
      );
      const tTips = await Promise.all(
        guide.proTips.map((tip, i) => translateAndCache(tip, lang, guide.id, `tip_${i}`))
      );
      setTranslated({ steps: tSteps, warnings: tWarnings, proTips: tTips });
      setShowingOriginal(false);
    } catch (err) {
      console.warn('[GuideScreen] Translation error:', err);
    } finally {
      setTranslating(false);
    }
  }, [canTranslate, modelAvailable, selectedLanguage, guide]);

  useEffect(() => { void checkModel(); }, [checkModel]);

  const displaySteps = (!showingOriginal && translated) ? translated.steps : guide.steps;
  const displayWarnings = (!showingOriginal && translated) ? translated.warnings : guide.warnings;
  const displayTips = (!showingOriginal && translated) ? translated.proTips : guide.proTips;

  const PRIORITY_COLORS: Record<string, string> = {
    critical: '#E8642A', advanced: '#F5A623', beginner: '#4CAF50',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[guide.priority] ?? '#888' }]}>
        <Text style={styles.priorityText}>{guide.priority.toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>{guide.title}</Text>
      <Text style={styles.summary}>{guide.summary}</Text>

      {/*
        Apple App Store Guideline 5.1.1 — Medical Content
        Disclaimer must appear BEFORE the first step, inline, and non-dismissable.
        This renders for all guides with category 'medical' OR requiresMedicalDisclaimer === true.
      */}
      {showMedicalDisclaimer && (
        <View style={styles.medicalDisclaimer} accessibilityRole="text" accessibilityLabel="Medical disclaimer">
          <View style={styles.medicalDisclaimerHeader}>
            <Text style={styles.medicalDisclaimerIcon}>⚕</Text>
            <Text style={styles.medicalDisclaimerTitle}>MEDICAL INFORMATION — EMERGENCY REFERENCE ONLY</Text>
          </View>
          <Text style={styles.medicalDisclaimerBody}>
            This guide is intended for emergency use when professional medical care is unavailable.
            It is NOT a substitute for professional medical advice, diagnosis, or treatment.
            Always seek qualified medical care whenever possible.
          </Text>
        </View>
      )}

      {/* Translation Bar */}
      {canTranslate && (
        <View style={styles.translateBar}>
          {translating ? (
            <View style={styles.translateRow}>
              <ActivityIndicator size="small" color="#E8642A" />
              <Text style={styles.translatingText}>{t('guide.translating')}</Text>
            </View>
          ) : !modelAvailable ? (
            <Text style={styles.unavailableText}>{t('guide.translationUnavailable')}</Text>
          ) : (
            <TouchableOpacity
              style={styles.translateBtn}
              onPress={() => {
                if (showingOriginal && !translated) { void loadTranslations(); }
                else { setShowingOriginal((prev) => !prev); }
              }}
              accessibilityLabel={showingOriginal ? 'View translated guide' : 'View original guide'}
              accessibilityRole="button"
            >
              <Text style={styles.translateBtnText}>
                {showingOriginal ? t('guide.viewTranslated') : t('guide.viewOriginal')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Steps */}
      <Text style={styles.sectionHeader}>{t('guide.procedure')}</Text>
      {displaySteps.map((step) => (
        <View key={step.step} style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{step.step}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        </View>
      ))}

      {/* Warnings */}
      {displayWarnings.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>{t('guide.warnings')}</Text>
          {displayWarnings.map((warning, i) => (
            <View key={i} style={styles.warningCard}>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </>
      )}

      {/* Pro Tips */}
      {displayTips.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>{t('guide.proTips')}</Text>
          {displayTips.map((tip, i) => (
            <View key={i} style={styles.tipCard}>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </>
      )}

      {/* Credential Banner */}
      <View style={styles.credBanner}>
        <Text style={styles.credText}>{t('guide.credentialBanner')}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: 16 },
  priorityBadge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#F0F0F0', marginBottom: 8 },
  summary: { fontSize: 14, color: '#AAA', lineHeight: 20, marginBottom: 16 },
  // Medical disclaimer: non-dismissable inline banner, BEFORE first step (Apple 5.1.1)
  medicalDisclaimer: {
    backgroundColor: '#1A0D08',
    borderWidth: 1,
    borderColor: '#E8642A',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  medicalDisclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  medicalDisclaimerIcon: { fontSize: 16 },
  medicalDisclaimerTitle: {
    color: '#E8642A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  medicalDisclaimerBody: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 19,
  },
  translateBar: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  translateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  translatingText: { color: '#888', fontSize: 13 },
  unavailableText: { color: '#666', fontSize: 13, fontStyle: 'italic' },
  translateBtn: { alignSelf: 'flex-start', backgroundColor: '#E8642A', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  translateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1.5, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  stepCard: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 10, marginBottom: 8, padding: 12, gap: 12, borderWidth: 1, borderColor: '#222' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8642A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#F0F0F0', marginBottom: 4 },
  stepBody: { fontSize: 13, color: '#AAA', lineHeight: 19 },
  warningCard: { backgroundColor: '#1A1000', borderLeftWidth: 3, borderLeftColor: '#F5A623', padding: 12, borderRadius: 6, marginBottom: 8 },
  warningText: { color: '#E0C080', fontSize: 13, lineHeight: 18 },
  tipCard: { backgroundColor: '#0A1A0A', borderLeftWidth: 3, borderLeftColor: '#4CAF50', padding: 12, borderRadius: 6, marginBottom: 8 },
  tipText: { color: '#90C090', fontSize: 13, lineHeight: 18 },
  credBanner: { backgroundColor: '#111', borderRadius: 8, padding: 12, marginTop: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  credText: { color: '#666', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});
