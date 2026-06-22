# Release Notes — GridDown v1.0.0

> Initial public release. Use these notes verbatim in App Store Connect and Google Play Console.

---

## App Store Connect — "What's New" (4000 chars max)

```
GridDown 1.0 — Initial Release

GridDown is the offline survival guide built for real emergencies — infrastructure failure, natural disasters, and grid-down events. Every feature works without internet, cell service, or power.

WHAT'S IN v1.0

► 60+ Survival Field Guides across 12 categories
Water, Shelter, Fire, Food & Foraging, Medical, Navigation, Communications, Security, Vehicle & Mechanical, Homesteading, Field Manuals, and Disaster Response. Written to military and wilderness medicine standards — step-by-step protocols designed for when professional help is not available.

► Field Intelligence AI — On-Device (Extreme Tier)
Powered by Phi-3.5 Mini running entirely on your device. Ask tactical survival questions and receive context-aware answers with zero internet connection and zero data transmitted.

► 10-Language Offline Translation
Emergency communication in Spanish, French, Portuguese, German, Arabic, Chinese, Japanese, Korean, Russian, and Hindi. All on-device. Emergency phrases pre-loaded for instant display.

► Daily Drill — 54 Survival Scenarios
A new scenario every day. Multiple choice, priority ordering, and decision-tree formats. Readiness score tracking per category. Calibrated to real survival and TCCC standards.

► 72-Hour Readiness Scan
A systematic assessment of your shelter, water, food, medical, communications, and mobility readiness — with actionable gap analysis.

► Gear Inventory with Expiration Tracking
Catalog your survival gear with automated shelf-life alerts. Know what you have. Know what's expired.

► Family Emergency Planner with PDF Emergency Cards
Assign roles, define rally points, build emergency contact cards. Export as PDF for offline storage and family distribution.

► HAM Radio Repeater Database
220+ US repeater entries across all 50 states. Search by state, city, or frequency. Filter by OPEN, ARES, RACES, and SKYWARN designations.

► Morse Code Encoder/Decoder
Real-time encode and decode. Audio playback and flashlight signaling. Full international Morse table. SOS shortcut.

► Star Map for Navigation Without GPS
Identify constellations, locate Polaris, determine cardinal directions — fully offline.

► MGRS / UTM / GPS Coordinate Converter
Convert between military grid, UTM, and decimal degrees. Display live coordinates in any format with no network required.

► Emergency Mode
A crisis-optimized UI for high-stress situations. High-contrast display, simplified navigation, and instant access to critical guides.

PRIVACY
Zero data collection. No analytics. No advertising. No account required for free content. On-device AI stays on your device.

VETERAN-DESIGNED
101st Airborne Division (Air Assault) · 187th Infantry Regiment (Rakkasans) · Combat Infantryman Badge (CIB) · Eagle First Responder · Preventive Medicine Specialist

BannedProduct Media Inc. — 100% Veteran-Owned

Feedback and bug reports: github.com/RCeasar01/GridDown/issues
```

*~2,814 chars ✓ (well within 4000 char limit)*

---

## Google Play Console — "What's New" (500 chars max)

```
GridDown 1.0 — Initial release.

60+ offline survival guides · Field Intelligence AI (on-device) · 10-language offline translation · 54-scenario Daily Drill · 72-Hour Readiness Scan · Gear Inventory · Family Emergency Planner · HAM radio database · Morse code tool · Star map navigation · MGRS/UTM coordinate converter · Emergency Mode.

100% offline. Veteran-designed. BannedProduct Media Inc.
```

*~460 chars ✓*

---

## Internal / QA Notes (not for store submission)

### v1.0.0 Build Facts
- EAS Build Profile: production
- Android output: `.aab` (bundleRelease)
- iOS distribution: App Store
- iOS minimum deployment: 16.0
- Android targetSdkVersion: 35 / minSdkVersion: 26
- Bundle ID (iOS): com.bannedproduct.griddown
- Package (Android): com.bannedproduct.griddown
- app.config.ts version: 1.0.0
- iOS buildNumber: 1
- Android versionCode: 1

### Known Limitations (v1.0.0)
- AI Field Intelligence Advisor (Extreme tier) requires initial model download (~2 GB) on first launch
- Offline maps display coordinates only; full tile-based offline maps are planned for a future release
- Quiz Daily Drill deterministic seed is date-based — all users receive the same scenario per day
- PDF Emergency Card export requires device storage permission on Android 12 and below

### Planned for v1.1.0
- Expanded guide library (additional advanced medical and field manual content)
- Bluetooth offline messaging between GridDown devices
- Offline maps with downloadable tile packs by US region
- Apple Watch complication for quick coordinate display

---

*Release date: June 2026*
*Prepared by BannedProduct Media Inc.*
*Git tag: v1.0.0*
