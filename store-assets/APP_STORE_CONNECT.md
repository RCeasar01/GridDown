# App Store Connect Metadata — GridDown

Copy-paste ready fields for App Store Connect (https://appstoreconnect.apple.com).

---

## App Information

### Name (30 chars max)
```
GridDown
```

### Subtitle (30 chars max)
```
Offline Survival & Emergency
```

### Bundle ID
```
com.bannedproduct.griddown
```

### SKU
```
griddown-v1
```

### Primary Category
```
Medical
```

### Secondary Category
```
Reference
```

### Content Rights
- [ ] This app does not contain, show, or access third-party content
- [x] This app contains, shows, or accesses third-party content — and we have the rights to it

---

## App Store Listing (Per Locale)

### Locale: English (U.S.) — en-US

#### Description (4000 chars max)
```
GRIDDOWN — OFFLINE SURVIVAL GUIDE

When the power is out, the cell towers are down and help can't reach you, GridDown still works. Every guide, tool and checklist lives on your phone. No signal. No account. No tracking.

100% OFFLINE
Install once and the whole library works anywhere — dead zones, basements, the backcountry, a week-long blackout. The optional AI advisor and translator languages download once over Wi-Fi, then run offline too.

WHAT'S INSIDE

► 315 Survival Guides in 19 Categories — free
Water · Fire · Shelter · Food · Medical · Health & Hygiene · Navigation · Comms · Security · Tools & Kits · Disaster · Grid-Down Home · Terrain & Climate · Vehicle · Homesteading · Power & Energy · Urban Survival · Leadership · For Children.
Each guide opens with a Quick Glance — what to do right now — then step-by-step instructions, warnings and pro tips. Every guide lists the public sources it was written from: FEMA, CDC, American Red Cross, NOAA, US Army field manuals and more.

► Emergency Mode — free
One tap (or long-press the app icon) for a large-print crisis screen: severe bleeding, CPR, choking, shock, burns, survival priorities, SOS signaling, and your live GPS / MGRS coordinates to read to a dispatcher.

► Field Intelligence — On-Device AI (Pro + AI)
Ask in plain English and get an answer drawn from GridDown's own guides, with the guide it used listed. The model runs entirely on your phone: one download over Wi-Fi (1.1 GB Lite or 2.4 GB Standard, matched to your device), then no internet — your questions never leave the device.

► 196 Quizzes + Daily Drill
Multiple-choice, priority-ordering and decision-tree scenarios with a readiness score for each category. Water, Fire and Shelter are free; Pro unlocks every category.

► 72-Hour Readiness Scan
50 questions, about 3–4 minutes, and a personal prep plan at the end.

► Offline Tools
HAM repeater database (200+ US repeaters, Pro) · Radio frequencies · Morse code with audio and flashlight · Position & waypoints in lat/long, UTM and MGRS · Coordinate converter · Star map · 10-language offline translator · Survival and water-purification calculators · Knot guide · Signaling.

► Plan Ahead
My Kit (Bug-Out, Vehicle, Home, Medic) · 25 disaster checklists · 6 Real-World Flows (Bug-Out in 15 Minutes, Shelter-in-Place 72 Hours, Post-Storm Assessment and more) · Gear inventory with expiration alerts · Family Emergency Planner with printable cards · Setup personalized to your profile and region · Night Ops low-light mode.

VETERAN-BUILT
Designed by a combat veteran — 101st Airborne Division (Air Assault), Combat Infantryman, Eagle First Responder, Preventive Medicine Specialist. BannedProduct Media Inc. is 100% veteran-owned.

PRIVACY
No account. No analytics. No ads. No tracking. Location is shown on screen — never stored or sent. The AI runs on your device. Backups are a file you export and keep.

PLANS
Free — every guide, Emergency Mode, the offline tools, checklists, kits, flows, Family Planner, and Water / Fire / Shelter quizzes.
Pro — all 196 quizzes, Daily Drill in every category, and the HAM repeater database.
Pro + AI — everything in Pro plus the on-device Field Intelligence advisor.
Monthly, yearly and lifetime options. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period; manage or cancel them in Settings → Apple ID → Subscriptions.

MEDICAL DISCLAIMER
GridDown is educational reference material for when professional care is delayed or unavailable. It does not replace medical training, professional care, or calling emergency services when you can.
```

#### Promotional Text (170 chars max — can be updated without a new build)
```
The grid goes down. GridDown doesn't. 315 survival guides, Emergency Mode and offline tools on your phone — no signal, no account, no tracking.
```

#### Keywords (100 chars max, comma-separated)
```
survival,prepper,offline,emergency,grid down,first aid,HAM radio,disaster,preparedness,blackout
```

#### Support URL
```
https://bannedproduct.com/support
```

#### Marketing URL (optional)
```
https://rceasar01.github.io/GridDown/
```

#### Privacy Policy URL
```
https://rceasar01.github.io/GridDown/privacy
```

---

## App Review Information

### Review Notes
```
GridDown is an offline emergency-preparedness reference. Every guide and tool works without an internet connection. No login is required at any point — the app opens to onboarding, then the home screen.

Free vs paid: all 315 guides, Emergency Mode, the offline tools, checklists, kits and flows are free. Pro unlocks every quiz category and the HAM repeater database. Pro + AI adds the Field Intelligence advisor.

To review paid features, use a Sandbox Apple ID with any GridDown product. The locked states (lock card with "See plans") can be reviewed without a purchase.

Field Intelligence (Pro + AI) downloads a model once over Wi-Fi (1.1 GB Lite or 2.4 GB Standard, from Hugging Face) and then runs entirely on-device. No questions or answers leave the device. Each answer has a "Report" control for flagging inaccurate or unsafe output.

Medical content: guides cite their public sources (FEMA, CDC, American Red Cross, NOAA, US Army field manuals). Guides still awaiting clinician sign-off carry a visible "Pending clinical review" badge, and every medical guide shows a disclaimer.

Contact: support@bannedproduct.com
```

### Demo Account
```
No account required. App launches directly to home screen.
```

---

## Ratings & Content Warnings

**Age Rating:** 12+

| Category | Rating |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | Frequent |
| Alcohol, Tobacco, or Drug Use | None |
| Simulated Gambling | None |
| Sexual Content or Nudity | None |

**Justification for 12+:** The app contains detailed medical content including wound care, trauma treatment, and field medicine procedures. This content is educational and written for emergency preparedness. No graphic imagery is included.

---

## In-App Purchases Setup in App Store Connect

Create the following under **In-App Purchases** in App Store Connect:

> **Prices not final.** Two price sets exist (the table below vs. the paywall's fallback labels $4.99 / $34.99 / $89.99 and $10.99 / $74.99 / $159.99). Pick one before creating products — see `LAUNCH_CHECKLIST.md` → *Pricing decision*. The paywall shows live store prices, so the store is the source of truth once products exist.
> Display names below are what customers see: **Pro** and **Pro + AI**. Product IDs keep the legacy `extreme` wording (renaming an ID after launch breaks existing purchases).
> **Do not create the Discord product** — the community feature is switched off (`COMMUNITY_ENABLED = false`).

| Product ID | Type | Price (pending) | Display Name |
|-----------|------|-------|--------------|
| `com.bannedproduct.griddown.monthly` | Auto-Renewable Subscription | $3.99/mo | GridDown Pro — Monthly |
| `com.bannedproduct.griddown.yearly` | Auto-Renewable Subscription | $29.99/yr | GridDown Pro — Yearly |
| `com.bannedproduct.griddown.lifetime` | Non-Consumable | $79.99 | GridDown Pro — Lifetime |
| `com.bannedproduct.griddown.extreme_monthly` | Auto-Renewable Subscription | $9.99/mo | GridDown Pro + AI — Monthly |
| `com.bannedproduct.griddown.extreme_yearly` | Auto-Renewable Subscription | $69.99/yr | GridDown Pro + AI — Yearly |
| `com.bannedproduct.griddown.extreme_lifetime` | Non-Consumable | $149.99 | GridDown Pro + AI — Lifetime |

### Subscription Groups

**One group: "GridDown"** (so a Pro subscriber can upgrade to Pro + AI and Apple prorates it)
- griddown.extreme_yearly (Level 1 — highest)
- griddown.extreme_monthly (Level 1)
- griddown.yearly (Level 2)
- griddown.monthly (Level 2)
- The two lifetime products are Non-Consumable and sit outside the group.

---

## App Store Screenshots Order

Captured at 1080×1920 in `store-assets/screenshots/android/`; iOS needs 1320×2868 captures of the same screens (see SCREENSHOT_GUIDE.md).

1. `01_home.png` — "300+ Survival Guides. Zero Signal Needed."
2. `05_emergency_mode.png` — "Built for the Worst Five Minutes."
3. `02_learn.png` — "19 Categories. Every Guide Free."
4. `06_advisor.png` — "An AI Advisor That Runs on Your Phone."
5. `03_tools.png` — "15+ Offline Tools. No Bars Required."
6. `04_drill.png` — "Train Daily. Know What to Do."

---

## Quiz System & Daily Drill (shipped in 1.0)

- 196 scenario quizzes across the guide categories in three formats: multiple choice (144), priority ordering (37) and decision tree (15)
- Daily Drill: one quiz per day, the same for every user, shown on Home with category, difficulty and format
- Readiness score per category (correct answers / attempts), stored on the device
- Optional daily reminder notification at a user-chosen time
- Free: Water, Fire and Shelter quizzes. Pro: every category. (Gate: `quizzes.premium` in `app/config/access.ts`.)
