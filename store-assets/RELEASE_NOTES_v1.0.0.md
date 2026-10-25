# Release Notes — GridDown v1.0.0

> Initial public release. Use these notes verbatim in App Store Connect and Google Play Console.

---

## App Store Connect — "What's New" (4000 chars max)

```
GridDown 1.0 — first release.

• 315 survival guides in 19 categories, each with a Quick Glance and cited sources — all offline and free
• Emergency Mode: large-print crisis cards for bleeding, CPR, choking, shock and burns, plus SOS signaling and live GPS / MGRS coordinates
• Field Intelligence (Pro + AI): an AI advisor that runs entirely on your phone and answers from GridDown's guides
• 196 quizzes, a Daily Drill and a 72-hour readiness scan
• Offline tools: HAM repeater database, Morse code, position & waypoints, star map, 10-language translator, calculators and more
• My Kit, 25 checklists, Real-World Flows and a Family Emergency Planner

No account. No ads. No tracking.
```

*~2,814 chars ✓ (well within 4000 char limit)*

---

## Google Play Console — "What's New" (500 chars max)

```
GridDown 1.0 — first release.
• 315 offline survival guides in 19 categories, free
• Emergency Mode for bleeding, CPR, choking, shock, burns + SOS and live GPS/MGRS
• On-device AI advisor (Pro + AI)
• 196 quizzes, Daily Drill, 72-hour readiness scan
• HAM repeaters, Morse, star map, 10-language translator and more
No account. No ads. No tracking.
```

*~460 chars ✓*

---

## Internal / QA Notes (not for store submission)

### v1.0.0 Build Facts
- Build: local Gradle release (`scripts/build-android.ps1 -Target release`), signed with the upload key in `credentials/` — no EAS
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
- Field Intelligence (Pro + AI) needs a one-time model download over Wi-Fi: 1.1 GB (Lite, phones with 4 GB+ RAM) or 2.4 GB (Standard)
- Offline maps display coordinates only; full tile-based offline maps are planned for a future release
- Quiz Daily Drill deterministic seed is date-based — all users receive the same scenario per day
- PDF Emergency Card export requires device storage permission on Android 12 and below

### Planned for v1.1.0
- Clinician sign-off on the medical / health / terrain guides (removes the "Pending clinical review" badges)
- Per-category content tiers (download only what you don't already know) — discussion scheduled
- Bluetooth offline messaging between GridDown devices
- Offline maps with downloadable tile packs by US region
- Apple Watch complication for quick coordinate display

---

*Release date: June 2026*
*Prepared by BannedProduct Media Inc.*
*Git tag: v1.0.0*
