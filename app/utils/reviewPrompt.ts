/**
 * reviewPrompt.ts — asks for a store rating at a good moment, rarely.
 *
 * Rules (Apple limits prompts to 3/yr per user and both stores penalise nagging):
 * - only after the user has finished at least 3 quizzes/drills
 * - at most once every 90 days, never more than 3 times total
 * - uses the native in-app review sheet; no custom "rate us" dialog
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'griddown_review_prompt';
const MIN_SUCCESSES = 3;
const MIN_DAYS_BETWEEN = 90;
const MAX_PROMPTS = 3;

interface ReviewState {
  successes: number;
  prompts: number;
  lastPromptAt: number | null;
}

async function load(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { successes: 0, prompts: 0, lastPromptAt: null, ...JSON.parse(raw) };
  } catch { /* fresh */ }
  return { successes: 0, prompts: 0, lastPromptAt: null };
}

async function save(s: ReviewState): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Pure decision, exported for tests. */
export function shouldPrompt(s: ReviewState, now = Date.now()): boolean {
  if (s.successes < MIN_SUCCESSES) return false;
  if (s.prompts >= MAX_PROMPTS) return false;
  if (s.lastPromptAt && now - s.lastPromptAt < MIN_DAYS_BETWEEN * 86_400_000) return false;
  return true;
}

/** Call after a positive moment (e.g. a quiz passed). Shows the sheet only when the rules allow. */
export async function maybeRequestReview(): Promise<boolean> {
  const state = await load();
  state.successes += 1;
  if (!shouldPrompt(state)) {
    await save(state);
    return false;
  }
  try {
    const StoreReview = await import('expo-store-review');
    if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) {
      await save(state);
      return false;
    }
    await StoreReview.requestReview();
    state.prompts += 1;
    state.lastPromptAt = Date.now();
    await save(state);
    return true;
  } catch {
    await save(state);
    return false;
  }
}
