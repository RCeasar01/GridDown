import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { priorityColor, priorityLabel } from '../utils/helpers';
import { getGuideById } from '../utils/guideRegistry';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Guide'>;
type Route = RouteProp<HomeStackParamList, 'Guide'>;

export function GuideScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { guideId } = route.params;
  const { isBookmarked, toggleBookmark, markViewed } = useAppStore();

  const guide = getGuideById(guideId);

  useEffect(() => {
    if (guide) markViewed(guide.id);
  }, [guideId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => guide && toggleBookmark(guide.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={guide && isBookmarked(guide.id) ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={Colors.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, [guide, guideId]);

  if (!guide) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Guide not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pColor = priorityColor(guide.priority);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Guide header */}
        <View style={styles.guideHeader}>
          <View style={[styles.priorityBar, { backgroundColor: pColor }]}>
            <Text style={styles.priorityBarText}>{priorityLabel(guide.priority)}</Text>
          </View>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.summary}>{guide.summary}</Text>
          {guide.category === 'medical' && (
            <View style={styles.credentialBanner}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.secondary} />
              <Text style={styles.credentialText}>
                Written by an Eagle First Responder and Military Preventive Medicine Specialist — 101st Airborne Division.
              </Text>
            </View>
          )}
        </View>

        {/* Medical disclaimer */}
        {guide.category === 'medical' && (
          <View style={styles.disclaimer}>
            <Ionicons name="warning-outline" size={16} color={Colors.warning} />
            <Text style={styles.disclaimerText}>
              This content is written for emergency situations where professional medical care is unavailable. It is not a substitute for professional medical treatment when treatment is accessible.
            </Text>
          </View>
        )}

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROCEDURE</Text>
          {guide.steps.map((step) => (
            <View key={step.step} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.step}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Warnings */}
        {guide.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ WARNINGS</Text>
            {guide.warnings.map((w, i) => (
              <View key={i} style={styles.warningCard}>
                <Ionicons name="warning" size={16} color={Colors.danger} />
                <Text style={styles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pro tips */}
        {guide.proTips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ PRO TIPS</Text>
            {guide.proTips.map((tip, i) => (
              <View key={i} style={styles.tipCard}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Related guides */}
        {guide.relatedGuides.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RELATED GUIDES</Text>
            {guide.relatedGuides.map((relId) => {
              const rel = getGuideById(relId);
              if (!rel) return null;
              return (
                <TouchableOpacity
                  key={relId}
                  style={styles.relatedCard}
                  onPress={() => navigation.replace('Guide', { guideId: relId })}
                >
                  <Text style={styles.relatedTitle}>{rel.title}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: Colors.textSecondary, fontSize: 16 },
  guideHeader: { gap: 10, marginBottom: 20 },
  priorityBar: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  priorityBarText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  summary: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  credentialBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.secondaryDim,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    padding: 10,
    alignItems: 'flex-start',
  },
  credentialText: { color: Colors.secondary, fontSize: 12, fontWeight: '600', flex: 1 },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  disclaimerText: { color: Colors.warning, fontSize: 12, lineHeight: 17, flex: 1 },
  section: { marginBottom: 24, gap: 10 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  stepNumber: {
    width: 44,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 14,
  },
  stepNumberText: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  stepBody: { flex: 1, padding: 14, gap: 6 },
  stepTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  stepText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19 },
  warningCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  warningText: { color: Colors.danger, fontSize: 13, lineHeight: 18, flex: 1 },
  tipCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  tipText: { color: Colors.secondary, fontSize: 13, lineHeight: 18, flex: 1 },
  relatedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
  },
  relatedTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 },
});
