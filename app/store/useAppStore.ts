import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addBookmark, removeBookmark, getBookmarks,
  recordViewed, getRecentlyViewed, clearRecentlyViewed,
} from '../db/contentLoader';
import { setAppLanguage } from '../i18n';
import type { SupportedLanguage } from '../utils/translation';

export type UserTier =
  | 'free' | 'monthly' | 'yearly' | 'lifetime_standard'
  | 'discord' | 'extreme_monthly' | 'extreme_yearly' | 'extreme_lifetime';

export interface ContentPack {
  id: string; name: string; description: string;
  sizeBytes: number; installed: boolean;
  requiredTier: UserTier; version: string;
}

const LANGUAGE_PREF_KEY = 'griddown_language_pref';
const TRANSLATE_CONTENT_KEY = 'griddown_translate_content';

interface AppState {
  currentCategory: string | null;
  setCurrentCategory: (cat: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  bookmarks: string[];
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (guideId: string) => Promise<void>;
  isBookmarked: (guideId: string) => boolean;
  recentlyViewed: string[];
  loadRecentlyViewed: () => Promise<void>;
  markViewed: (guideId: string) => Promise<void>;
  clearRecent: () => Promise<void>;
  isOffline: boolean;
  setOffline: (v: boolean) => void;
  userTier: UserTier;
  setUserTier: (tier: UserTier) => void;
  hasAccess: (requiredTier: UserTier) => boolean;
  contentPacks: ContentPack[];
  setContentPacks: (packs: ContentPack[]) => void;
  selectedLanguage: string;
  translateContentEnabled: boolean;
  setSelectedLanguage: (code: string) => Promise<void>;
  setTranslateContentEnabled: (enabled: boolean) => Promise<void>;
  loadLanguagePrefs: () => Promise<void>;
  downloadedModels: SupportedLanguage[];
  markModelDownloaded: (lang: SupportedLanguage) => void;
}

const TIER_RANK: Record<UserTier, number> = {
  free: 0, discord: 1, monthly: 2, yearly: 3,
  lifetime_standard: 4, extreme_monthly: 5, extreme_yearly: 6, extreme_lifetime: 7,
};

const DEFAULT_PACKS: ContentPack[] = [
  { id: 'core', name: 'GridDown Core', description: 'Essential survival guides across all 10 categories.', sizeBytes: 2_400_000, installed: true, requiredTier: 'free', version: '1.0.0' },
  { id: 'medical', name: 'Medical Pack', description: 'Full TCCC, trauma, and preventive medicine guide set.', sizeBytes: 4_200_000, installed: false, requiredTier: 'monthly', version: '1.0.0' },
  { id: 'urban', name: 'Urban Survival Pack', description: 'Grid-down scenarios in urban and suburban environments.', sizeBytes: 3_100_000, installed: false, requiredTier: 'monthly', version: '1.0.0' },
  { id: 'field1', name: 'Field Pack 1', description: 'Extended wilderness, land navigation, and fieldcraft.', sizeBytes: 3_800_000, installed: false, requiredTier: 'monthly', version: '1.0.0' },
  { id: 'regional_sw', name: 'Regional Pack — Southwest', description: 'Desert and arid terrain-specific survival content.', sizeBytes: 2_900_000, installed: false, requiredTier: 'yearly', version: '1.0.0' },
];

export const useAppStore = create<AppState>((set, get) => ({
  currentCategory: null,
  setCurrentCategory: (cat) => set({ currentCategory: cat }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  bookmarks: [],
  loadBookmarks: async () => { const bm = await getBookmarks(); set({ bookmarks: bm }); },
  toggleBookmark: async (guideId) => {
    const current = get().bookmarks;
    if (current.includes(guideId)) {
      await removeBookmark(guideId);
      set({ bookmarks: current.filter((id) => id !== guideId) });
    } else {
      await addBookmark(guideId);
      set({ bookmarks: [guideId, ...current] });
    }
  },
  isBookmarked: (guideId) => get().bookmarks.includes(guideId),
  recentlyViewed: [],
  loadRecentlyViewed: async () => { const rv = await getRecentlyViewed(); set({ recentlyViewed: rv }); },
  markViewed: async (guideId) => { await recordViewed(guideId); const rv = await getRecentlyViewed(); set({ recentlyViewed: rv }); },
  clearRecent: async () => { await clearRecentlyViewed(); set({ recentlyViewed: [] }); },
  isOffline: true,
  setOffline: (v) => set({ isOffline: v }),
  userTier: 'free',
  setUserTier: (tier) => set({ userTier: tier }),
  hasAccess: (requiredTier) => {
    const currentRank = TIER_RANK[get().userTier] ?? 0;
    const requiredRank = TIER_RANK[requiredTier] ?? 0;
    return currentRank >= requiredRank;
  },
  contentPacks: DEFAULT_PACKS,
  setContentPacks: (packs) => set({ contentPacks: packs }),
  selectedLanguage: 'en',
  translateContentEnabled: false,
  downloadedModels: [],
  loadLanguagePrefs: async () => {
    try {
      const [langRaw, translateRaw] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_PREF_KEY),
        AsyncStorage.getItem(TRANSLATE_CONTENT_KEY),
      ]);
      const lang = langRaw ?? 'en';
      const translateEnabled = translateRaw === 'true';
      set({ selectedLanguage: lang, translateContentEnabled: translateEnabled });
      await setAppLanguage(lang);
    } catch { /* ignore */ }
  },
  setSelectedLanguage: async (code) => {
    try { await AsyncStorage.setItem(LANGUAGE_PREF_KEY, code); set({ selectedLanguage: code }); await setAppLanguage(code); } catch { /* ignore */ }
  },
  setTranslateContentEnabled: async (enabled) => {
    try { await AsyncStorage.setItem(TRANSLATE_CONTENT_KEY, enabled ? 'true' : 'false'); set({ translateContentEnabled: enabled }); } catch { /* ignore */ }
  },
  markModelDownloaded: (lang) => {
    const current = get().downloadedModels;
    if (!current.includes(lang)) set({ downloadedModels: [...current, lang] });
  },
}));
