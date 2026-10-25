# RevenueCat Setup — GridDown (go-live runbook)

How to turn real purchases on. The app side is already built and tested; this is the store +
RevenueCat configuration that has to match it.

**Source of truth in code**
- What each plan unlocks → `app/config/access.ts` (`FEATURE_TIER`)
- Product IDs, packages, entitlements → `app/config/products.ts` (pinned by `__tests__/products.test.ts`)

**Cost:** RevenueCat is free while monthly tracked revenue stays under $2,500; above that it charges
1% of tracked revenue. Nothing is billed before the app earns that much. Apple and Google take
their own 15–30% store commission separately.

---

## 0. Decide prices first

Two candidate price sets exist (see `LAUNCH_CHECKLIST.md` → *Pricing decision*):

| Plan | Set A (store docs) | Set B (paywall fallback labels) |
|---|---|---|
| Pro monthly / yearly / lifetime | $3.99 / $29.99 / $79.99 | $4.99 / $34.99 / $89.99 |
| Pro + AI monthly / yearly / lifetime | $9.99 / $69.99 / $149.99 | $10.99 / $74.99 / $159.99 |

Product IDs below contain no prices, so either set works with the same IDs. After products exist,
the paywall shows the store's live localized price; the fallback labels in `PaywallScreen.tsx`
only appear offline — set them to the chosen prices too.

---

## 1. Create the store products

### App Store Connect → In-App Purchases / Subscriptions

| Product ID | Type | Display name |
|---|---|---|
| `com.bannedproduct.griddown.monthly` | Auto-renewable subscription | GridDown Pro — Monthly |
| `com.bannedproduct.griddown.yearly` | Auto-renewable subscription | GridDown Pro — Yearly |
| `com.bannedproduct.griddown.lifetime` | Non-consumable | GridDown Pro — Lifetime |
| `com.bannedproduct.griddown.extreme_monthly` | Auto-renewable subscription | GridDown Pro + AI — Monthly |
| `com.bannedproduct.griddown.extreme_yearly` | Auto-renewable subscription | GridDown Pro + AI — Yearly |
| `com.bannedproduct.griddown.extreme_lifetime` | Non-consumable | GridDown Pro + AI — Lifetime |

Put all four subscriptions in **one subscription group** ("GridDown"), Pro + AI ranked above Pro,
so upgrades are prorated.

### Google Play Console → Monetize → Products

| Product ID | Type | Base plan | Display name |
|---|---|---|---|
| `griddown_pro_monthly` | Subscription | `monthly` (1 month, auto-renew) | GridDown Pro — Monthly |
| `griddown_pro_yearly` | Subscription | `yearly` (1 year, auto-renew) | GridDown Pro — Yearly |
| `griddown_pro_lifetime` | In-app product | — | GridDown Pro — Lifetime |
| `griddown_extreme_monthly` | Subscription | `monthly` | GridDown Pro + AI — Monthly |
| `griddown_extreme_yearly` | Subscription | `yearly` | GridDown Pro + AI — Yearly |
| `griddown_extreme_lifetime` | In-app product | — | GridDown Pro + AI — Lifetime |

Product IDs can never be renamed or reused once created. The `extreme` wording is internal only;
customers see the display names. **Don't create a Discord product** — the community feature is
off (`COMMUNITY_ENABLED = false`).

Play needs the app uploaded to a testing track (internal is fine) before products can be created.

---

## 2. RevenueCat project

1. https://app.revenuecat.com → new project **GridDown**.
2. **Add App → App Store**: bundle ID `com.bannedproduct.griddown`; upload an App Store Connect
   API key (.p8, *App Manager* role is enough) and the In-App Purchase key.
3. **Add App → Google Play**: package `com.bannedproduct.griddown`; upload a Google Cloud service
   account JSON with *View financial data* + *Manage orders and subscriptions* in Play Console
   → Users and permissions.
4. Copy the public SDK keys (`appl_…`, `goog_…`).

---

## 3. Products, entitlements, offering in RevenueCat

**Products** — import all twelve store products (RevenueCat → Product catalog → Import).

**Entitlements** — exactly two:

| Entitlement ID | Attach |
|---|---|
| `pro` | the three Pro products on each store |
| `extreme` | the three Pro + AI products on each store |

The app reads the cycle (monthly / yearly / lifetime) from the product that granted the
entitlement, so lifetime buyers are recognised as lifetime. Pro + AI includes everything in Pro
in the app even though the products aren't attached to `pro`.

**Offering** — one offering, identifier `default`, marked *Current*, with six packages:

| Package | iOS product | Android product |
|---|---|---|
| `$rc_monthly` | `com.bannedproduct.griddown.monthly` | `griddown_pro_monthly` |
| `$rc_annual` | `com.bannedproduct.griddown.yearly` | `griddown_pro_yearly` |
| `$rc_lifetime` | `com.bannedproduct.griddown.lifetime` | `griddown_pro_lifetime` |
| `extreme_monthly` | `com.bannedproduct.griddown.extreme_monthly` | `griddown_extreme_monthly` |
| `extreme_annual` | `com.bannedproduct.griddown.extreme_yearly` | `griddown_extreme_yearly` |
| `extreme_lifetime` | `com.bannedproduct.griddown.extreme_lifetime` | `griddown_extreme_lifetime` |

The paywall finds packages by product ID first and falls back to these package IDs.

---

## 4. Keys into the build

`.env.local` (gitignored — never commit keys):

```env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…
EXPO_PUBLIC_UNLOCK_ALL=0
```

Then build: `.\scripts\build-android.ps1 -Target release` (Play bundle). Without keys the app
runs on the free tier and the paywall reports purchases unavailable. `build-android.ps1` refuses
to make a Play bundle while `EXPO_PUBLIC_UNLOCK_ALL` is on.

---

## 5. Test before release

- **Android:** add your Google account under Play Console → *License testing*, install from the
  internal testing track, buy each plan (test cards are never charged), then **Restore Purchases**
  on a fresh install.
- **iOS:** create a Sandbox tester (Users and Access → Sandbox), sign in under Settings → App
  Store → Sandbox Account, buy and restore.
- **Check in RevenueCat → Customers** that the right entitlement (`pro` / `extreme`) is active.
- In the app, **Settings → Current plan** should read Pro Monthly / Pro + AI Lifetime etc., the
  Drill tab's locked categories should open, and Tools → HAM Radio Repeaters should load.
- If a purchase succeeds but the plan doesn't unlock, the app says so and asks the user to
  restore — that means an entitlement isn't attached to a product in step 3.

---

## 6. Founder pricing (first 3 months) — early subscribers keep their price

Decision (2026-10-24): anyone who subscribes within the first 3 months keeps that price for as long
as they stay subscribed. Both stores do this natively; the app enforces nothing.

1. **Launch at the founder price as the list price** (not as an introductory offer — intro offers
   end after one period, which is the opposite of what we want).
2. Set `FOUNDER_PRICING_ENDS` in `app/config/products.ts` to launch + 3 months and rebuild; the
   paywall then shows "Founder pricing: subscribe before <date> and keep this price for as long as
   you stay subscribed." Put the same sentence in App Store Connect → *Promotional Text* (no build
   needed) and Play → *Short description* for the window.
3. **Protect "unless they lapse" from card failures:** App Store Connect → subscription → enable
   **Billing Grace Period**; Play Console → subscription → base plan → enable **grace period**
   (7+ days) and **account hold**. A failed payment is then retried for weeks and the subscription
   (and its price) survives if it recovers. Only a real cancellation followed by a new signup lapses.
4. **On the end date, raise the list price:**
   - App Store Connect → subscription → Subscription Prices → *Plan a price change* → choose
     **"Preserve current price for existing subscribers"**. No consent prompt is shown.
   - Play Console → subscription → base plan → *Edit price* → existing subscribers stay on the
     **legacy price** (don't start a price-change migration).
   - Lifetime products: just change the price; one-time purchases aren't affected.
   - Set `FOUNDER_PRICING_ENDS` to `null`, remove the line from the store copy, rebuild.
5. Someone who cancels, lets it expire, and resubscribes later pays the new price automatically —
   that's the store behaviour, nothing to do.

## 7. Turning more paywalls on later

Change a value in `FEATURE_TIER` (`app/config/access.ts`) to `PLAN.PRO` or `PLAN.PRO_AI`, update
the plan feature lists in `PaywallScreen.tsx` and the store descriptions to match, rebuild. Every
gate already has its lock screen and paywall route. Medical, Water/Fire/Shelter and every guide
Emergency Mode links to can never be locked (`ALWAYS_FREE_GUIDE_IDS`).

---

## 8. Webhooks (not needed)

GridDown has no server; entitlements are checked on the device through the RevenueCat SDK.
