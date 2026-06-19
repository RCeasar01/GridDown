# Google Play Data Safety Form — GridDown

This document contains the exact answers to submit in the Google Play Console
Data Safety section (Policy → App content → Data safety).

---

## Section 1: Data Collection and Security

### Does your app collect or share any of the required user data types?

**Answer: YES** — Only for payment verification via RevenueCat (see Section 3).

### Is all of the user data collected by your app encrypted in transit?

**Answer: YES** — All network communication uses HTTPS/TLS.

### Do you provide a way for users to request that their data is deleted?

**Answer: YES** — Users can clear all locally-stored app data from Settings > Clear
Recently Viewed. Since no personal data is stored on GridDown’s servers, there is
no server-side deletion request required. Uninstalling the app removes all local data.

---

## Section 2: Data Types Collected

### Personal Info

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Name | No | — |
| Email address | No | — |
| User IDs | No | — |
| Address | No | — |
| Phone number | No | — |
| Race and ethnicity | No | — |
| Political or religious beliefs | No | — |
| Sexual orientation | No | — |
| Other personal info | No | — |

### Financial Info

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| User payment info | No | Handled by Google Play / Apple App Store |
| Purchase history | Shared (via 3rd party) | RevenueCat receives anonymous purchase ID for subscription verification |
| Credit score | No | — |
| Other financial info | No | — |

### Location

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Precise location | No | Displayed on screen only; never stored or transmitted |
| Approximate location | No | — |

### App Activity

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| App interactions | No | — |
| In-app search history | No | — |
| Installed apps | No | — |
| Other user-generated content | No | — |
| Other actions | No | — |

### App Info and Performance

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Crash logs | No | No crash SDK integrated |
| Diagnostics | No | — |
| Other app performance data | No | — |

### Device or Other Identifiers

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Device or other identifiers | No | RevenueCat uses an anonymous ID generated per install, not tied to device IMEI or advertising ID |

---

## Section 3: Data Shared with Third Parties

### RevenueCat

**What data is shared:** An anonymous, non-personally-identifiable app user ID for purchase verification.

**Why:** To validate subscription status and unlock premium content without storing payment card data in our app.

**Is it optional?** No — required for paid subscription features. Free tier does not require purchase verification.

**Link to RevenueCat’s privacy policy:** https://www.revenuecat.com/privacy

### Google MLKit (Translation)

**What data is shared:** A model download request (no user content is sent).

**Why:** To download the on-device language model file. The actual translation happens locally with no data sent to Google.

**Is it optional?** Yes — users must opt in by pressing the Download Model button in Settings.

**Link to Google’s privacy policy:** https://policies.google.com/privacy

---

## Section 4: Security Practices

### Does your app use encryption?
**Answer: YES** — All network calls (RevenueCat API, MLKit model download) use HTTPS/TLS 1.2+. Local SQLite data is protected by the Android OS sandbox.

### Does your app follow the Families Policy?
**Answer: NO** — GridDown is not primarily directed at children and does not target the Kids category.

### Does your app let users request deletion of their data?
**Answer: YES** — Users can clear all locally stored app data from Settings → Clear Recently Viewed. Uninstalling the app removes all data. No server-side deletion is needed since no personal data is stored on GridDown servers.

---

## Section 5: Play Console Form Completion

When filling out the form in Play Console:

1. **Data collected or shared:** Select “Yes” (for RevenueCat purchase ID)
2. **All data encrypted in transit:** Select “Yes”
3. **Users can request deletion:** Select “Yes”
4. Under **Financial info → Purchase history:**
   - Collection: No
   - Sharing: Yes
   - Shared with: RevenueCat
   - Purpose: App functionality (subscription verification)
   - Required: Yes (for paid features)
   - Processed ephemerally: No
5. All other data type checkboxes: **Not selected**

---

## Privacy Policy URL for Play Console

```
https://rceasar01.github.io/GridDown/privacy
```

---

## Notes

- GridDown has no analytics SDK, no advertising SDK, no crash reporting SDK.
- The app does not collect device identifiers, advertising IDs, or IP addresses.
- Location permission is granted by the user for on-screen display only; no location data is stored, transmitted, or logged.
- AI (Field Intelligence Advisor) conversations are 100% on-device; no conversation content leaves the device.
- Translation is 100% on-device after model download; translated text is cached in local SQLite only.
