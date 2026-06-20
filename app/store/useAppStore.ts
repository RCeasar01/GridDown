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
const NIGHT_OPS_KEY = 'nightOps';
const ONBOARDING_COMPLETED_KEY = 'onboardingCompleted';
const USER_PROFILE_KEY = 'userProfile';
const USER_REGION_KEY = 'userRegion';

export type UserProfile = 'urban' | 'rural' | 'vehicle' | 'medic' | 'comms' | 'disaster';

const PROFILE_CATEGORY_ORDER: Record<UserProfile, string[]> = {
  urban: ['security', 'medical', 'comms', 'water', 'food', 'shelter', 'disaster', 'fire', 'navigation', 'homesteading', 'vehicle', 'tools'],
  rural: ['water', 'food', 'homesteading', 'shelter', 'fire', 'medical', 'navigation', 'security', 'comms', 'vehicle', 'disaster', 'tools'],
  vehicle: ['vehicle', 'navigation', 'water', 'medical', 'shelter', 'fire', 'comms', 'security', 'food', 'disaster', 'homesteading', 'tools'],
  medic: ['medical', 'water', 'shelter', 'security', 'comms', 'navigation', 'fire', 'food', 'vehicle', 'disaster', 'homesteading', 'tools'],
  comms: ['comms', 'security', 'medical', 'navigation', 'disaster', 'water', 'shelter', 'fire', 'food', 'vehicle', 'homesteading', 'tools'],
  disaster: ['disaster', 'water', 'medical', 'shelter', 'security', 'comms', 'food', 'fire', 'navigation', 'vehicle', 'homesteading', 'tools'],
};

const REGION_CHECKLISTS: Record<string, string[]> = {
  northeast: ['winter-storm', 'shelter-in-place'],
  southeast: ['hurricane', 'flood'],
  midwest: ['tornado', 'winter-storm'],
  southwest: ['wildfire', 'earthquake', 'heat'],
  northwest: ['earthquake', 'tsunami', 'wildfire'],
  alaska: ['winter-storm', 'wildfire', 'earthquake'],
  hawaii: ['hurricane', 'tsunami', 'earthquake'],
  international: ['shelter-in-place', 'bug-out'],
};

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
  nightOpsEnabled: boolean;
  toggleNightOps: () => Promise<void>;
  loadNightOps: () => Promise<void>;
  // Onboarding
  onboardingCompleted: boolean;
  userProfile: UserProfile | null;
  userRegion: string | null;
  categoryOrder: string[];
  pinnedChecklists: string[];
  completeOnboarding: (profile: string, region: string) => Promise<void>;
  loadOnboardingState: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
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
  nightOpsEnabled: false,
  toggleNightOps: async () => {
    const next = !get().nightOpsEnabled;
    set({ nightOpsEnabled: next });
    try { await AsyncStorage.setItem(NIGHT_OPS_KEY, next ? 'true' : 'false'); } catch { /* ignore */ }
  },
  loadNightOps: async () => {
    try {
      const val = await AsyncStorage.getItem(NIGHT_OPS_KEY);
      set({ nightOpsEnabled: val === 'true' });
    } catch { /* ignore */ }
  },
  // Onboarding
  onboardingCompleted: false,
  userProfile: null,
  userRegion: null,
  categoryOrder: [],
  pinnedChecklists: [],
  completeOnboarding: async (profile, region) => {
    const profileKey = profile as UserProfile;
    const categoryOrder = PROFILE_CATEGORY_ORDER[profileKey] ?? [];
    const pinnedChecklists = REGION_CHECKLISTS[region] ?? [];
    set({
      onboardingCompleted: true,
      userProfile: profileKey,
      userRegion: region,
      categoryOrder,
      pinnedChecklists,
    });
    try {
      await AsyncStorage.multiSet([
        [ONBOARDING_COMPLETED_KEY, 'true'],
        [USER_PROFILE_KEY, profile],
        [USER_REGION_KEY, region],
      ]);
    } catch { /* ignore */ }
  },
  loadOnboardingState: async () => {
    try {
      const results = await AsyncStorage.multiGet([
        ONBOARDING_COMPLETED_KEY,
        USER_PROFILE_KEY,
        USER_REGION_KEY,
      ]);
      const completed = results[0][1] === 'true';
      const profile = (results[1][1] as UserProfile | null) ?? null;
      const region = results[2][1] ?? null;
      const categoryOrder = profile ? (PROFILE_CATEGORY_ORDER[profile] ?? []) : [];
      const pinnedChecklists = region ? (REGION_CHECKLISTS[region] ?? []) : [];
      set({ onboardingCompleted: completed, userProfile: profile, userRegion: region, categoryOrder, pinnedChecklists });
    } catch { /* ignore */ }
  },
  resetOnboarding: async () => {
    set({ onboardingCompleted: false });
    try {
      await AsyncStorage.multiRemove([ONBOARDING_COMPLETED_KEY, USER_PROFILE_KEY, USER_REGION_KEY]);
    } catch { /* ignore */ }
  },
}));
