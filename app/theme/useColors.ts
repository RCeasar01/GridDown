import { Colors, NightOpsColors } from './colors';
import { useAppStore } from '../store/useAppStore';

export function useColors() {
  const nightOpsEnabled = useAppStore((s) => s.nightOpsEnabled);
  return nightOpsEnabled ? { ...Colors, ...NightOpsColors } : Colors;
}
