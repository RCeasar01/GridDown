/**
 * GridDown Offline Translation Utility
 *
 * Backend: fast-mlkit-translate-text (Google ML Kit on-device translation).
 * - Language packs (~30 MB each) download once over the network, then
 *   translation runs fully offline with no API keys and no per-use cost.
 * - The native module is only present in dev-client / store builds. In
 *   Expo Go the calls below reject and the UI falls back to the
 *   pre-translated emergency phrase cards.
 */

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Backend: ML Kit (lazy-loaded so a missing native module never crashes)
// ---------------------------------------------------------------------------
type MlKitLanguage =
  | 'English' | 'Spanish' | 'French' | 'Portuguese' | 'German' | 'Arabic'
  | 'Chinese' | 'Japanese' | 'Korean' | 'Russian' | 'Hindi';

interface MlKitBackend {
  prepare(options: { source: MlKitLanguage; target: MlKitLanguage; downloadIfNeeded?: boolean }): Promise<unknown>;
  translate(text: string): Promise<string>;
  downloadLanguageModel(lang: MlKitLanguage): Promise<boolean>;
  deleteLanguageModel(lang: MlKitLanguage): Promise<boolean>;
  isLanguageDownloaded(lang: MlKitLanguage): Promise<boolean>;
}

let backend: MlKitBackend | null | undefined;

async function getBackend(): Promise<MlKitBackend | null> {
  if (backend !== undefined) return backend;
  try {
    const mod = await import('fast-mlkit-translate-text');
    const candidate = (mod.default ?? mod) as unknown as MlKitBackend;
    backend = typeof candidate.translate === 'function' ? candidate : null;
  } catch {
    backend = null;
  }
  return backend;
}

/** True when on-device translation is available in this build. */
export async function isTranslationAvailable(): Promise<boolean> {
  return (await getBackend()) !== null;
}
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedLanguage =
  | 'es' | 'fr' | 'pt' | 'de' | 'ar'
  | 'zh' | 'ja' | 'ko' | 'ru' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flagEmoji: string;
  modelSizeMB: number;
}

export type DownloadProgress = {
  languageCode: SupportedLanguage;
  progress: number; // 0-1
  status: 'downloading' | 'complete' | 'error';
  error?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'es', name: 'Spanish',              nativeName: 'Español',      flagEmoji: '🇪🇸', modelSizeMB: 30 },
  { code: 'fr', name: 'French',               nativeName: 'Français',     flagEmoji: '🇫🇷', modelSizeMB: 30 },
  { code: 'pt', name: 'Portuguese',           nativeName: 'Português',    flagEmoji: '🇧🇷', modelSizeMB: 30 },
  { code: 'de', name: 'German',               nativeName: 'Deutsch',      flagEmoji: '🇩🇪', modelSizeMB: 30 },
  { code: 'ar', name: 'Arabic',               nativeName: 'العربية',      flagEmoji: '🇸🇦', modelSizeMB: 30 },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文（简体）',   flagEmoji: '🇨🇳', modelSizeMB: 30 },
  { code: 'ja', name: 'Japanese',             nativeName: '日本語',        flagEmoji: '🇯🇵', modelSizeMB: 30 },
  { code: 'ko', name: 'Korean',               nativeName: '한국어',        flagEmoji: '🇰🇷', modelSizeMB: 30 },
  { code: 'ru', name: 'Russian',              nativeName: 'Русский',      flagEmoji: '🇷🇺', modelSizeMB: 30 },
  { code: 'hi', name: 'Hindi',               nativeName: 'हिन्दी',         flagEmoji: '🇮🇳', modelSizeMB: 30 },
];

const DOWNLOADED_MODELS_KEY = 'griddown_downloaded_translation_models';
const SOURCE_LANGUAGE = 'en' as const;

// ---------------------------------------------------------------------------
// Model download tracking (persisted)
// ---------------------------------------------------------------------------

async function getDownloadedModels(): Promise<SupportedLanguage[]> {
  try {
    const raw = await AsyncStorage.getItem(DOWNLOADED_MODELS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupportedLanguage[];
  } catch {
    return [];
  }
}

async function saveDownloadedModels(models: SupportedLanguage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(DOWNLOADED_MODELS_KEY, JSON.stringify(models));
  } catch {
    // ignore
  }
}

const ML_KIT_NAME: Record<SupportedLanguage | 'en', MlKitLanguage> = {
  en: 'English', es: 'Spanish', fr: 'French', pt: 'Portuguese', de: 'German',
  ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean', ru: 'Russian', hi: 'Hindi',
};

export async function isModelDownloaded(languageCode: SupportedLanguage): Promise<boolean> {
  const mlkit = await getBackend();
  if (mlkit) {
    try {
      return await mlkit.isLanguageDownloaded(ML_KIT_NAME[languageCode]);
    } catch { /* fall through to cached list */ }
  }
  const models = await getDownloadedModels();
  return models.includes(languageCode);
}

export async function deleteLanguageModel(languageCode: SupportedLanguage): Promise<void> {
  const mlkit = await getBackend();
  if (mlkit) {
    try { await mlkit.deleteLanguageModel(ML_KIT_NAME[languageCode]); } catch { /* ignore */ }
  }
  const existing = await getDownloadedModels();
  await saveDownloadedModels(existing.filter((c) => c !== languageCode));
}

export async function downloadLanguageModel(
  languageCode: SupportedLanguage,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  onProgress?.({ languageCode, progress: 0.05, status: 'downloading' });

  try {
    const mlkit = await getBackend();
    if (!mlkit) throw new Error('On-device translation is not available in this build.');
    onProgress?.({ languageCode, progress: 0.1, status: 'downloading' });
    // ML Kit needs both the source (English) and target packs.
    const ok = await mlkit.downloadLanguageModel(ML_KIT_NAME[languageCode]);
    if (!ok) throw new Error('Language pack download was rejected by the device.');
    onProgress?.({ languageCode, progress: 0.9, status: 'downloading' });
    await mlkit.prepare({ source: ML_KIT_NAME[SOURCE_LANGUAGE], target: ML_KIT_NAME[languageCode], downloadIfNeeded: true });
    onProgress?.({ languageCode, progress: 1.0, status: 'complete' });
    const existing = await getDownloadedModels();
    if (!existing.includes(languageCode)) {
      await saveDownloadedModels([...existing, languageCode]);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    onProgress?.({ languageCode, progress: 0, status: 'error', error: message });
    throw new Error(`Failed to download translation model for ${languageCode}: ${message}`);
  }
}

export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
): Promise<string> {
  if (!text.trim()) return text;
  const mlkit = await getBackend();
  if (!mlkit) return text;
  try {
    await mlkit.prepare({ source: ML_KIT_NAME[SOURCE_LANGUAGE], target: ML_KIT_NAME[targetLang], downloadIfNeeded: false });
    const result = await mlkit.translate(text);
    return typeof result === 'string' && result.length > 0 ? result : text;
  } catch {
    return text;
  }
}

export function getDeviceLanguage(): string {
  try {
    const locales = Localization.getLocales();
    if (locales.length > 0) {
      const lang = locales[0].languageCode;
      return lang ?? 'en';
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function getLanguageInfo(code: string): LanguageInfo | undefined {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code);
}
