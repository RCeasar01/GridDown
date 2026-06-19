export const Colors = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#222222',
  surfaceBorder: '#2A2A2A',

  // Accents
  primary: '#E8642A',       // Emergency orange
  primaryDim: '#7A3314',    // Dimmed orange for backgrounds
  secondary: '#4A7C59',     // Survival green
  secondaryDim: '#1E3325',  // Dimmed green for backgrounds

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textMuted: '#555555',
  textOnPrimary: '#FFFFFF',

  // Semantic
  danger: '#E8642A',
  dangerBg: '#2A1A0D',
  success: '#4A7C59',
  successBg: '#0D1F14',
  warning: '#D4A017',
  warningBg: '#2A200A',
  info: '#3A8FC4',
  infoBg: '#0D1E2A',

  // UI elements
  tabBar: '#111111',
  tabBarBorder: '#2A2A2A',
  tabActive: '#E8642A',
  tabInactive: '#555555',
  divider: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.8)',
  cardBorder: '#2A2A2A',

  // Priority indicators
  priorityCritical: '#E8642A',
  priorityAdvanced: '#D4A017',
  priorityBeginner: '#4A7C59',
};

export type ColorKey = keyof typeof Colors;
