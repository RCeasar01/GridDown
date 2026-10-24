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

### Google ML Kit (Translation)

**What data is shared:** A language-pack download request plus an anonymous **installation ID** that
the ML Kit SDK generates for this install (Firebase Installations). Observed in logcat as
`MLKitFbInstsRestClient`. No user content, no account, no advertising ID.

**Why:** To download and manage on-device language packs. Translation itself happens locally.

**Is it optional?** Yes — only triggered when the user taps Download on a language.

**Play form mapping:** *Device or other IDs → Collected: No (GridDown never reads it), Shared: Yes
(to Google), Purpose: App functionality, Ephemeral: No, Optional: Yes.*

**Link to Google's privacy policy:** https://policies.google.com/privacy

### Hugging Face (AI model download, Pro + AI only)

**What data is shared:** An ordinary HTTPS file download of the chosen model (1.1 GB or 2.4 GB).
No identifier is attached by GridDown. Standard web-request metadata (IP address) is visible to
Hugging Face as with any download.

**Why:** The Field Intelligence model is too large to ship inside the app binary.

**Is it optional?** Yes — only on the user's tap, after an in-app disclosure.

**Link to Hugging Face's privacy policy:** https://huggingface.co/privacy

---

## Section 4: Security Practices

### Does your app use encryption?
**Answer: YES** — All network calls (RevenueCat API, ML Kit pack download, Hugging Face model download) use HTTPS/TLS 1.2+. Local SQLite data is protected by the Android OS sandbox.

### Does your app follow the Families Policy?
**Answer: NO** — GridDown is not primarily directed at children and does not target the Kids category.

### Does your app let users request deletion of their data?
**Answer: YES** — Users can clear history from Settings, export/delete their own data (Settings → Export my data), and uninstalling the app removes everything. No server-side deletion is needed since no personal data is stored on GridDown servers.

---

## Section 5: Play Console Form Completion

When filling out the form in Play Console:

1. **Data collected or shared:** Select "Yes"
2. **All data encrypted in transit:** Select "Yes"
3. **Users can request deletion:** Select "Yes"
4. Under **Financial info → Purchase history:**
   - Collection: No
   - Sharing: Yes
   - Shared with: RevenueCat
   - Purpose: App functionality (subscription verification)
   - Required: Yes (for paid features)
   - Processed ephemerally: No
5. Under **Device or other IDs → Device or other IDs:**
   - Collection: No
   - Sharing: Yes
   - Shared with: Google (ML Kit SDK installation ID)
   - Purpose: App functionality (language-pack download management)
   - Required: No (only if the user downloads a translation pack)
   - Processed ephemerally: No
6. All other data type checkboxes: **Not selected**

---

## Privacy Policy URL for Play Console

```
https://rceasar01.github.io/GridDown/privacy
```

---

## Notes

- GridDown has no analytics SDK, no advertising SDK, no crash reporting SDK.
- GridDown itself does not read or store device identifiers, advertising IDs, or IP addresses.
  The Google ML Kit SDK generates an anonymous installation ID when a language pack is downloaded;
  it is declared above because Google receives it.
- Location permission is granted by the user for on-screen display only; no location data is stored, transmitted, or logged.
- AI (Field Intelligence Advisor) conversations are 100% on-device; no conversation content leaves the device.
- Translation is 100% on-device after model download; translated text is cached in local SQLite only.
