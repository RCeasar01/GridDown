/**
 * TriageScreen - walks the user through a deterministic triage tree.
 *
 * Route params: { treeId?: string }. Without a treeId it lists all available
 * protocols. Works fully offline and does not depend on the AI model.
 * Design rules: big tap targets, one decision per screen, plain words,
 * high-contrast danger colors, always a way back.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getAvailableTrees, getTreeById } from '../triage/registry';
import {
  startSession, choose, advance, back, canGoBack, currentNode, handoffLog, type TriageSession,
} from '../triage/engine';
import type { EndNode, TriageTree } from '../triage/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const OUTCOME_STYLE: Record<EndNode['outcome'], { color: string; bg: string; label: string }> = {
  stable: { color: Colors.success, bg: Colors.successBg, label: 'STABLE' },
  monitor: { color: Colors.info, bg: Colors.infoBg, label: 'MONITOR' },
  evacuate: { color: Colors.warning, bg: Colors.warningBg, label: 'GET TO CARE' },
  critical: { color: Colors.danger, bg: Colors.dangerBg, label: 'CRITICAL' },
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Countdown for "hold pressure 10 minutes" style steps. Resets when the step changes. */
function StepTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState<number | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (interval.current) clearInterval(interval.current); }, []);

  const start = () => {
    if (interval.current) clearInterval(interval.current);
    setLeft(seconds);
    interval.current = setInterval(() => {
      setLeft((v) => {
        if (v === null || v <= 1) {
          if (interval.current) clearInterval(interval.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  };

  return (
    <TouchableOpacity style={styles.timer} onPress={start} accessibilityRole="button"
      accessibilityLabel={left === null ? `Start ${formatTime(seconds)} timer` : `Timer ${formatTime(left)} remaining. Tap to restart.`}>
      <Ionicons name="timer-outline" size={22} color={Colors.warning} />
      <Text style={styles.timerText}>
        {left === null ? `Start ${formatTime(seconds)} timer` : left === 0 ? 'Time is up' : formatTime(left)}
      </Text>
    </TouchableOpacity>
  );
}

function DraftBadge({ tree }: { tree: TriageTree }) {
  if (tree.reviewStatus === 'reviewed') return null;
  return (
    <View style={styles.draftBadge}>
      <Text style={styles.draftText}>DRAFT - NOT YET CLINICALLY REVIEWED (dev builds only)</Text>
    </View>
  );
}

function TreeList({ onPick }: { onPick: (id: string) => void }) {
  const trees = getAvailableTrees();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.listIntro}>
        Step-by-step emergency protocols. They work offline and give the same answer every time.
      </Text>
      {trees.length === 0 && (
        <Text style={styles.empty}>No protocols are available in this build yet.</Text>
      )}
      {trees.map((t) => (
        <TouchableOpacity key={t.id} style={styles.treeCard} onPress={() => onPick(t.id)}
          accessibilityRole="button" accessibilityLabel={`Open ${t.title} protocol`}>
          <Ionicons name={t.icon as IconName} size={28} color={Colors.danger} />
          <View style={styles.treeCardBody}>
            <Text style={styles.treeTitle}>{t.title}</Text>
            <Text style={styles.treeSummary}>{t.summary}</Text>
            {t.reviewStatus === 'draft' && <Text style={styles.treeDraft}>DRAFT</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
      <Text style={styles.disclaimer}>
        Educational reference, not medical advice. Call emergency services whenever you can.
      </Text>
    </ScrollView>
  );
}

function TreeRunner({ tree, onSwitch }: { tree: TriageTree; onSwitch: (id: string) => void }) {
  const [session, setSession] = useState<TriageSession>(() => startSession(tree));
  const scrollRef = useRef<ScrollView>(null);
  const node = currentNode(tree, session);

  useEffect(() => { setSession(startSession(tree)); }, [tree]);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [session.path.length]);

  const isStart = session.path.length === 1;

  return (
    <View style={styles.flex}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <DraftBadge tree={tree} />
        {isStart && (
          <View style={styles.firstLine}>
            <Ionicons name="call" size={20} color={Colors.danger} />
            <Text style={styles.firstLineText}>{tree.firstLine}</Text>
          </View>
        )}

        {node.type === 'question' && (
          <View>
            <Text style={styles.prompt}>{node.prompt}</Text>
            {node.help ? <Text style={styles.help}>{node.help}</Text> : null}
            {node.options.map((o, i) => (
              <TouchableOpacity key={o.label} style={styles.option}
                onPress={() => setSession((s) => choose(tree, s, i))}
                accessibilityRole="button" accessibilityLabel={o.label}>
                <Text style={styles.optionText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {node.type === 'action' && (
          <View>
            <Text style={styles.actionTitle}>{node.title}</Text>
            {node.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            {node.timerSeconds ? <StepTimer key={node.id} seconds={node.timerSeconds} /> : null}
            {node.doNot && node.doNot.length > 0 && (
              <View style={styles.doNot}>
                <Text style={styles.doNotTitle}>DO NOT</Text>
                {node.doNot.map((d, i) => <Text key={i} style={styles.doNotText}>{'\u2022'} {d}</Text>)}
              </View>
            )}
            <TouchableOpacity style={styles.continueBtn} onPress={() => setSession((s) => advance(tree, s))}
              accessibilityRole="button">
              <Text style={styles.continueText}>{node.continueLabel ?? 'Done - next'}</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {node.type === 'end' && (
          <View>
            <View style={[styles.outcome, { backgroundColor: OUTCOME_STYLE[node.outcome].bg, borderColor: OUTCOME_STYLE[node.outcome].color }]}>
              <Text style={[styles.outcomeLabel, { color: OUTCOME_STYLE[node.outcome].color }]}>{OUTCOME_STYLE[node.outcome].label}</Text>
              <Text style={styles.outcomeTitle}>{node.title}</Text>
            </View>
            {node.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={styles.stepNum}>{'\u2022'}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            {node.switchToTree && getTreeById(node.switchToTree) && (
              <TouchableOpacity style={[styles.continueBtn, { backgroundColor: Colors.danger }]}
                onPress={() => onSwitch(node.switchToTree!)} accessibilityRole="button">
                <Text style={styles.continueText}>Open {getTreeById(node.switchToTree)!.title} protocol</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.textOnPrimary} />
              </TouchableOpacity>
            )}
            <View style={styles.log}>
              <Text style={styles.logTitle}>HANDOFF LOG</Text>
              <Text style={styles.logText}>{handoffLog(tree, session)}</Text>
              <TouchableOpacity style={styles.shareBtn}
                onPress={() => Share.share({ message: handoffLog(tree, session) }).catch(() => undefined)}
                accessibilityRole="button" accessibilityLabel="Share handoff log">
                <Ionicons name="share-outline" size={18} color={Colors.primary} />
                <Text style={styles.shareText}>Share log</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sourceLine}>Based on: {tree.sources.join('; ')}. v{tree.version}</Text>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.barBtn, !canGoBack(session) && styles.barBtnDisabled]}
          disabled={!canGoBack(session)} onPress={() => setSession((s) => back(s))}
          accessibilityRole="button" accessibilityLabel="Back one step">
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          <Text style={styles.barText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.barBtn} onPress={() => setSession(startSession(tree))}
          accessibilityRole="button" accessibilityLabel="Restart protocol">
          <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
          <Text style={styles.barText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function TriageScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ Triage: { treeId?: string } | undefined }, 'Triage'>>();
  const [treeId, setTreeId] = useState<string | undefined>(route.params?.treeId);
  const tree = useMemo(() => (treeId ? getTreeById(treeId) : undefined), [treeId]);

  useEffect(() => {
    navigation.setOptions({ title: tree ? tree.title : 'Emergency Protocols' });
  }, [navigation, tree]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {tree ? <TreeRunner tree={tree} onSwitch={setTreeId} /> : <TreeList onPick={setTreeId} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  listIntro: { color: Colors.textSecondary, fontSize: 15, marginBottom: 16, lineHeight: 21 },
  empty: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginVertical: 24 },
  treeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface,
    borderColor: Colors.cardBorder, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12,
  },
  treeCardBody: { flex: 1 },
  treeTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  treeSummary: { color: Colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 19 },
  treeDraft: { color: Colors.warning, fontSize: 11, fontWeight: '700', marginTop: 6 },
  disclaimer: { color: Colors.textMuted, fontSize: 12, marginTop: 16, textAlign: 'center' },
  draftBadge: { backgroundColor: Colors.warningBg, borderColor: Colors.warning, borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 12 },
  draftText: { color: Colors.warning, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  firstLine: {
    flexDirection: 'row', gap: 10, backgroundColor: Colors.dangerBg, borderColor: Colors.danger,
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 20,
  },
  firstLineText: { flex: 1, color: Colors.textPrimary, fontSize: 15, lineHeight: 21, fontWeight: '600' },
  prompt: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800', lineHeight: 30, marginBottom: 10 },
  help: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, marginBottom: 18 },
  option: {
    backgroundColor: Colors.surfaceElevated, borderColor: Colors.primary, borderWidth: 2,
    borderRadius: 12, paddingVertical: 18, paddingHorizontal: 16, marginBottom: 12, minHeight: 64, justifyContent: 'center',
  },
  optionText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '700' },
  actionTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 14 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: { color: Colors.primary, fontSize: 17, fontWeight: '800', width: 22, textAlign: 'right' },
  stepText: { flex: 1, color: Colors.textPrimary, fontSize: 17, lineHeight: 24 },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', backgroundColor: Colors.warningBg,
    borderColor: Colors.warning, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 8,
  },
  timerText: { color: Colors.warning, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  doNot: { backgroundColor: Colors.dangerBg, borderLeftColor: Colors.danger, borderLeftWidth: 4, borderRadius: 8, padding: 12, marginTop: 10 },
  doNotTitle: { color: Colors.danger, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  doNotText: { color: Colors.textPrimary, fontSize: 15, lineHeight: 21, marginBottom: 4 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary,
    borderRadius: 12, paddingVertical: 18, marginTop: 20, minHeight: 60,
  },
  continueText: { color: Colors.textOnPrimary, fontSize: 18, fontWeight: '800' },
  outcome: { borderWidth: 2, borderRadius: 12, padding: 14, marginBottom: 16 },
  outcomeLabel: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  outcomeTitle: { color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  log: { backgroundColor: Colors.surface, borderColor: Colors.cardBorder, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 20 },
  logTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  logText: { color: Colors.textPrimary, fontSize: 13, lineHeight: 19 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  shareText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  sourceLine: { color: Colors.textMuted, fontSize: 11, marginTop: 24 },
  bottomBar: {
    flexDirection: 'row', borderTopColor: Colors.divider, borderTopWidth: 1, backgroundColor: Colors.surface,
  },
  barBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  barBtnDisabled: { opacity: 0.35 },
  barText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
