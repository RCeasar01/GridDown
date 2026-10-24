# GridDown Privacy Policy

**Effective Date:** June 19, 2026  
**Company:** BannedProduct Media Inc.  
**App:** GridDown — Survival & Emergency Preparedness  
**Contact:** privacy@bannedproduct.com

---

## 1. Overview

GridDown is built on a single privacy principle: **we do not collect your data.** The app is designed to function entirely offline. No account is required. No data leaves your device for GridDown's servers — because GridDown has no servers that receive personal data.

---

## 2. Information We Do NOT Collect

GridDown does not collect, transmit, sell, or share:

- Your name, email address, or contact information
- Your precise or approximate location
- Your browsing history, reading habits, or guide activity within the app
- Advertising IDs or device fingerprints
- Crash reports or diagnostic data (beyond what Apple/Google collect by default)
- Any biometric or health information

GridDown itself has no servers and no analytics. The only network traffic the app ever makes is the
small set of one-time downloads and purchase checks listed in Section 9 — none of them carry anything
you type, read, or save in the app.

---

## 3. Data Stored on Your Device

All app data is stored locally in an SQLite database on your device. This includes:

| Data Type | Purpose | Leaves Device? |
|-----------|---------|----------------|
| Bookmarked guides | Remember your saved guides | No |
| Recently viewed guides | Show recent history | No |
| Checklist completion state | Track your progress | No |
| Subscription tier | Gate content access | No |
| Downloaded translation models | Enable offline translation | No |
| Translation cache | Speed up repeated translations | No |
| Selected language preference | Remember your language choice | No |

You can clear this data at any time from the Settings screen.

---

## 4. Location Data

GridDown requests location permission to display your GPS coordinates on the offline map. Location data:

- Is **displayed on screen only** — it is never stored, logged, or transmitted
- Is **not required** to use any other feature of the app
- Is accessed only when you navigate to the Map screen
- Stops being accessed when you leave the Map screen

---

## 5. Payments and Subscriptions

All in-app purchases and subscription management are handled entirely by **RevenueCat** and the platform payment processor (Apple App Store or Google Play Store).

- GridDown never sees your payment card information
- RevenueCat may process a non-personally-identifiable anonymous app user ID for purchase verification
- RevenueCat's privacy policy is available at: https://www.revenuecat.com/privacy
- Apple's privacy policy: https://www.apple.com/legal/privacy/
- Google's privacy policy: https://policies.google.com/privacy

---

## 6. On-Device AI (Field Intelligence Advisor)

The Field Intelligence Advisor (Pro + AI plan feature) runs a language model entirely on your device.

- **One-time download.** When you first enable the Advisor you choose a model and the app downloads
  it (1.1 GB or 2.4 GB) directly from **Hugging Face** (huggingface.co), a public model-hosting
  service. That request is an ordinary file download; it contains no account, no identifier set by
  GridDown, and nothing you have typed. It is subject to Hugging Face's privacy policy:
  https://huggingface.co/privacy
- **Everything after that is local.** Your questions, the Advisor's answers, and the guide text it
  reads to answer you are processed on your phone and are never sent to any server.
- Conversations are held only in device memory during the session and are cleared when you close
  the chat or restart the app.
- You can delete a downloaded model at any time from the Advisor's model screen.
- **Reporting an answer.** You can flag any Advisor answer from inside the app (Report → reason). The
  report — your question, the answer, the reason, and the app version — is saved only on your phone
  (newest 50 kept). If you choose "Email to support", your own mail app opens with the report
  pre-filled for you to review, edit, and send to support@bannedproduct.com; nothing is sent
  automatically.

---

## 7. Translation Models

The Offline Translator uses **Google ML Kit**, an on-device translation library.

- When you download a language pack (∼30 MB per language) the file comes from Google's servers and
  the download is subject to Google's privacy policy: https://policies.google.com/privacy
- To manage those downloads, the ML Kit library creates an anonymous **installation identifier** for
  this copy of the app and sends it to Google. It is not linked to your name, email, or any content.
  GridDown does not use or store this identifier.
- Once a pack is downloaded, the text you translate is processed on your phone and is never sent to
  Google or anyone else.
- Translated guide text may be cached in your local database for speed.

---

## 8. Analytics and Crash Reporting

GridDown does not integrate any analytics SDK (no Firebase Analytics, no Mixpanel, no Amplitude, no similar service).

Apple and Google may collect anonymous crash and performance data through their standard platform mechanisms. This is governed by their respective privacy policies, not ours.

---

## 9. Third-Party Services

GridDown integrates only:

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| RevenueCat | Subscription management (paid plans only) | Anonymous app user ID, purchase receipts |
| Apple App Store | iOS payments | Per Apple's terms |
| Google Play Store | Android payments | Per Google's terms |
| Google ML Kit | Translation language-pack download | Anonymous installation ID, pack request |
| Hugging Face | One-time AI model download (Pro + AI) | Ordinary file request only |

No advertising networks, social media SDKs, or data brokers are integrated.

---

## 10. Children's Privacy

GridDown does not knowingly collect data from children under 13. The app does not require any account creation or personal information at any age. If you believe a child's data has been collected through our app, contact privacy@bannedproduct.com and we will address it promptly.

---

## 11. Data Retention

Because we do not collect your data, we have no data to retain. All data in the app lives on your device under your control. Deleting the app removes all locally stored data.

---

## 12. Your Rights

Because we do not collect or process your personal data on our servers, there is nothing for us to:

- Access, correct, or delete on your behalf
- Export or port to another service
- Share with authorities under a data subject request

For any questions, email privacy@bannedproduct.com.

---

## 13. Security

Your data lives on your device, protected by your device's operating system security. GridDown does not operate servers that could be breached to expose your data.

---

## 14. Changes to This Policy

If we change this privacy policy in a material way, we will update the effective date above and note the changes in the app's update release notes. Continued use of the app after a policy update constitutes acceptance of the updated policy.

---

## Contact

BannedProduct Media Inc.  
Email: privacy@bannedproduct.com  
Veteran-owned and operated.
