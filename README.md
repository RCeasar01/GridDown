# GridDown (GDS)

**Tactical survival intelligence for when the grid goes down.**

GridDown is a production-grade React Native app (Expo SDK 51) delivering 60+ offline survival field guides across 10 categories, with full-text search, tactical checklists, an on-device AI advisor, and a subscription tier system — zero network required for content.

---

## Screenshots

> *Screenshots and feature graphic go here after first build.*

---

## Features

- **100% offline-first** — all content stored on-device via SQLite, no network required
- **60+ field guides** — water, fire, shelter, food, medical, navigation, comms, security, tools, disaster
- **Priority ranking** — guides sorted Critical → Advanced → Beginner
- **Full-text search** — in-memory scored index with 150ms debounce
- **Tactical checklists** — pre-built and persistable via SQLite
- **Bookmark system** — SQLite-backed, instant access
- **On-device AI advisor** — llama.rn / Phi-3.5 Mini Q4 running locally (Extreme tier)
- **RevenueCat subscriptions** — 8 tiers from free to Extreme Lifetime
- **Dark tactical UI** — `#0D0D0D` background, `#8B9E67` accent

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 + React Native 0.74.1 |
| Language | TypeScript (strict) |
| Navigation | React Navigation 6 (bottom tabs + stack) |
| State | Zustand |
| Database | expo-sqlite (WAL mode) |
| Subscriptions | RevenueCat (react-native-purchases ^7.27.0) |
| On-device AI | llama.rn + Phi-3.5 Mini Q4_K_M (2.2 GB) |
| File system | expo-file-system |
| Location | expo-location |
| Icons | @expo/vector-icons (Ionicons) |
| Build | EAS Build |
| CI | GitHub Actions |

---

## Project Structure

```
GridDown/
├── app/
│   ├── assets/
│   │   ├── content/          # JSON guide data (10 category files)
│   │   ├── checklists/       # Checklist template JSON
│   │   └── images/           # Generated app icons + splash
│   ├── components/
│   │   ├── CategoryGrid.tsx  # Home screen category grid (Ionicons)
│   │   ├── EmergencyBanner.tsx
│   │   ├── GuideCard.tsx
│   │   └── SearchBar.tsx
│   ├── db/
│   │   └── contentLoader.ts  # SQLite init + CRUD (bookmarks, history, checklists, tier)
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Bottom tab + stack navigator
│   ├── screens/              # 13 production screens
│   ├── store/
│   │   └── useAppStore.ts    # Zustand global store
│   ├── theme/
│   │   └── colors.ts         # Color constants
│   └── utils/
│       ├── guideRegistry.ts  # Guide data access layer
│       ├── checklistRegistry.ts
│       ├── purchases.ts      # RevenueCat wiring
│       ├── revenueCat.ts
│       ├── search.ts         # In-memory full-text search index
│       └── helpers.ts
├── scripts/
│   ├── generate-assets.js    # sharp-based icon/splash generator
│   └── patch-content.js      # Content completeness patch
├── store-assets/
│   └── STORE_LISTING.md      # App Store + Play Store copy
├── .github/
│   └── workflows/
│       └── ci.yml            # Lint + TypeScript + Test CI
├── App.tsx                   # Root — bootstrap + navigator
├── app.json                  # Expo config
├── eas.json                  # EAS Build profiles
└── tsconfig.json
```

---

## Screens

| Screen | Description |
|---|---|
| HomeScreen | Category grid + emergency banner |
| CategoryScreen | Guide list with priority filter (Critical/Advanced/Beginner) |
| GuideScreen | Full guide render — steps, warnings, pro tips, bookmarking |
| SearchScreen | Full-text search with debounce, grouped by category |
| ChecklistScreen | Interactive survival checklists with persistent state |
| MapScreen | Offline coordinate display via expo-location |
| AdvisorScreen | llama.rn on-device AI (Extreme tier) with download flow |
| PaywallScreen | Subscription purchase UI via RevenueCat |
| CommunityScreen | Discord community link |
| ContentPacksScreen | Downloadable content pack browser |
| FounderScreen | Founder tier perks |
| ReferralScreen | Referral program |
| SettingsScreen | App preferences |

---

## Subscription Tiers

| Tier | Entitlement | Content Access |
|---|---|---|
| Free | — | Critical guides only |
| Discord | `discord_only` | Community + all free |
| Monthly | `monthly_access` | Full library |
| Yearly | `yearly_access` | Full library |
| Lifetime Standard | `lifetime_standard` | Full library, one-time |
| Extreme Monthly | `extreme_monthly` | Full library + AI |
| Extreme Yearly | `extreme_yearly` | Full library + AI |
| Extreme Lifetime | `extreme_lifetime` | Full library + AI, one-time |

---

## Guide Content

### Categories and Counts
| Category | Guides |
|---|---|
| Water | 5 |
| Fire | (see content files) |
| Shelter | 4 |
| Food | (see content files) |
| Medical | 14 |
| Navigation | (see content files) |
| Communications | 4 |
| Security | 4 |
| Tools | (see content files) |
| Disaster | 7 |

### Content Schema
```json
{
  "id": "category-001",
  "category": "category",
  "title": "Guide Title",
  "priority": "critical | advanced | beginner",
  "tags": ["tag1", "tag2"],
  "summary": "One-sentence description.",
  "requiresMedicalDisclaimer": true,
  "steps": [{ "step": 1, "title": "Step Title", "body": "Step body..." }],
  "warnings": ["Warning text..."],
  "proTips": ["Pro tip text..."],
  "relatedGuides": ["category-002"]
}
```

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Install
```bash
git clone https://github.com/RCeasar01/GridDown.git
cd GridDown
npm install --legacy-peer-deps
```

### Run (development)
```bash
npx expo start
```

### Generate Assets
```bash
npm install -g sharp
NODE_PATH=$(npm root -g) node scripts/generate-assets.js
```

### Build (EAS)
```bash
# Development build
eas build --profile development --platform android

# Production AAB (Android)
eas build --profile production --platform android

# Production iOS
eas build --profile production --platform ios
```

---

## CI/CD

GitHub Actions runs on every push to `main` and every PR:

- **Lint** — ESLint with zero warnings
- **TypeScript** — `tsc --noEmit`
- **Tests** — Jest (passes with no tests)
- **EAS Config Validation** — validates `app.json` and `eas.json`

---

## RevenueCat Configuration

Set environment variables before building:

```
REVENUECAT_IOS_KEY=appl_xxxxx
REVENUECAT_ANDROID_KEY=goog_xxxxx
```

Entitlement IDs (configure in RevenueCat dashboard):
- `monthly_access`
- `yearly_access`
- `lifetime_standard`
- `discord_only`
- `extreme_monthly`
- `extreme_yearly`
- `extreme_lifetime`

---

## On-Device AI (Extreme Tier)

Model: **Phi-3.5 Mini Instruct Q4_K_M** (2.2 GB)  
Download: HuggingFace — `bartowski/Phi-3.5-mini-instruct-GGUF`  
Engine: **llama.rn** (dynamic import, graceful fallback to scaffold mode)

The model is downloaded on first use to the app's document directory. All inference runs locally — no data leaves the device.

---

## Medical Disclaimer

Guides covering medical procedures (tagged `requiresMedicalDisclaimer: true`) are intended for use in austere environments where trained medical care is unavailable. They do not replace professional medical training or advice.

---

## License

Proprietary — © Banned Product Media. All rights reserved.

---

## Links

- **Repository**: [github.com/RCeasar01/GridDown](https://github.com/RCeasar01/GridDown)
- **Issues**: [github.com/RCeasar01/GridDown/issues](https://github.com/RCeasar01/GridDown/issues)
- **Store Listing Copy**: [store-assets/STORE_LISTING.md](store-assets/STORE_LISTING.md)
