# RevenueCat Setup — GridDown

Step-by-step guide to configure RevenueCat for all 8 GridDown product IDs.

---

## 1. Create RevenueCat Account

1. Go to https://app.revenuecat.com/
2. Create account or log in
3. Create a new **Project**: Name it `GridDown`

---

## 2. Add Apps

In your GridDown project:

### Add iOS App
1. Click **Add App** → **App Store**
2. App Name: `GridDown`
3. Bundle ID: `com.bannedproduct.griddown`
4. App Store Connect API Key: Upload your `.p8` key from App Store Connect
   - Go to: App Store Connect → Users and Access → Keys → App Store Connect API
   - Create key with **Developer** role
   - Download `.p8`, note the Key ID and Issuer ID
5. Copy the **iOS API Key** (starts with `appl_`)

### Add Android App
1. Click **Add App** → **Google Play**
2. App Name: `GridDown`
3. Package Name: `com.bannedproduct.griddown`
4. Service Account JSON: Upload Google Play service account JSON
   - Go to: Google Play Console → Setup → API access → Create service account
   - Grant **Release manager** permissions
   - Download JSON key file
5. Copy the **Android API Key** (starts with `goog_`)

---

## 3. Update Environment Variables

Add to `.env.local`:
```env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_key_here
```

Add to EAS project secrets (for cloud builds):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "appl_your_key_here"
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_your_key_here"
```

---

## 4. Create Products in RevenueCat

Go to: **RevenueCat Project** → **Products**

Create the following products (they map to your App Store and Play Store product IDs):

### iOS Products

| Identifier | Type | Price |
|-----------|------|-------|
| `com.bannedproduct.griddown.monthly` | Auto-Renewable Subscription | $3.99/mo |
| `com.bannedproduct.griddown.yearly` | Auto-Renewable Subscription | $29.99/yr |
| `com.bannedproduct.griddown.lifetime` | Non-Consumable | $79.99 |
| `com.bannedproduct.griddown.discord` | Auto-Renewable Subscription | $1.99/mo |
| `com.bannedproduct.griddown.extreme_monthly` | Auto-Renewable Subscription | $9.99/mo |
| `com.bannedproduct.griddown.extreme_yearly` | Auto-Renewable Subscription | $69.99/yr |
| `com.bannedproduct.griddown.extreme_lifetime` | Non-Consumable | $149.99 |

### Android Products

| Identifier | Type | Price |
|-----------|------|-------|
| `griddown_pro_monthly` | Auto-Renewable Subscription | $3.99/mo |
| `griddown_pro_yearly` | Auto-Renewable Subscription | $29.99/yr |
| `griddown_pro_lifetime` | One-Time Purchase | $79.99 |
| `griddown_discord` | Auto-Renewable Subscription | $1.99/mo |
| `griddown_extreme_monthly` | Auto-Renewable Subscription | $9.99/mo |
| `griddown_extreme_yearly` | Auto-Renewable Subscription | $69.99/yr |
| `griddown_extreme_lifetime` | One-Time Purchase | $149.99 |

---

## 5. Create Entitlements

Go to: **RevenueCat Project** → **Entitlements**

Create these entitlements:

### Entitlement 1: `pro`
- Identifier: `pro`
- Description: Access to full guide library and Pro features
- Attached products:
  - `com.bannedproduct.griddown.monthly`
  - `com.bannedproduct.griddown.yearly`
  - `com.bannedproduct.griddown.lifetime`
  - `griddown_pro_monthly`
  - `griddown_pro_yearly`
  - `griddown_pro_lifetime`

### Entitlement 2: `extreme`
- Identifier: `extreme`
- Description: AI Field Advisor, USB export, all Extreme features
- Attached products:
  - `com.bannedproduct.griddown.extreme_monthly`
  - `com.bannedproduct.griddown.extreme_yearly`
  - `com.bannedproduct.griddown.extreme_lifetime`
  - `griddown_extreme_monthly`
  - `griddown_extreme_yearly`
  - `griddown_extreme_lifetime`

### Entitlement 3: `discord`
- Identifier: `discord`
- Description: Discord community access
- Attached products:
  - `com.bannedproduct.griddown.discord`
  - `griddown_discord`

---

## 6. Create Offerings

Go to: **RevenueCat Project** → **Offerings**

### Default Offering
- Identifier: `default`
- Description: Main paywall offering

Create **Packages** inside the default offering:

| Package Identifier | Product (iOS) | Product (Android) |
|-------------------|---------------|-------------------|
| `$rc_monthly` | griddown.monthly | griddown_pro_monthly |
| `$rc_annual` | griddown.yearly | griddown_pro_yearly |
| `$rc_lifetime` | griddown.lifetime | griddown_pro_lifetime |
| `extreme_monthly` | griddown.extreme_monthly | griddown_extreme_monthly |
| `extreme_annual` | griddown.extreme_yearly | griddown_extreme_yearly |
| `extreme_lifetime` | griddown.extreme_lifetime | griddown_extreme_lifetime |
| `discord_monthly` | griddown.discord | griddown_discord |

---

## 7. SDK Initialization Code

The SDK is initialized in `app/utils/purchases.ts`. Ensure it matches:

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export async function initializePurchases(): Promise<void> {
  const key = Platform.OS === 'ios'
    ? (process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '')
    : (process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '');

  if (!key) {
    console.warn('[Purchases] RevenueCat API key not set. Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / ANDROID_KEY in .env.local.');
    return;
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: key });
}

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}

export async function getOfferings() {
  return Purchases.getOfferings();
}

export async function purchasePackage(pkg: import('react-native-purchases').PurchasesPackage) {
  return Purchases.purchasePackage(pkg);
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}
```

---

## 8. Entitlement Mapping to App Tiers

In your `useAppStore.ts`, map RevenueCat entitlements to app tiers:

```typescript
const { entitlements } = customerInfo;

if (entitlements.active['extreme']) {
  // Check if lifetime
  const extremeLifetime = customerInfo.nonSubscriptionTransactions
    .some(t => t.productIdentifier.includes('extreme_lifetime'));
  setUserTier(extremeLifetime ? 'extreme_lifetime' : 'extreme_monthly');
} else if (entitlements.active['pro']) {
  const proLifetime = customerInfo.nonSubscriptionTransactions
    .some(t => t.productIdentifier.includes('lifetime'));
  setUserTier(proLifetime ? 'lifetime_standard' : 'monthly');
} else if (entitlements.active['discord']) {
  setUserTier('discord');
} else {
  setUserTier('free');
}
```

---

## 9. Testing

### iOS Sandbox Testing
1. Create Sandbox Tester in App Store Connect: Users & Access → Sandbox Testers
2. Sign in to Sandbox account on device: Settings → App Store → Sandbox Account
3. Run the dev client build on physical device
4. Trigger a purchase — no real charge occurs in Sandbox

### Android Testing
1. Add test email to Google Play → License Testing
2. Run internal test track build on physical device
3. Trigger a purchase — Google Play test purchases are free

### RevenueCat Dashboard
- Monitor purchases in real-time at https://app.revenuecat.com
- Check entitlements are being granted correctly per purchase

---

## 10. Webhook (Optional)

For future server-side functionality, set up a RevenueCat webhook:
1. RevenueCat → Project → Integrations → Webhooks
2. URL: `https://your-server.com/revenuecat-webhook`
3. Events: subscribe to `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`

Not required for the current offline-only architecture.

---

## v2.0 Tier Mapping

As of v2.0 the PaywallScreen presents 3 primary tiers + 1 family option instead of 8 separate plans.
The RevenueCat products and entitlements on the backend are **unchanged** — only the UI grouping changed.

### UI Tier → Legacy RC Tiers

| New UI Plan | Displayed Prices | Maps to RC Products | Legacy Internal Tiers Covered |
|------------|-----------------|---------------------|-------------------------------|
| **Free** | $0 forever | (none) | `free` |
| **Pro (monthly)** | $4.99/mo | `griddown_monthly_399` | `monthly` |
| **Pro (yearly)** | $34.99/yr | `griddown_yearly_2999` | `yearly` |
| **Pro (lifetime)** | $89.99 one-time | `griddown_lifetime_standard_7999` | `lifetime_standard` |
| **Pro + AI (monthly)** | $10.99/mo | `griddown_extreme_monthly_999` | `extreme_monthly` |
| **Pro + AI (yearly)** | $74.99/yr | `griddown_extreme_yearly_6999` | `extreme_yearly` |
| **Pro + AI (lifetime)** | $159.99 one-time | `griddown_extreme_lifetime_14999` | `extreme_lifetime` |
| **Family Plan** | $54.99/yr | `griddown_yearly_2999` (shared) | (new — maps to yearly) |

### What was removed from UI

- **Discord Only** ($1.99/mo) — removed from the paywall UI entirely. The RC product and entitlement
  (`griddown_discord` / `discord`) still exist so existing subscribers retain access. The `discord`
  tier still resolves in `purchases.ts` but is no longer presented as a purchase option.

### Entitlement checks in-app

Existing entitlement check logic in `purchases.ts` is **unchanged**. The `userTier` value stored in
the app's Zustand store and SQLite `user_tier` table still uses the legacy tier names
(`monthly`, `yearly`, `extreme_monthly`, etc.). The new UI plan cards use `legacyTiers` arrays to
determine "isCurrent" state so a `yearly` subscriber correctly sees "CURRENT" on the Pro card.

### Billing chip → RC product mapping

When a user selects a billing chip on the Pro or Pro + AI card, `RC_PRODUCT_MAP` in
`PaywallScreen.tsx` provides the correct product identifier to pass to `purchasePackage()`:

```typescript
const RC_PRODUCT_MAP = {
  pro: {
    monthly:  'griddown_monthly_399',
    yearly:   'griddown_yearly_2999',
    lifetime: 'griddown_lifetime_standard_7999',
  },
  pro_ai: {
    monthly:  'griddown_extreme_monthly_999',
    yearly:   'griddown_extreme_yearly_6999',
    lifetime: 'griddown_extreme_lifetime_14999',
  },
};
```
