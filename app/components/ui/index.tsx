/**
 * GridDown UI kit — the handful of primitives every screen is built from. Spacing is on a 4-px
 * grid, radii are 12/14, surfaces come from theme/colors.ts. Screens compose these rather than
 * styling cards and buttons one-off, so a change here restyles the whole app.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Icon, IconName } from './Icon';

export { Icon } from './Icon';
export type { IconName } from './Icon';

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const Radius = { sm: 10, md: 12, lg: 14, pill: 20 } as const;

// ── Card ─────────────────────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: 'surface' | 'subtle' | 'accent';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Card({ children, onPress, tone = 'surface', style, accessibilityLabel, accessibilityHint }: CardProps) {
  const toneStyle = tone === 'subtle' ? s.cardSubtle : tone === 'accent' ? s.cardAccent : s.cardSurface;
  if (!onPress) return <View style={[s.card, toneStyle, style]}>{children}</View>;
  return (
    <TouchableOpacity
      style={[s.card, toneStyle, style]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled, style, accessibilityLabel, accessibilityHint }: ButtonProps) {
  const bg = variant === 'primary' ? s.btnPrimary : variant === 'secondary' ? s.btnSecondary : s.btnGhost;
  const fg: TextStyle = variant === 'primary' ? s.btnPrimaryText : s.btnOtherText;
  const iconColor = variant === 'primary' ? Colors.background : Colors.primary;
  return (
    <TouchableOpacity
      style={[s.btn, bg, size === 'sm' && s.btnSm, disabled && s.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={iconColor} strokeWidth={2.2} /> : null}
      <Text style={[s.btnText, fg, size === 'sm' && s.btnTextSm]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── IconButton (header controls) ─────────────────────────────────────────────────────────────
export function IconButton({ icon, onPress, color = Colors.textSecondary, accessibilityLabel }: { icon: IconName; onPress: () => void; color?: string; accessibilityLabel: string }) {
  return (
    <TouchableOpacity style={s.iconBtn} onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Icon name={icon} size={18} color={color} />
    </TouchableOpacity>
  );
}

// ── SectionHeader ────────────────────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  tone?: 'accent' | 'muted';
  right?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, tone = 'muted', right, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionTitle, tone === 'accent' && { color: Colors.primary }]}>{title}</Text>
      {right ? <Text style={s.sectionRight}>{right}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Tile (icon + label, for grids and quick access) ──────────────────────────────────────────
interface TileProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  layout?: 'row' | 'column';
  tag?: string;
  style?: StyleProp<ViewStyle>;
}

export function Tile({ icon, label, onPress, layout = 'row', tag, style }: TileProps) {
  return (
    <TouchableOpacity
      style={[s.tile, layout === 'column' && s.tileColumn, style]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={tag ? `${label} (${tag})` : label}
    >
      <Icon name={icon} size={22} />
      <View style={layout === 'column' ? s.tileLabelColumn : s.tileLabelRow}>
        <Text style={[s.tileLabel, layout === 'column' && { textAlign: 'center' }]} numberOfLines={2}>{label}</Text>
        {tag ? <Text style={s.tileTag}>{tag}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────────────────────
export function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.chip} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={s.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Row (list row with icon, title, meta, chevron) ───────────────────────────────────────────
interface RowProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  leading?: React.ReactNode;
}

export function Row({ icon, title, subtitle, onPress, leading }: RowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}>
      {leading ?? (icon ? <Icon name={icon} size={22} /> : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.rowSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevronRight" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Space.lg },
  cardSurface: { backgroundColor: Colors.surface, borderColor: Colors.cardBorder },
  cardSubtle: { backgroundColor: '#141414', borderColor: Colors.cardBorder },
  cardAccent: { backgroundColor: '#141A10', borderColor: Colors.primaryDim },

  btn: { minHeight: 44, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSm: { minHeight: 40, paddingHorizontal: 14, paddingVertical: 8 },
  btnPrimary: { backgroundColor: Colors.primary },
  btnSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primaryDim },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  btnTextSm: { fontSize: 12 },
  btnPrimaryText: { color: Colors.background },
  btnOtherText: { color: Colors.primary },

  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: Space.sm + 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, color: Colors.textSecondary, flex: 1 },
  sectionRight: { fontSize: 11, color: Colors.textSecondary },
  sectionAction: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  tile: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg - 2, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, minHeight: 60 },
  tileColumn: { flexDirection: 'column', justifyContent: 'center', gap: Space.sm, paddingHorizontal: Space.sm },
  tileLabelRow: { flex: 1, gap: 2 },
  tileLabelColumn: { alignItems: 'center', gap: 2 },
  tileLabel: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 17 },
  tileTag: { color: Colors.warning, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: '#141414', borderWidth: 1, borderColor: Colors.cardBorder, minHeight: 40, justifyContent: 'center' },
  chipText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: 13, paddingHorizontal: Space.lg, minHeight: 56 },
  rowTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  rowSubtitle: { color: Colors.textSecondary, fontSize: 12 },
});
