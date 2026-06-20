# GridDown v1.0.0 Launch Checklist

Master go/no-go checklist for App Store and Google Play launch.
Check every item before submitting for review.

---

## 💻 Code & Build

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] ESLint passes with zero errors (`npx eslint app/ --ext .ts,.tsx`)
- [ ] No `console.log` statements in production code (use `console.warn`/`console.error` only)
- [ ] No TODO or FIXME comments in production code
- [ ] No placeholder text or lorem ipsum anywhere in the app
- [ ] `app.config.ts` has correct bundle ID (`com.bannedproduct.griddown`)
- [ ] `eas.json` `appVersionSource` is set to `remote`
- [ ] EAS production build succeeds: `eas build --profile production --platform both`
- [ ] Version code/build number incremented from any prior submission
- [ ] `@react-native-ml-kit/translate` native module confirmed in EAS build (not Expo Go)

---

## 🌐 API Keys & Environment

- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY` set in EAS project secrets
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` set in EAS project secrets
- [ ] RevenueCat products created and entitlements configured (see REVENUECAT_SETUP.md)
- [ ] RevenueCat sandbox purchase tested on iOS physical device
- [ ] RevenueCat test purchase tested on Android physical device
- [ ] `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_TERMS_URL` live and accessible
- [ ] `EAS_PROJECT_ID` set in `eas.json` extra (not placeholder)

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
