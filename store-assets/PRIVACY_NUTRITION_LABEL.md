# iOS App Store — Privacy Nutrition Label

> App Store Connect → App Privacy section for GridDown (com.bannedproduct.griddown).
> This documents what data is collected, how it is used, and whether it is linked to the user.

---

## Summary

**Data Not Collected: Yes**

GridDown does not collect any data from users. All app data — guides, checklists, inventory, quiz scores, planner entries, settings — is stored locally on the user's device and never transmitted to any server.

---

## Data Types: Complete Declaration

### ☑ Data Not Collected

Confirm in App Store Connect: **"We do not collect data from this app."**

| Data Type | Collected? | Reason |
|---|---|---|
| Contact Info (name, email, phone, address) | **No** | No account required; no user profile |
| Health & Fitness | **No** | — |
| Financial Info | **No** | Purchases processed by Apple; GridDown never sees payment data |
| Location (precise or coarse) | **No** | Location displayed on-device only; never stored, logged, or transmitted |
| Sensitive Info | **No** | — |
| Contacts | **No** | — |
| User Content (photos, videos, audio, etc.) | **No** | — |
| Browsing History | **No** | — |
| Search History | **No** | In-app search is local SQLite only; never transmitted |
| Identifiers (User ID, Device ID, IDFA, etc.) | **No** | — |
| Purchases | **No** | Purchase receipts handled by Apple/RevenueCat; GridDown stores only entitlement state locally |
| Usage Data (interaction, crash data, diagnostics) | **No** | No analytics SDK integrated |
| Diagnostics (crash logs, performance data) | **No** | No Crashlytics or equivalent |
| Other Data | **No** | — |

---

## Tracking

**Does this app track users?** No.

GridDown does not use any advertising networks, cross-app tracking identifiers, or third-party analytics that link user data across apps or websites.

- **No IDFA usage** (Identifier for Advertisers)
- **No cross-app tracking**
- **No advertising networks**
- **No third-party analytics SDKs** (no Firebase Analytics, no Amplitude, no Mixpanel, no Segment)

---

## Third-Party SDKs and Their Data Practices

| SDK | Purpose | Data Transmitted |
|---|---|---|
| RevenueCat | In-app purchase receipt validation and entitlement management | Apple purchase receipts (handled natively by iOS); RevenueCat receives transaction IDs only, not personal data. No personal identifiers are passed from GridDown. |
| Expo Notifications | Push notification delivery (optional Daily Drill reminder) | Device push token, registered with Apple APNs only. GridDown's notification server does not store user identifiers. |
| All other libraries | On-device only (SQLite, Expo Router, React Native, Phi-3.5 Mini) | None — all processing is local |

---

## Location Data Detail

- GridDown requests location permission to display the user's GPS coordinates on the Map screen and Coordinate Converter.
- Location is **displayed on-device only**.
- Location is **never stored** in any database or file.
- Location is **never transmitted** to any server, API, or third party.
- Location permission is **optional** — the app functions fully without it.

**App Store Connect selection:** Location → Not Collected

---

## In-App Purchases / RevenueCat

- Payment processing is handled entirely by Apple via StoreKit.
- GridDown never receives, stores, or transmits credit card numbers, billing addresses, or any financial data.
- RevenueCat receives an anonymized App User ID (a random UUID generated locally) and Apple purchase receipts to validate subscription entitlements.
- This random ID is **not linked to any personal information**.

**App Store Connect selection:** Purchases → Not Collected (Apple handles all payment data)

---

## On-Device AI (Extreme Tier)

The Field Intelligence AI advisor is powered by Phi-3.5 Mini, a large language model that runs **entirely on the user's device**.

- No queries are transmitted to any server.
- No responses are logged remotely.
- No conversation history is stored outside the device's local SQLite database.
- The model file itself is downloaded once during Extreme tier onboarding and stored locally.

---

## Privacy Policy

Full privacy policy: **https://rceasar01.github.io/GridDown/privacy**

---

## App Store Connect — Step-by-Step Entry

1. Go to App Store Connect → Your App → App Privacy
2. Click **"Get Started"**
3. Answer: **"No"** to "Does this app collect data from users?"
4. Click **"Publish"**

> No additional data type declarations are needed. The single "No" response completes the Privacy Nutrition Label and displays "Data Not Collected" on the App Store product page.

---

*Last updated: v1.0.0 — June 2026*
*Prepared by BannedProduct Media Inc.*
