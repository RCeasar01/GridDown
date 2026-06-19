/**
 * GridDown Offline Translation Utility
 *
 * Uses @react-native-ml-kit/translate for fully on-device translation.
 * Requires a dev/production build (not Expo Go).
 * Models are ~30 MB each and stored on device permanently after download.
 *
 * NOTE: @react-native-ml-kit/translate must be installed separately with:
 *   npx expo install @react-native-ml-kit/translate
 * and requires a custom dev client build (not compatible with Expo Go).
 */

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  progress: number; // 0–1
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
const SOURCE_LANGUAGE = 'en';

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

export async function isModelDownloaded(languageCode: SupportedLanguage): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { translate } = require('@react-native-ml-kit/translate');
    await translate('test', SOURCE_LANGUAGE, languageCode);
    return true;
  } catch {
    const models = await getDownloadedModels();
    return models.includes(languageCode);
  }
}

export async function downloadLanguageModel(
  languageCode: SupportedLanguage,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<void> {
  onProgress?.({ languageCode, progress: 0.05, status: 'downloading' });

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { translate } = require('@react-native-ml-kit/translate');
    onProgress?.({ languageCode, progress: 0.1, status: 'downloading' });
    await translate('hello world', SOURCE_LANGUAGE, languageCode);
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
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { translate } = require('@react-native-ml-kit/translate');
    const result: string = await translate(text, SOURCE_LANGUAGE, targetLang);
    return result ?? text;
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
