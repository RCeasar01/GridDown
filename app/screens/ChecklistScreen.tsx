import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { setChecklistItem, getChecklistState, resetChecklist } from '../db/contentLoader';
import { getAllChecklists } from '../utils/checklistRegistry';

export function ChecklistScreen() {
  const checklists = getAllChecklists();
  const [activeId, setActiveId] = useState(checklists[0]?.id ?? 'hurricane');
  const [state, setState] = useState<Record<string, boolean>>({});

  const active = checklists.find((c) => c.id === activeId);

  useEffect(() => {
    if (activeId) {
      getChecklistState(activeId).then(setState);
    }
  }, [activeId]);

  const toggle = async (itemId: string) => {
    const newVal = !state[itemId];
    setState((s) => ({ ...s, [itemId]: newVal }));
    await setChecklistItem(activeId, itemId, newVal);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Checklist',
      `Clear all checkmarks for ${active?.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetChecklist(activeId);
            setState({});
          },
        },
      ],
    );
  };

  const checkedCount = active ? active.items.filter((i) => state[i.id]).length : 0;
  const totalCount = active?.items.length ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Checklist selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {checklists.map((cl) => (
          <TouchableOpacity
            key={cl.id}
            style={[styles.tab, activeId === cl.id && styles.tabActive]}
            onPress={() => setActiveId(cl.id)}
          >
            <Text style={[styles.tabText, activeId === cl.id && styles.tabTextActive]}>
              {cl.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Progress bar */}
      {active && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {checkedCount} / {totalCount} COMPLETE
            </Text>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Ionicons name="refresh" size={14} color={Colors.textSecondary} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Items */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {active?.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, state[item.id] && styles.itemChecked]}
            onPress={() => toggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, state[item.id] && styles.checkboxChecked]}>
              {state[item.id] && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemText, state[item.id] && styles.itemTextDone]}>
                {item.text}
              </Text>
              {item.critical && !state[item.id] && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalText}>CRITICAL</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  tabRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.primaryDim, borderColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  progressSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { color: Colors.textSecondary, fontSize: 12 },
  progressBar: { height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  list: { padding: 16, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    minHeight: 48,
  },
  itemChecked: { borderColor: Colors.secondary, backgroundColor: Colors.successBg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  itemContent: { flex: 1, gap: 4 },
  itemText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 20 },
  itemTextDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  criticalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  criticalText: { color: Colors.danger, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
