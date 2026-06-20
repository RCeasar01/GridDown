import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { isModelDownloaded, translateText, type SupportedLanguage } from '../utils/translation';
import {
  getCachedTranslation, cacheTranslation,
  getKits, addGuideToKit, removeGuideFromKit, getAllKitGuidesMapped, KitRow,
} from '../db/contentLoader';
import { getGuideById } from '../utils/guideRegistry';

export interface GuideStep { step: number; title: string; body: string; }
export interface GuideData {
  id: string; category: string; title: string;
  priority: string; tags: string[]; summary: string;
  steps: GuideStep[]; warnings: string[]; proTips: string[]; relatedGuides: string[];
  // Phase 3 — quickGlance
  quickGlance?: {
    situation: string;
    immediate: string[];
    then: string[];
  };
  // Phase 4 — Provenance metadata
  source?: string;
  lastReviewed?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  gearRequired?: 'none' | 'basic_edc' | 'advanced_kit';
  riskLevel?: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  whenNotTo?: string[];
  requiresMedicalDisclaimer?: boolean;
}

interface TranslatedGuideContent {
  steps: GuideStep[];
  warnings: string[];
  proTips: string[];
}

type GuideRoute = RouteProp<{ Guide: { guideId: string } }, 'Guide'>;

async function translateAndCache(
  text: string, lang: SupportedLanguage, guideId: string, field: string,
): Promise<string> {
  const cached = await getCachedTranslation(guideId, lang, field);
  if (cached !== null) return cached;
  const result = await translateText(text, lang);
  if (result !== text) await cacheTranslation(guideId, lang, field, result);
  return result;
}

const SKILL_COLORS: Record<string, string> = {
  beginner: '#4CAF50',
  intermediate: '#F5A623',
  advanced: '#8B9E67',
};

const SKILL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const GEAR_LABELS: Record<string, string> = {
  none: 'No Gear',
  basic_edc: 'Basic EDC',
  advanced_kit: 'Advanced Kit',
};

const GEAR_ICONS: Record<string, string> = {
  none: '✓',
  basic_edc: '🎒',
  advanced_kit: '⚙',
};


export function GuideScreen() {
  const route = useRoute<GuideRoute>();
  const guide = getGuideById(route.params.guideId);
  const { t } = useTranslation();
  const { selectedLanguage, translateContentEnabled } = useAppStore();

  const [showingOriginal, setShowingOriginal] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<TranslatedGuideContent | null>(null);
  const [modelAvailable, setModelAvailable] = useState(false);

  // Kit state
  const [kits, setKits] = useState<KitRow[]>([]);
  const [guideKitIds, setGuideKitIds] = useState<string[]>([]);
  const [showKitModal, setShowKitModal] = useState(false);
  const [kitLoading, setKitLoading] = useState(false);

  if (!guide) {
    return <View style={{ flex: 1, backgroundColor: '#0D0D0D' }} />;
  }

  const canTranslate = selectedLanguage !== 'en' && translateContentEnabled;
  const isMedical = guide.category === 'medical' || guide.requiresMedicalDisclaimer === true;

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

  // Load kit membership on mount
  useEffect(() => {
    void (async () => {
      try {
        const allKits = await getKits();
        setKits(allKits);
        // Determine which kits contain this guide by checking kit_guides via getAllKitGuidesMapped
        // We call getKitGuides per kit to find memberships
        const mapped = await getAllKitGuidesMapped();
        const memberKitIds = allKits
          .filter((k) => (mapped[k.id] ?? []).includes(guide.id))
          .map((k) => k.id);
        setGuideKitIds(memberKitIds);
      } catch (err) {
        console.warn('[GuideScreen] kit load error:', err);
      }
    })();
  }, [guide.id]);

  const handleToggleKitMembership = async (kitId: string) => {
    setKitLoading(true);
    try {
      if (guideKitIds.includes(kitId)) {
        await removeGuideFromKit(kitId, guide.id);
        setGuideKitIds((prev) => prev.filter((id) => id !== kitId));
      } else {
        await addGuideToKit(kitId, guide.id);
        setGuideKitIds((prev) => [...prev, kitId]);
      }
    } catch (err) {
      console.warn('[GuideScreen] toggleKitMembership error:', err);
    } finally {
      setKitLoading(false);
    }
  };

  const displaySteps = (!showingOriginal && translated) ? translated.steps : guide.steps;
  const displayWarnings = (!showingOriginal && translated) ? translated.warnings : guide.warnings;
  const displayTips = (!showingOriginal && translated) ? translated.proTips : guide.proTips;

  const PRIORITY_COLORS: Record<string, string> = {
    critical: '#8B9E67', advanced: '#F5A623', beginner: '#4CAF50',
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Priority badge + title row */}
      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[guide.priority] ?? '#888' }]}>
        <Text style={styles.priorityText}>{guide.priority.toUpperCase()}</Text>
      </View>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { flex: 1 }]}>{guide.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowKitModal(true)}
            style={styles.kitBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.kitBtnText}>{guideKitIds.length > 0 ? '🎒✓' : '🎒+'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kit Modal */}
      <Modal
        visible={showKitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKitModal(false)}
      >
        <View style={styles.kitModalOverlay}>
          <View style={styles.kitModalCard}>
            <Text style={styles.kitModalTitle}>Add to Kit</Text>
            <Text style={styles.kitModalSub}>Select kits that should include this guide:</Text>
            {kits.map((kit) => {
              const isIn = guideKitIds.includes(kit.id);
              return (
                <TouchableOpacity
                  key={kit.id}
                  style={styles.kitModalRow}
                  onPress={() => { void handleToggleKitMembership(kit.id); }}
                  activeOpacity={0.75}
                  disabled={kitLoading}
                >
                  <Text style={styles.kitModalRowLabel}>{kit.icon} {kit.name}</Text>
                  <Text style={styles.kitModalRowCheck}>{isIn ? '✓' : '○'}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.kitModalDoneBtn}
              onPress={() => setShowKitModal(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.kitModalDoneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Metadata chips (skill level + gear required) */}
      {(guide.skillLevel || guide.gearRequired) && (
        <View style={styles.metaRow}>
          {guide.skillLevel && (
            <View style={[styles.metaChip, { borderColor: SKILL_COLORS[guide.skillLevel] ?? '#888' }]}>
              <Text style={[styles.metaChipText, { color: SKILL_COLORS[guide.skillLevel] ?? '#888' }]}>
                {SKILL_LABELS[guide.skillLevel] ?? guide.skillLevel}
              </Text>
            </View>
          )}
          {guide.gearRequired && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {GEAR_ICONS[guide.gearRequired]} {GEAR_LABELS[guide.gearRequired] ?? guide.gearRequired}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 3. Source / lastReviewed line */}
      {(guide.source || guide.lastReviewed) && (
        <Text style={styles.sourceText}>
          {guide.source ? `${guide.source}` : ''}
          {guide.source && guide.lastReviewed ? ' · ' : ''}
          {guide.lastReviewed ? `Updated: ${guide.lastReviewed}` : ''}
        </Text>
      )}

      {/* Summary */}
      <Text style={styles.summary}>{guide.summary}</Text>

      {/* 4. Medical non-dismissable red disclaimer box */}
      {isMedical && (
        <View style={styles.medicalDisclaimerBox}>
          <Text style={styles.medicalDisclaimerTitle}>⚠ NOT MEDICAL ADVICE</Text>
          <Text style={styles.medicalDisclaimerBody}>
            This is educational training content only.{'\n'}
            Use only when professional care is unavailable or delayed.{'\n'}
            Incorrect technique can cause harm.{'\n'}
            Seek emergency services immediately when accessible.
          </Text>
        </View>
      )}

      {/* 5. whenNotTo orange warning box */}
      {guide.whenNotTo && guide.whenNotTo.length > 0 && (
        <View style={styles.whenNotToBox}>
          <Text style={styles.whenNotToTitle}>⚠ WHEN NOT TO DO THIS</Text>
          {guide.whenNotTo.map((item, i) => (
            <View key={i} style={styles.whenNotToItem}>
              <Text style={styles.whenNotToBullet}>•</Text>
              <Text style={styles.whenNotToText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 6. quickGlance section */}
      {guide.quickGlance && (
        <View style={styles.quickGlanceBox}>
          <Text style={styles.quickGlanceLabel}>SITUATION</Text>
          <Text style={styles.quickGlanceSituation}>{guide.quickGlance.situation}</Text>

          <Text style={styles.quickGlanceLabel}>IMMEDIATE PRIORITIES</Text>
          {guide.quickGlance.immediate.map((item, i) => (
            <View key={i} style={styles.immediateRow}>
              <Text style={styles.immediateNumber}>{i + 1}</Text>
              <Text style={styles.immediateText}>{item}</Text>
            </View>
          ))}

          {guide.quickGlance.then.length > 0 && (
            <>
              <Text style={styles.quickGlanceLabel}>THEN</Text>
              {guide.quickGlance.then.map((item, i) => (
                <Text key={i} style={styles.thenText}>→ {item}</Text>
              ))}
            </>
          )}
        </View>
      )}

      {/* Translation Bar */}
      {canTranslate && (
        <View style={styles.translateBar}>
          {translating ? (
            <View style={styles.translateRow}>
              <ActivityIndicator size="small" color="#8B9E67" />
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
            >
              <Text style={styles.translateBtnText}>
                {showingOriginal ? t('guide.viewTranslated') : t('guide.viewOriginal')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 9. Steps */}
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

      {/* 10. Warnings */}
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

      {/* 11. Pro Tips */}
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

      {/* 12. Credential Banner */}
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

  // Header
  priorityBadge: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: '#F0F0F0' },
  headerActions: { paddingTop: 2 },
  kitBtn: {
    backgroundColor: '#1A1A1A', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#333',
  },
  kitBtnText: { fontSize: 18 },

  // Kit modal
  kitModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  kitModalCard: {
    backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  kitModalTitle: { fontSize: 18, fontWeight: '800', color: '#F0F0F0', marginBottom: 4 },
  kitModalSub: { fontSize: 13, color: '#888', marginBottom: 16 },
  kitModalRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
  },
  kitModalRowLabel: { flex: 1, fontSize: 15, color: '#F0F0F0', fontWeight: '600' },
  kitModalRowCheck: { fontSize: 18, color: '#8B9E67', fontWeight: '700' },
  kitModalDoneBtn: {
    marginTop: 20, backgroundColor: '#8B9E67', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  kitModalDoneBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  // Metadata chips
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaChip: { borderWidth: 1, borderColor: '#444', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: '#AAA' },

  // Source line
  sourceText: { fontSize: 11, color: '#555', fontStyle: 'italic', marginBottom: 12 },

  // Summary
  summary: { fontSize: 14, color: '#AAA', lineHeight: 20, marginBottom: 16 },

  // Medical disclaimer (non-dismissable red box)
  medicalDisclaimerBox: {
    backgroundColor: '#1A0000',
    borderWidth: 2,
    borderColor: '#CC0000',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  medicalDisclaimerTitle: { color: '#CC0000', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  medicalDisclaimerBody: { color: '#CCC', fontSize: 13, lineHeight: 20 },

  // whenNotTo box
  whenNotToBox: {
    backgroundColor: '#1A0D00',
    borderWidth: 1,
    borderColor: '#8B9E67',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  whenNotToTitle: { color: '#8B9E67', fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  whenNotToItem: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  whenNotToBullet: { color: '#CC3300', fontSize: 14, fontWeight: '700', flexShrink: 0 },
  whenNotToText: { color: '#E0A080', fontSize: 13, lineHeight: 18, flex: 1 },

  // quickGlance box
  quickGlanceBox: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  quickGlanceLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 },
  quickGlanceSituation: { fontSize: 14, fontStyle: 'italic', color: '#888888', lineHeight: 20, marginBottom: 4 },
  immediateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  immediateNumber: { fontSize: 18, fontWeight: '800', color: '#8B9E67', width: 24, flexShrink: 0 },
  immediateText: { fontSize: 14, color: '#F0F0F0', lineHeight: 20, flex: 1 },
  thenText: { fontSize: 14, color: '#F0F0F0', lineHeight: 20, marginBottom: 4 },

  // Translation bar
  translateBar: { backgroundColor: '#1A1A1A', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  translateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  translatingText: { color: '#888', fontSize: 13 },
  unavailableText: { color: '#666', fontSize: 13, fontStyle: 'italic' },
  translateBtn: { alignSelf: 'flex-start', backgroundColor: '#8B9E67', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  translateBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Steps
  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1.5, marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  stepCard: { flexDirection: 'row', backgroundColor: '#141414', borderRadius: 10, marginBottom: 8, padding: 12, gap: 12, borderWidth: 1, borderColor: '#222' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8B9E67', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#F0F0F0', marginBottom: 4 },
  stepBody: { fontSize: 13, color: '#AAA', lineHeight: 19 },

  // Warnings
  warningCard: { backgroundColor: '#1A1000', borderLeftWidth: 3, borderLeftColor: '#F5A623', padding: 12, borderRadius: 6, marginBottom: 8 },
  warningText: { color: '#E0C080', fontSize: 13, lineHeight: 18 },

  // Pro Tips
  tipCard: { backgroundColor: '#0A1A0A', borderLeftWidth: 3, borderLeftColor: '#4CAF50', padding: 12, borderRadius: 6, marginBottom: 8 },
  tipText: { color: '#90C090', fontSize: 13, lineHeight: 18 },

  // Credential Banner
  credBanner: { backgroundColor: '#111', borderRadius: 8, padding: 12, marginTop: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  credText: { color: '#666', fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});
