import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Guide } from '../db/contentLoader';
import { Colors } from '../theme/colors';
import { priorityColor, priorityLabel, categoryIcon } from '../utils/helpers';

interface GuideCardProps {
  guide: Guide;
  onPress: () => void;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  compact?: boolean;
}

export function GuideCard({
  guide,
  onPress,
  isBookmarked = false,
  onBookmark,
  compact = false,
}: GuideCardProps) {
  const pColor = priorityColor(guide.priority);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Priority stripe */}
      <View style={[styles.stripe, { backgroundColor: pColor }]} />

      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryIcon}>{categoryIcon(guide.category)}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: pColor + '22', borderColor: pColor }]}>
              <Text style={[styles.priorityText, { color: pColor }]}>
                {priorityLabel(guide.priority)}
              </Text>
            </View>
          </View>
          {onBookmark && (
            <TouchableOpacity
              onPress={onBookmark}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.bookmarkBtn}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{guide.title}</Text>

        {/* Summary */}
        {!compact && (
          <Text style={styles.summary} numberOfLines={2}>{guide.summary}</Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.stepCount}>{guide.steps.length} steps</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardCompact: {
    width: 220,
    marginBottom: 0,
    marginRight: 12,
  },
  stripe: {
    width: 4,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 16,
  },
  priorityBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    padding: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  summary: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepCount: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
