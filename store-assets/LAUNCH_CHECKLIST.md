# GridDown v1.0.0 Launch Checklist

Master go/no-go checklist for App Store and Google Play launch.
Check every item before submitting for review.

---

## 💻 Code & Build

- [x] `npx tsc --noEmit` passes with zero errors *(2026-10-19)*
- [x] ESLint passes with zero errors (`npx eslint app/ --ext .ts,.tsx`) *(2026-10-19)*
- [ ] No `console.log` statements in production code (use `console.warn`/`console.error` only)
- [ ] No TODO or FIXME comments in production code
- [ ] No placeholder text or lorem ipsum anywhere in the app
- [x] `app.config.ts` has correct bundle ID (`com.bannedproduct.griddown`)
- [x] `eas.json` `appVersionSource` is set to `remote` *(EAS optional — local builds are primary)*
- [ ] Local release build succeeds: `.\scripts\build-android.ps1 -Target release` (Android) and `scripts/build-ios-macmini.sh archive` (iOS)
- [ ] Version code/build number incremented from any prior submission
- [ ] `fast-mlkit-translate-text` + `llama.rn` native modules confirmed working in a dev-client build (not Expo Go)

---

## 🌐 API Keys & Environment

- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` set in EAS project secrets
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` set in EAS project secrets
- [ ] RevenueCat products created and entitlements configured (see REVENUECAT_SETUP.md)
- [ ] RevenueCat sandbox purchase tested on iOS physical device
- [ ] RevenueCat test purchase tested on Android physical device
- [ ] `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL` live and accessible
- [ ] `EAS_PROJECT_ID` set only if EAS is ever used (not required for local builds)

---

## 🖼️ Store Assets

### App Store Connect (iOS)
- [ ] 6.7″ iPhone screenshots uploaded (6 screenshots)
- [ ] App icon uploaded (1024×1024, no alpha, no rounded corners)
- [ ] App name set: `GridDown`
- [ ] Subtitle set: `Survival. Offline. Ready.`
- [ ] Description filled (see APP_STORE_CONNECT.md)
- [ ] Keywords filled (see APP_STORE_CONNECT.md)
- [ ] Promotional text set
- [ ] Support URL set: `https://bannedproduct.com/support`
- [ ] Privacy Policy URL set
- [ ] Age rating submitted: 12+
- [ ] Review notes filled (see APP_STORE_CONNECT.md)
- [ ] All 7 in-app purchase products created and approved
- [ ] Subscription group hierarchy configured
- [ ] TestFlight internal testing completed
- [ ] TestFlight external testing completed (optional)

### Google Play Console (Android)
- [ ] App name: `GridDown - Offline Survival`
- [ ] Short description set
- [ ] Full description set (see PLAY_CONSOLE.md)
- [ ] Feature graphic uploaded (1024×500 PNG, from FEATURE_GRAPHIC.svg)
- [ ] 8 screenshots uploaded in correct order
- [ ] App icon uploaded (512×512)
- [ ] Content rating questionnaire completed (expected: Everyone 10+)
- [ ] Target audience set to 18+, does not appeal to children
- [ ] Data safety form completed (see DATA_SAFETY.md)
- [ ] Privacy policy URL entered
- [ ] All 7 subscription products created in Play Console
- [ ] All 2 one-time purchase products created
- [ ] Internal testing track: build uploaded and tested
- [ ] Closed testing (alpha) track: completed
- [ ] Open testing (beta) track: completed (optional)

---

## ⚖️ Legal

- [ ] Privacy Policy live at `https://rceasar01.github.io/GridDown/privacy`
- [ ] Terms of Service live at `https://rceasar01.github.io/GridDown/terms`
- [ ] GitHub Pages enabled on `docs/` folder of `main` branch
- [ ] Both pages render correctly on mobile
- [ ] Medical disclaimer visible on all medical guide pages
- [ ] Privacy Policy link accessible from Settings screen
- [ ] Terms of Service link accessible from Settings screen
- [ ] Subscription auto-renewal terms disclosed in app and store listing
- [ ] Cancellation instructions in Terms of Service are accurate

---

## 💳 RevenueCat

- [ ] RevenueCat account created and project set up
- [ ] iOS and Android apps added to RevenueCat project
- [ ] All 8 product IDs added to RevenueCat
- [ ] 3 entitlements created: `pro`, `extreme`, `discord`
- [ ] Default offering created with all packages
- [ ] Sandbox purchase tested: Pro Monthly → entitlement granted
- [ ] Sandbox purchase tested: Extreme Lifetime → entitlement granted
- [ ] Restore purchases tested
- [ ] Tier mapping in app store matches RevenueCat entitlements

---

## 🌍 GitHub Pages (Legal Hosting)

- [ ] GitHub Pages enabled on `rceasar01/GridDown` → Settings → Pages
- [ ] Source: Deploy from branch → main → /docs
- [ ] `https://rceasar01.github.io/GridDown/` loads correctly
- [ ] `https://rceasar01.github.io/GridDown/privacy` loads correctly
- [ ] `https://rceasar01.github.io/GridDown/terms` loads correctly

---

## 🧪 Device Testing

- [ ] Tested on iPhone 15 Pro (latest iOS)
- [ ] Tested on iPhone SE 3rd gen (small screen)
- [ ] Tested on iPad Pro (if tablet supported)
- [ ] Tested on Android phone (Pixel or Samsung, latest OS)
- [ ] Tested on Android phone (older OS, API 26+)
- [ ] Airplane mode: all features work offline
- [ ] App launch from cold start: no crashes
- [ ] App launch from background: no crashes
- [ ] Language change: all strings update correctly
- [ ] Translation model download: progress shown, model works
- [ ] Map screen: GPS coordinates display in airplane mode
- [ ] Checklist: items persist after app restart
- [ ] Bookmarks: persist after app restart
- [ ] Subscription flow: purchase, restore, and tier lock/unlock all work

---

## 🚀 Launch Day

- [ ] Tag release: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] App Store: Release manually (don’t auto-release after review)
- [ ] Google Play: Release to production 10% rollout first
- [ ] Monitor RevenueCat dashboard for first purchases
- [ ] Monitor App Store Connect → Crashes for any day-1 issues
- [ ] Monitor Google Play Console → Android Vitals for ANRs/crashes
- [ ] Announce on Discord / social media
- [ ] Watch App Store reviews (first 48 hours critical for rating)

---

## ✅ Final Sign-Off

| Check | Status |
|-------|--------|
| All TypeScript errors resolved | ☐ |
| All store assets uploaded | ☐ |
| Legal pages live | ☐ |
| RevenueCat configured and tested | ☐ |
| Device testing complete | ☐ |
| App Store submission ready | ☐ |
| Google Play submission ready | ☐ |

**Go/No-Go Decision:** ☐ GO &nbsp;&nbsp; ☐ NO-GO

**Launch Date:** ____________

**Signed off by:** Robert Ceasar / BannedProduct Media Inc.

---

## v1.1.0-beta New Feature Checklist

### Translator Screen
- [x] TranslatorScreen.tsx written and added to More stack
- [x] MoreScreen.tsx updated with Translator entry
- [x] AppNavigator.tsx: Translator screen registered
- [ ] Test with @react-native-ml-kit/translate in dev client build
- [ ] Test all 10 language model downloads
- [ ] Test emergency phrase auto-translate

### HAM Radio Repeater Database
- [x] ham-repeaters.json: 200+ entries, all 50 states
- [x] HamRadioScreen.tsx written and added to More stack
- [ ] Verify sample frequencies for accuracy
- [ ] Test search and filter performance with 200+ entries

### Morse Code Tool
- [x] MorseCodeScreen.tsx written and added to More stack
- [x] Encode/decode logic verified
- [ ] Test audio playback with expo-av in dev client
- [ ] Test SOS shortcut playback

### New Content Categories
- [x] vehicle.json: 5 guides written
- [x] homesteading.json: 5 guides written
- [x] CategoryGrid.tsx: vehicle + homesteading added (12 total)
- [x] helpers.ts: icons + descriptions for new categories
- [x] guideRegistry.ts: all new guides registered

### Field Manuals
- [x] fm-001.json through fm-005.json written
- [x] guideRegistry.ts: field manuals imported and tagged
- [x] HomeScreen.tsx: Field Manuals horizontal row added
- [ ] Verify source attribution on all field manual guides

### v1.1 GitHub
- [x] All files committed: feat: HAM radio, vehicle & homestead categories, translator tool, Morse code, field manuals
- [x] Tag v1.1.0-beta pushed

---

## 2026-10-19 Deployment-Readiness Pass (post Expo SDK 57 upgrade)

### Done
- [x] `expo-doctor` 21/21 green — fixed Hermes V1 memory-regression (expo 57.0.8 → 57.0.30, RN 0.86.3)
- [x] All 23 ESLint errors cleared; tsc 0 errors with the stale `.d.ts` stubs removed
- [x] **Advisor is real**: `llama.rn` 0.12.9 installed + config plugin; `advisorEngine.ts` owns the context;
      streaming tokens; history window; free-space guard; model URL fixed (old URL returned HTTP 401)
- [x] **Crash fix**: `supabase.ts` no longer calls `createClient('')` at import — Community Alerts
      screen opens safely with no backend and shows store-safe "coming soon" copy
- [x] **Translator is real**: `fast-mlkit-translate-text` (Google ML Kit on-device, free) replaces the no-op stub
- [x] Upload keystore generated → `credentials/` (gitignored); `plugins/withReleaseSigning.js` wires it
- [x] Local build scripts: `scripts/build-android.ps1`, `scripts/build-ios-macmini.sh`; `android/` + `ios/` gitignored (CNG)
- [x] NDK 27.1.12297006 + cmake 3.22.1 + JDK 21 installed (all free)
- [x] **Signed release AAB + APK built locally** → `_exports/GridDown-1.0.0-release-2026-10-19.{aab,apk}`;
      `apksigner` verifies the BannedProduct upload cert (SHA-256 `89:74:3B:7B…`)
- [x] **Emulator smoke test (Android 16, x86_64)**: cold start → onboarding → Home / Tools / More / Translator /
      Advisor gate / Content Packs — no crashes; RevenueCat skips cleanly with no key
- [x] **ML Kit translation verified end-to-end in the release build** (Spanish pack download + real translation)
- [x] Fixed from screenshots: status-bar overlap (37 screens → safe-area-context + `SafeAreaProvider`), tab bar
      under the gesture bar, Content Packs no longer fakes downloads (packs shown as "Coming soon")
- [x] iOS: `ios.privacyManifests` replaces the plugin that wrote `PrivacyInfo.xcprivacy` outside the app target;
      llama.rn increased-memory entitlements confirmed under `NODE_ENV=production` prebuild (validated on Linux)

### 2026-10-23 — second pass (all local, all free)
- [x] **Advisor grounded in the guides**: BM25 retrieval over the shipped library → top-3 excerpts in the
      prompt, "From your guides" source chips on every answer. The UI had claimed this; the code never did it.
- [x] **Lite / Standard model picker** by device RAM (expo-device): Qwen2.5-1.5B 1.1 GB for phones under
      ~5.5 GB, Phi-3.5 Mini 2.4 GB otherwise; user override; per-model free-space check; both URLs verified on HF
- [x] **Privacy accuracy**: policy + privacy.html + Data Safety now disclose the one-time HuggingFace download and
      the ML Kit installation ID sent to Google; store copy no longer says "no internet ever" / "zero data collected"
- [x] `ios.supportsTablet = false` for v1.0 (no iPad layout/screenshots yet)
- [x] **Data export/import** (Settings): one JSON file via share sheet; merge/replace restore with validation
- [x] Native in-app review prompt after ≥3 passed quizzes (≤1/90 days, ≤3 total)
- [x] Home-screen quick action → Emergency Mode (expo-quick-actions)
- [x] R8 minify + resource shrinking in release, keep rules for llama.rn / ML Kit / quick-actions
- [x] **Tests (125, in CI)** — found and fixed: 3 invalid guide priorities, 14 dead `relatedGuides` links,
      fm-003 missing medical disclaimer; coordinate converter verified against independent libraries (< 2 m)
- [x] Feature graphic: "500+ guides" → "80+" (the app ships 89), "0 data collected" → "0 servers · no account",
      broken flag glyph removed, orange gradient → OD green; same count fix across store copy and docs/index.html
- [x] `scripts/deploy-legal-pages.ps1` — Cloudflare Pages path to host privacy/terms so the repo can go private

- [x] **Fixed a monetization bug found during testing**: the purchased tier was never restored on cold start
      (store started at `free`, RevenueCat wrote only to SQLite) — paying users would have seen Pro locked after
      a restart. `loadUserTier()` at bootstrap + `applyTier()` keeps DB and store in sync
- [x] SafeAreaView edges per screen (headered screens were double-padding the status bar after the 10-19 migration)
- [x] **Advisor verified end-to-end on the emulator**: Lite model downloaded in-app (1,117,320,736 bytes, matches HF),
      llama.rn loaded it in 2.7 s at ~1.37 GB PSS, 753-token grounded prompt, coherent streamed answer with
      "From your guides" chips → *Finding Water in the Wild · Rainwater Collection · Improvised Water Filtration*
- [x] R8-minified release verified: boot, Home/Tools/More/Settings/Founder, Translator, Export (6.4 KB JSON via share
      sheet), quick-action shortcut registered with Android, Advisor — no crashes, no JS errors
- [x] Play screenshots captured at 1080×1920 (9:16) with demo status bar → `store-assets/screenshots/android/`
      (01 Home · 02 Learn · 03 Tools · 04 Drill · 05 Emergency Mode · 06 Advisor)
- [x] `mapping.txt` produced by R8 → upload with each AAB so Play de-obfuscates crash reports
- [x] **Advisor no longer parrots the reference block** (seen on the emulator: the 1.5B model copied the guide
      excerpts verbatim). Excerpts now ride in the user turn with a paraphrase instruction; echoed
      `Guide:`/`Situation:` headers are stripped; verified on the R8 release build (4 GB emulator): paraphrased
      answer + Tornado / Apartment & High-Rise / Hurricane source chips
- [x] **Found and contained a low-RAM stall (2026-10-24).** On the 3 GB store emulator the same build loads the
      model and processes the prompt (CPU confirms it), then *nothing* reaches JS — no tokens, no result, no
      native error, and the UI spun forever. Identical APK on the 4 GB emulator is fine. Root cause is inside
      llama.rn's native→JS hand-off under memory pressure (not reproducible from JS). Mitigations shipped:
      (1) `generate()` watchdog — 90 s of silence (reset per token) → unload the model, show a clear message,
      reload in place, send re-enabled; (2) Lite's floor raised to **4 GB RAM** with honest picker copy
      (3 GB phones still may try, with a warning); (3) 3 tests drive the real path with a fake runtime.
      Follow-up when on a real 3–4 GB phone: reproduce, then file against llama.rn with the thread dump
- [x] **CI was red since the first 10-23 push** — `expo-doctor` compares against Expo's *live* SDK 57 package
      list, and three packages had shipped new patches since the 19th (`expo-location` 57.0.22,
      `expo-notifications` 57.0.24, `expo-sharing` 57.0.24). Bumped + lockfile; `npm run lint` also fixed
      (a dead `@ts-ignore` in `app.config.ts` — `deploymentTarget` is typed now). Expect this drift again
      whenever Expo patches SDK 57: run `npx expo-doctor` before each release and bump what it names
- [x] **Parallel branch `feature/triage-phase1`** (local only in `E:\Projects\GridDown`, 5cf825b — deterministic
      emergency protocols + Advisor router, 5 triage JSONs, `TriageScreen`, 44 tests) trial-merged against
      `main` in a scratch clone: **auto-merge is clean** (`AdvisorScreen.tsx` both sides), tsc 0 errors,
      173 tests green, lint 0 errors. Safe to `git merge main` on that branch when it's ready

- [x] **Brand assets**: placeholder bolt replaced by an original mark; adaptive foreground kept inside Android's
      66 % safe zone; splash is a transparent mark at `imageWidth: 200`; notifications get a white silhouette
      (the full-colour icon would have rendered as a blob in the status bar)

- [x] **Release-build QA sweep (2026-10-24, emulator, all Tools cards + Learn/Drill/More/Quiz/Readiness):**
      no crashes, no JS errors. Fixed what it found: Location Accuracy dialog loop on the Map (asked every 5 s);
      "Map requires build / Expo Go" dev copy in the release UI → tool renamed *Position & Waypoints*; Gear
      Inventory scoring a fresh install 100 %; "rescue helicopter" flagged as medical (substring classifier);
      "View Guide" opening the wrong guide (burn → tension pneumothorax, CPR → shock); seven non-trauma medical
      guides citing TCCC / Stop the Bleed as their source
- [x] **APK/AAB size audit:** 213 MB universal APK = 196 MB native libs (arm64 109 · x86_64 61 · armeabi-v7a 25).
      Per-device Play download is one ABI (~60–70 MB compressed); llama.rn ships 6 arm64 CPU variants (~65 MB)
      and ML Kit translate is 15.6 MB. Nothing worth cutting for 1.0; dropping armeabi-v7a would save 25 MB of
      AAB but lock out 32-bit phones

- [x] **Store-build honesty pass (More menu):** *Referral Program* (invented "$8.00 paid / $30.00 pending",
      link to a griddown.app endpoint that doesn't exist) and *Community* (dead `discord.gg/bannedproduct` invite —
      HTTP 404 — plus the pre-simplification 7-tier ladder and "roles via RevenueCat webhooks") are hidden behind
      `REFERRAL_PROGRAM_ENABLED` / `COMMUNITY_ENABLED` flags in `MoreScreen.tsx` until the backends exist.
      *Family Plan* hidden on the paywall (`FAMILY_PLAN_ENABLED`) — no store product, and sharing needs Play Family
      Library / Apple Family Sharing. Paywall now shows **live store prices** from RevenueCat offerings (hardcoded
      labels are the offline fallback only)
- [ ] **Pricing decision needed before creating products:** the paywall labels say Pro $4.99 / $34.99 / $89.99 and
      Pro + AI $10.99 / $74.99 / $159.99, but the RevenueCat product IDs still encode the old prices
      (`griddown_monthly_399`, `griddown_yearly_2999`, `griddown_lifetime_standard_7999`,
      `griddown_extreme_monthly_999`, `_yearly_6999`, `_lifetime_14999`). Pick one set, create the Play / App Store
      products at those prices, and either rename the IDs in `RC_PRODUCT_MAP` or the labels — the live-price display
      will then make the labels moot

### Content gaps found during QA (1.1 candidates)
- No guide for **burns**, **fractures/splinting**, **CPR**, **hypothermia**, **heat illness**, **snakebite** or
  **choking** in the guide library — the triage trees cover five of these once reviewed; burns and fractures have
  nothing. The Advisor's "View Guide" button deliberately stays hidden for those keywords rather than link a
  wrong guide
- Retrieval sometimes surfaces an off-topic third chip (e.g. *Apartment & High-Rise* for helicopter signalling);
  harmless, but a per-guide `tags` pass would tighten it

- [x] **GridDown-Library 2.0.0 integrated (2026-10-24)** — 315 guides in 19 categories (all v2 with cited
      `sources[]`), 196 quizzes, 25 checklists, 6 flows, synced with the library's own allowlisted
      `sync-to-app.ps1` (backup at `E:\Backups\GridDown-Library-sync\2026-10-24_172228`). App-side: `Guide` type
      carries the v2 provenance fields; categories, labels, icons and descriptions come from the generated
      `app/content/categories.ts` (new: Health & Hygiene, Grid-Down Home, Terrain & Climate); quiz menus derive their
      tiles from the quiz registry (also fixes the `field-manuals` vs `field-manual` mismatch that opened an empty
      quiz); guide screen shows tappable **Sources** and a **Pending clinical review** badge on drafts; Advisor
      keyword map now reaches CPR, choking, burns, fractures, stroke, heart attack, anaphylaxis, seizures, diabetic,
      poisoning, snakebite, infection; retrieval stemmer/synonyms upgraded (purify↔purification, filter↔filtration,
      hemorrhage↔bleeding) — a 315-guide index exposed that "purify water" ranked a river-crossing guide first.
      Store copy, site and feature graphic say 300+ guides / 19 categories. Shock card no longer says to raise the
      legs; signal-mirror steps corrected (finger-V is for mirrors *without* a sighting hole)
- [ ] **Clinical-review decision (yours):** 138 of 315 guides are `reviewStatus: draft` (all medical, health and
      terrain guides plus risk-bearing ones elsewhere). This build ships them with the badge + medical disclaimer —
      the same posture as the 14 medical guides that already shipped. `npm run build:release` in the library would
      drop them entirely (177 guides, no medical/health/environment at all). As guides are reviewed, set
      `reviewStatus: "reviewed"` + `reviewedBy` in the library and re-sync
- [ ] **Concept-fit review (yours):** every guide title annotated in `docs/LIBRARY_REVIEW.md` — 7 recommended for
      retirement (the five `fm-*` military digests, `medical-001` TCCC, `medical-012` Combat Stress), 3 to edit,
      5 to merge, 2 flagged for awareness (`sec-011` firearm storage, `urban-009` scavenging title). Act on it in the
      library, never by deleting ids; then rebuild + re-sync + rebuild the app

### Working layout (two sessions, one repo)
- `E:\Projects\GridDown` — checkout on `feature/triage-phase1` (the other session). Not touched by the release work.
- `E:\Projects\GridDown-Library` — the content source of truth (one file per guide, validator, writing spec).
  Edit content there, `npm run build`, `.\scripts\sync-to-app.ps1 -AppPath E:\Projects\GridDown-main -Apply`.
  Never edit `app/assets/content/*.json` or the generated registries in the app — the next sync overwrites them.
- `E:\Projects\GridDown-main` — `git worktree` on `main`; release builds run from here. `node_modules` is its own
  install (was a junction to the main checkout; replaced so dependency bumps can't disturb the other branch).
  Remove with `git worktree remove E:\Projects\GridDown-main` once the branch is merged; `credentials/` is a copy.
- Release artifacts land in `E:\Projects\GridDown\_exports\` either way.

### Open — needs Robert
- [ ] **App icon: original mark shipped** (broken grid, one lit cell, compass point — `scripts/generate-brand-assets.js`
      renders icon / adaptive-icon / splash / favicon / notification silhouette from one SVG). If the June GDS brand
      kit turns up and you prefer it, drop its SVG into the script and re-run; Play's 512×512 listing icon is a
      resize of `icon.png`
- [ ] **Back up `credentials/`** to `E:\Backups\GridDown-credentials\` and the F: drive (see `credentials/README.md`)
- [ ] Mac mini: enable Remote Login, then run `scripts/build-ios-macmini.sh sim` to verify iOS compiles with llama.rn
- [ ] Install the release APK on a real Android phone (Advisor already verified on emulator; a phone confirms speed — expect 5–15 tok/s on a mid-range device)
- [ ] Test Translator on a real phone (verified on emulator)
- [ ] Google Play Console account ($25 one-time) → create app, enroll Play App Signing, upload AAB to Internal testing
- [ ] Apple Developer Program ($99/yr) → App Store Connect record, TestFlight
- [ ] RevenueCat project + keys (free under $2.5k MTR) — `EXPO_PUBLIC_REVENUECAT_*` env before release builds
- [ ] Community Alerts backend (Supabase free tier) — optional for v1.0; feature is hidden-safe without it
- [ ] **Sign off the triage trees** (merged, hidden in release until reviewed): walk each of the five in a dev build,
      edit as needed, set `reviewStatus: "reviewed"`, `reviewedBy`, `reviewedOn`, bump `version`, `npm test`. Each
      reviewed tree appears in the next release build automatically (Emergency Protocols tile + Advisor cards)
- [ ] GitHub repo RCeasar01/GridDown is PUBLIC (needed for GitHub Pages legal hosting). To make it private, move docs/ to Cloudflare Pages on gdsurvival.com (free) and update the privacy/terms URLs

## v2.0.0-beta Feature Checklist

### Phase 1 — Emergency Mode
- [x] EmergencyModeScreen.tsx — full crisis UI, micro cards, 14 scenarios
- [x] HomeScreen — EMERGENCY MODE button, pulsing orange, full-width 72px
- [x] AppNavigator — EmergencyMode registered as fullScreenModal
- [ ] Test Emergency Mode tap targets on physical device (≥64px)
- [ ] Test GPS location in Emergency Mode
- [ ] Test EXIT EMERGENCY MODE button always visible

### Phase 2 — Navigation Restructure
- [x] 5 new tabs: Home / Learn / Tools / Drill / More
- [x] LearnScreen.tsx — categories, search, field manuals, content packs
- [x] ToolsScreen.tsx — 9-tool grid
- [x] DrillScreen.tsx — daily drill + quiz categories
- [x] MyKitScreen.tsx placeholder → full feature (Phase 7)
- [x] FlowsScreen.tsx placeholder → full feature (Phase 8)
- [ ] Test all tab navigation on iOS and Android
- [ ] Test cross-tab navigation (Tools → Guide, Drill → QuizResult)

### Phase 3 & 4 — Guide Enrichment
- [x] quickGlance added to all 75+ guides
- [x] source, lastReviewed, skillLevel, gearRequired, riskLevel, prerequisites added
- [x] whenNotTo added to all medical guides
- [x] GuideScreen renders quickGlance, metadata chips, whenNotTo box
- [ ] Verify quickGlance content accuracy for medical guides
- [ ] Verify skill/gear metadata is correct across all categories

### Phase 5 — Medical Disclaimers + AI Safety
- [x] Non-dismissable red box on all medical guides in GuideScreen
- [x] AdvisorScreen medical keyword detection (46 keywords)
- [x] Medical AI responses get TCCC guide-only restriction
- [x] "View Related Guide" button on medical AI responses
- [x] Medical input warning banner (real-time detection)
- [ ] Test medical keyword detection: "tourniquet", "bleeding", "shock"
- [ ] Test "View Guide" navigation from AI response

### Phase 6 — Onboarding
- [x] OnboardingScreen.tsx — 4-screen flow
- [x] 6 profile cards + 8 region options
- [x] useAppStore — completeOnboarding, loadOnboardingState
- [x] App.tsx — conditional render (onboarding vs main app)
- [x] SettingsScreen — "MY PROFILE" section + "CHANGE PROFILE"
- [ ] Test first-launch onboarding flow
- [ ] Test skip button uses default profile
- [ ] Test "CHANGE PROFILE" from Settings

### Phase 7 — My Kit
- [x] SQLite tables: kits, kit_guides, kit_checklists
- [x] contentLoader.ts — 8 kit functions
- [x] MyKitScreen.tsx — full feature with kit tabs, guide list, create modal
- [x] GuideScreen — 🎒+/🎒✓ button + kit modal
- [x] Default kits auto-seeded on first launch
- [ ] Test adding guide to multiple kits
- [ ] Test kit deletion with cascade

### Phase 8 — Real-World Flows
- [x] 6 flow JSON files in app/assets/content/flows/
- [x] flowRegistry.ts — getAllFlows(), getFlowById()
- [x] FlowsScreen.tsx — full feature with step navigation, checkboxes
- [x] HomeScreen — Flows horizontal section
- [ ] Test flow completion with all checkboxes checked
- [ ] Test "View Full Guide" links from flow steps

### Phase 9 — Night Ops Mode
- [x] NightOpsColors added to colors.ts
- [x] useColors hook in app/theme/useColors.ts
- [x] useAppStore — nightOpsEnabled, toggleNightOps, loadNightOps
- [x] SettingsScreen — Night Ops toggle
- [x] HomeScreen — moon icon header button
- [ ] Test Night Ops in pitch-dark environment
- [ ] Test Night Ops preference persists after restart

### Phase 10 — Map Improvements
- [x] MapScreen.tsx rewritten — live GPS, mark points, saved points list
- [x] SQLite table: map_points
- [x] Haversine distance + cardinal bearing to saved points
- [x] Copy coordinates, MGRS toggle
- [ ] Test GPS accuracy (6 decimal places)
- [ ] Test mark point save and display

### Phase 11 — Tier Simplification
- [x] PaywallScreen — 3 tiers (Free, Pro, Pro+AI) + Family
- [x] Discord Only removed from UI
- [x] Pro plan: monthly/yearly/lifetime selector chips
- [x] REVENUECAT_SETUP.md v2.0 tier mapping added
- [ ] Test Pro purchase flow maps to correct RC product
- [ ] Test Pro+AI shows "PRO + AI REQUIRED" in Advisor

### Phase 12 — Quiz Debriefs
- [x] QuizResultScreen — Pin Guides to Kit section
- [x] QuizResultScreen — Review Reminder (expo-notifications, 3 days)
- [x] QuizResultScreen — Share Result (RN Share.share)
- [ ] Test notification permission request
- [ ] Test share text format

### Phase 13 — Translator
- [x] 5 new emergency phrases (Do not move me, Allergic, More injured, We need rescue, Unconscious)
- [x] SHOW mode — full-screen 72px phrase display on tap
- [x] 36px font for phrases
- [x] Icons next to each phrase
- [ ] Test SHOW mode tap-to-dismiss
- [ ] Test new phrases in all 7 languages

### Phase 14 — HAM Enhancements
- [x] SQLite table: saved_repeaters
- [x] contentLoader.ts — getSavedRepeaters, saveRepeater, deleteRepeater
- [x] HamRadioScreen — My Repeaters tab, Save button, tag picker
- [x] Sort by distance toggle (expo-location)
- [ ] Test save repeater flow
- [ ] Test distance sort with location permission

### Phase 15 — Morse + Flashlight
- [x] MorseCodeScreen — Flash as Morse (visual simulation)
- [x] SOS Flash shortcut button
- [x] HELP and OK preset buttons
- [x] Tap-along view with 80px current symbol
- [ ] Test SOS flash timing (... --- ...)
- [ ] Test stop button cancels flash

### v2.0 GitHub
- [ ] Commits pushed organized by phase (15 commits)
- [ ] Tag v2.0.0-beta pushed
- [ ] docs/index.html updated with v2.0 features
- [ ] LAUNCH_CHECKLIST.md updated

### v2.0 Final TypeScript
- [x] 0 TypeScript errors (`npx tsc --noEmit`)
- [ ] 0 ESLint errors (`npx eslint app/ --ext .ts,.tsx`)

**v2.0 Go/No-Go Decision:** ☐ GO &nbsp;&nbsp; ☐ NO-GO

**v2.0 Launch Date:** ____________
