/**
 * quickActions.ts — long-press the GridDown icon → "Emergency Mode" in one tap.
 *
 * Uses expo-quick-actions (iOS Home Screen Quick Actions / Android App Shortcuts).
 * Safe in Expo Go and on web: every call is wrapped and simply no-ops.
 */
import { openEmergencyMode } from '../navigation/AppNavigator';

const EMERGENCY_ID = 'emergency-mode';

export async function setupQuickActions(): Promise<void> {
  try {
    const QuickActions = await import('expo-quick-actions');
    if (!(await QuickActions.isSupported())) return;

    await QuickActions.setItems([
      {
        id: EMERGENCY_ID,
        title: 'Emergency Mode',
        subtitle: 'Large-print crisis guidance',
        // SF Symbol on iOS; Android falls back to the app icon.
        icon: 'symbol:exclamationmark.triangle.fill',
        params: { href: '/emergency' },
      },
    ]);

    // App was cold-started from the shortcut.
    if (QuickActions.initial?.id === EMERGENCY_ID) {
      // Navigation tree may not be mounted yet; retry briefly.
      let tries = 0;
      const tick = () => {
        tries += 1;
        openEmergencyMode();
        if (tries < 10) setTimeout(tick, 300);
      };
      setTimeout(tick, 300);
    }

    // App was already running in the background.
    QuickActions.addListener((action) => {
      if (action.id === EMERGENCY_ID) openEmergencyMode();
    });
  } catch {
    /* module not linked (Expo Go / web) */
  }
}
