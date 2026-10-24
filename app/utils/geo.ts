/**
 * geo.ts — one place to ask the device for a position.
 *
 * Android's fused provider pops Google's "Location Accuracy" resolution dialog
 * on every getCurrentPositionAsync() call while that setting is off. The Map
 * screen polls every 5 s, so a user who tapped "No thanks" was asked again five
 * seconds later, forever (seen on the emulator 2026-10-24). The dialog is now
 * offered once per app session; later calls pass mayShowUserSettingsDialog:false
 * and simply use whatever providers are enabled.
 */
import * as Location from 'expo-location';

let settingsDialogOffered = false;

/** Reset for tests. */
export function _resetGeoForTests(): void {
  settingsDialogOffered = false;
}

/** True once the accuracy dialog has been offered this session. */
export function hasOfferedSettingsDialog(): boolean {
  return settingsDialogOffered;
}

/**
 * getCurrentPositionAsync with the accuracy dialog offered at most once per session.
 * Pass mayShowUserSettingsDialog:false to never offer it from a given call site.
 */
export async function getPosition(opts: Location.LocationOptions = {}): Promise<Location.LocationObject> {
  const wantsDialog = opts.mayShowUserSettingsDialog ?? true;
  const allow = wantsDialog && !settingsDialogOffered;
  if (wantsDialog) settingsDialogOffered = true;
  return Location.getCurrentPositionAsync({ ...opts, mayShowUserSettingsDialog: allow });
}
