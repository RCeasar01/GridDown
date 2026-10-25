# GridDown Screenshot Guide

This document defines the exact screenshots required for App Store Connect (iOS) and Google Play Console (Android), including dimensions, content flow, and copy overlays.

---

## iOS App Store Requirements

### Device Sizes Required

| Device | Resolution (px) | Required? |
|--------|----------------|----------|
| iPhone 15 Pro Max (6.7″) | 1290 × 2796 | **Yes — required** |
| iPhone SE 3rd gen (4.7″) | 750 × 1334 | Recommended |
| iPad Pro 12.9″ (6th gen) | 2048 × 2732 | If iPad supported |

The 6.7″ screenshot set scales for all other iPhone sizes automatically.

### Count
- Minimum: 1 screenshot per size
- Maximum: 10 screenshots per size
- **GridDown uses: 6 screenshots per size**

### Format
- PNG or JPEG, no alpha channel
- sRGB or Display P3 color space
- No rounded corners or device frames in the raw upload (Apple adds them)

---

## Android Google Play Requirements

### Format
- JPEG or 24-bit PNG (no alpha)
- Minimum: 320px on shortest side
- Maximum: 3840px on longest side
- Aspect ratio: 16:9 or 9:16 recommended
- Count: 2 minimum, 8 maximum
- **GridDown uses: 8 screenshots**

---

## Screenshot Set — 10 Screens

### Screenshot 1: Home Screen
**Filename:** `01_home.png`  
**Overlay text:** “300+ Survival Guides. 100% Offline.”  
**Content to show:** Home screen with category cards (Medical, Water, Fire, Navigation visible), recent guides section  
**Notes:** Light data populated — show 2–3 recently viewed guides

---

### Screenshot 2: Guide Detail
**Filename:** `02_guide_detail.png`  
**Overlay text:** “Step-by-Step. When Seconds Count.”  
**Content to show:** A medical guide (e.g., “Tourniquet Application”) with steps 1–3 visible, the orange step number badges prominent  
**Notes:** Priority badge should show CRITICAL in orange

---

### Screenshot 3: Offline Map
**Filename:** `03_offline_map.png`  
**Overlay text:** “GPS Coordinates. No Signal Needed.”  
**Content to show:** Map screen showing a topo map with current GPS coordinates displayed, “No Internet” indicator  
**Notes:** Coordinates should be realistic (use North Carolina area for authenticity)

---

### Screenshot 4: Checklist
**Filename:** `04_checklist.png`  
**Overlay text:** “72-Hour Kit. Are You Ready?”  
**Content to show:** 72-Hour Bug-Out Bag checklist with ∼5 items checked, progress indicator at top  
**Notes:** Mix of checked and unchecked items for visual interest

---

### Screenshot 5: Search
**Filename:** `05_search.png`  
**Overlay text:** “Find It Fast. Under Pressure.”  
**Content to show:** Search screen with query “water purification”, 4–5 results showing with category tags  
**Notes:** Results should span at least 2 categories

---

### Screenshot 6: Paywall / Upgrade
**Filename:** `06_paywall.png`  
**Overlay text:** “Unlock Everything. Survive Anything.”  
**Content to show:** Paywall screen showing Free / Pro / Pro + AI comparison  
**Notes:** Show the “Most Popular” badge on the Pro tier, pricing visible

---

### Screenshot 7: AI Field Advisor
**Filename:** `07_ai_advisor.png`  
**Overlay text:** “On-Device AI. No Internet. No Cloud.”  
**Content to show:** Field Intelligence Advisor chat with a question like “How do I treat a sucking chest wound?” and a detailed response  
**Notes:** Show the “Running on device” badge. Use a Pro + AI sandbox account, or a `-UnlockAll` test build, for capture.

---

### Screenshot 8: Settings / Languages
**Filename:** `08_settings.png`  
**Overlay text:** “10 Languages. All Offline.”  
**Content to show:** Settings screen scrolled to the Language section, showing Spanish (✓ Downloaded), French (Download button), Arabic visible  
**Notes:** Show at least one language marked as Downloaded (green badge)

---

### Screenshot 9: Category — Medical
**Filename:** `09_categories.png`  
**Overlay text:** “Written by Combat Veterans.”  
**Content to show:** Medical category list with 6–8 guide cards visible, CRITICAL/ADVANCED priority badges prominent  
**Notes:** Include the “Combat Infantryman” and “Eagle First Responder” credential badges

---

### Screenshot 10: Guide with Translation
**Filename:** `10_guide_translation.png`  
**Overlay text:** “Read in Your Language. Still Offline.”  
**Content to show:** A guide with Spanish translation active, the orange “View Original” toggle button visible at top  
**Notes:** Steps should be in Spanish text

---

## Feature Graphic (Google Play Only)

- **File:** `store-assets/FEATURE_GRAPHIC.svg` (and export as PNG 1024×500)
- **Required size:** 1024 × 500 px
- **Format:** PNG (no alpha)
- Located at: `store-assets/FEATURE_GRAPHIC.svg`

---

## App Icon

- iOS: `app/assets/images/icon.png` — 1024×1024 px, no alpha, no rounded corners (iOS adds them)
- Android: `app/assets/images/adaptive-icon.png` — 1024×1024 px, safe zone 66% centered
- Android background color: `#0D0D0D`

---

## Overlay Text Specs (for Figma/Canva)

- Font: SF Pro Display Bold (iOS) / Product Sans Bold (Android)
- Overlay background: 80% opacity `#0D0D0D` bar at bottom 25% of frame
- Overlay text color: `#F0F0F0`
- Accent color: `#8B9E67`
- Max 2 lines of text per screenshot
- Veteran badge: 🇺🇸 + “Veteran-Owned” in small caps in top-right corner

---

## Capture Instructions

```bash
# Capture all iOS screenshots interactively
node scripts/capture-screenshots.js --platform ios

# Capture all Android screenshots interactively
node scripts/capture-screenshots.js --platform android

# Capture both
node scripts/capture-screenshots.js --platform both
```

The script walks you screen-by-screen, waiting for you to navigate the app before capturing.

## What actually shipped for 1.0 (Android, 2026-10-24)

Six PNGs at **1080×1920 (9:16)** in `store-assets/screenshots/android/`, taken on the local emulators
(no device farm, no cost): `01_home`, `02_learn`, `03_tools`, `04_drill`, `05_emergency_mode`, `06_advisor`.
Play accepts 16:9 → 9:16 up to 2:1, so a 1080×2400 (20:9) phone capture is **rejected** — fix the display
size instead of cropping:

```powershell
$adb = 'E:\Android\Sdk\platform-tools\adb.exe'
& $adb shell wm size 1080x1920           # re-lays out the live app at 9:16; `wm size reset` to undo
& $adb shell settings put global sysui_demo_allowed 1
foreach ($c in 'enter','clock -e hhmm 0900','battery -e level 100 -e plugged false',
               'network -e wifi show -e level 4 -e fully true','network -e mobile hide',
               'notifications -e visible false') {
  & $adb shell "am broadcast -a com.android.systemui.demo -e command $c" | Out-Null
}
& $adb shell screencap -p /sdcard/s.png; & $adb pull /sdcard/s.png .\06_advisor.png
```

Gotchas seen while capturing: Google's **"Location Accuracy"** dialog pops over Emergency Mode on the
emulator — tap *No thanks* first; the Advisor needs the **4 GB** AVD (`GridDown_Test`), the 3 GB one stalls.
The Field Intelligence shot should show a finished answer *and* the "From your guides" chips — scroll the
chat to the end before capturing. iOS shots still need the Mac mini (see LAUNCH_CHECKLIST).
