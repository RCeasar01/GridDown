export const Colors = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#222222',
  surfaceBorder: '#2A2A2A',

  // Accents
  primary: '#8B9E67',       // Light OD Green
  primaryDim: '#3D4C2E',    // Dimmed OD Green for backgrounds / overlays
  secondary: '#4A7C59',     // Survival green
  secondaryDim: '#1E3325',  // Dimmed green for backgrounds

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textMuted: '#555555',
  textOnPrimary: '#FFFFFF',

  // Semantic — danger/warning keep high-visibility colors for safety
  danger: '#CC3300',
  dangerBg: '#2A0800',
  success: '#4A7C59',
  successBg: '#0D1F14',
  warning: '#D4A017',
  warningBg: '#2A200A',
  info: '#3A8FC4',
  infoBg: '#0D1E2A',

  // UI elements
  tabBar: '#111111',
  tabBarBorder: '#2A2A2A',
  tabActive: '#8B9E67',     // OD Green
  tabInactive: '#555555',
  divider: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.8)',
  cardBorder: '#2A2A2A',

  // Priority indicators
  priorityCritical: '#CC3300',  // Red — critical danger
  priorityAdvanced: '#D4A017',  // Amber
  priorityBeginner: '#4A7C59', // Green
};

export type ColorKey = keyof typeof Colors;

export const NightOpsColors = {
  background: '#050505',
  surface: '#0D0D0D',
  surfaceElevated: '#111111',
  textPrimary: '#C0C0C0',
  textSecondary: '#707070',
  textMuted: '#404040',
  primary: '#6A7E4A',      // Dimmed OD Green
  primaryDim: '#2A3A1E',
  secondary: '#3A5E44',    // Dimmed survival green
  tabBar: '#080808',
  tabBarBorder: '#1A1A1A',
  tabActive: '#6A7E4A',
  divider: '#1A1A1A',
  cardBorder: '#1A1A1A',
};
