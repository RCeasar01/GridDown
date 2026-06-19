import { create } from 'zustand';
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
  recordViewed,
  getRecentlyViewed,
  clearRecentlyViewed,
} from '../db/contentLoader';

export type UserTier =
  | 'free'
  | 'monthly'
  | 'yearly'
  | 'lifetime_standard'
  | 'discord'
  | 'extreme_monthly'
  | 'extreme_yearly'
  | 'extreme_lifetime';

export interface ContentPack {
  id: string;
  name: string;
  description: string;
  sizeBytes: number;
  installed: boolean;
  requiredTier: UserTier;
  version: string;
}

interface AppState {
  // Navigation
  currentCategory: string | null;
  setCurrentCategory: (cat: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Bookmarks
  bookmarks: string[];
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (guideId: string) => Promise<void>;
  isBookmarked: (guideId: string) => boolean;

  // Recently viewed
  recentlyViewed: string[];
  loadRecentlyViewed: () => Promise<void>;
  markViewed: (guideId: string) => Promise<void>;
  clearRecent: () => Promise<void>;

  // Offline status
  isOffline: boolean;
  setOffline: (v: boolean) => void;

  // User tier
  userTier: UserTier;
  setUserTier: (tier: UserTier) => void;
  hasAccess: (requiredTier: UserTier) => boolean;

  // Content packs
  contentPacks: ContentPack[];
  setContentPacks: (packs: ContentPack[]) => void;
}

// Tier hierarchy for access checks
const TIER_RANK: Record<UserTier, number> = {
  free: 0,
  discord: 1,
  monthly: 2,
  yearly: 3,
  lifetime_standard: 4,
  extreme_monthly: 5,
  extreme_yearly: 6,
  extreme_lifetime: 7,
};

const DEFAULT_PACKS: ContentPack[] = [
  {
    id: 'core',
    name: 'GridDown Core',
    description: 'Essential survival guides across all 10 categories.',
    sizeBytes: 2_400_000,
    installed: true,
    requiredTier: 'free',
    version: '1.0.0',
  },
  {
    id: 'medical',
    name: 'Medical Pack',
    description: 'Full TCCC, trauma, and preventive medicine guide set.',
    sizeBytes: 4_200_000,
    installed: false,
    requiredTier: 'monthly',
    version: '1.0.0',
  },
  {
    id: 'urban',
    name: 'Urban Survival Pack',
    description: 'Grid-down scenarios in urban and suburban environments.',
    sizeBytes: 3_100_000,
    installed: false,
    requiredTier: 'monthly',
    version: '1.0.0',
  },
  {
    id: 'field1',
    name: 'Field Pack 1',
    description: 'Extended wilderness, land navigation, and fieldcraft.',
    sizeBytes: 3_800_000,
    installed: false,
    requiredTier: 'monthly',
    version: '1.0.0',
  },
  {
    id: 'regional_sw',
    name: 'Regional Pack — Southwest',
    description: 'Desert and arid terrain-specific survival content.',
    sizeBytes: 2_900_000,
    installed: false,
    requiredTier: 'yearly',
    version: '1.0.0',
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  currentCategory: null,
  setCurrentCategory: (cat) => set({ currentCategory: cat }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  bookmarks: [],
  loadBookmarks: async () => {
    const bm = await getBookmarks();
    set({ bookmarks: bm });
  },
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
  loadRecentlyViewed: async () => {
    const rv = await getRecentlyViewed();
    set({ recentlyViewed: rv });
  },
  markViewed: async (guideId) => {
    await recordViewed(guideId);
    const rv = await getRecentlyViewed();
    set({ recentlyViewed: rv });
  },
  clearRecent: async () => {
    await clearRecentlyViewed();
    set({ recentlyViewed: [] });
  },

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
}));
