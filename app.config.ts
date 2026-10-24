import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GridDown',
  slug: 'griddown',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './app/assets/images/icon.png',
  userInterfaceStyle: 'dark',
  // Splash config moved to the expo-splash-screen plugin (see plugins below) in SDK 57.
  assetBundlePatterns: ['**/*'],
  ios: {
    // iPad deferred to 1.1: Apple requires iPad screenshots + a tested tablet layout
    // whenever this is true, and neither exists yet.
    supportsTablet: false,
    bundleIdentifier: 'com.bannedproduct.griddown',
    buildNumber: '1',
    // SDK 57 requires iOS 16.4 minimum deployment target.
    deploymentTarget: '16.4',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'GridDown uses your location to display your current coordinates on the map screen. Your location is never stored or transmitted.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'GridDown uses your location for offline maps and navigation. Your location is never stored or transmitted.',
      // Microphone / Camera / Photos: declared because bundled SDKs reference these
      // entitlements. GridDown itself does not use them.
      NSMicrophoneUsageDescription:
        'GridDown does not use your microphone. This key is required by an included SDK.',
      NSCameraUsageDescription:
        'GridDown does not use your camera.',
      NSPhotoLibraryUsageDescription:
        'GridDown does not access your photo library.',
      UIBackgroundModes: ['remote-notification'],
    },
    // Apple Privacy Manifest (required since May 2024). Expo writes PrivacyInfo.xcprivacy
    // into the app target and registers it in the Xcode project.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './app/assets/images/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    package: 'com.bannedproduct.griddown',
    versionCode: 1,
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'RECEIVE_BOOT_COMPLETED'],
  },
  web: { favicon: './app/assets/images/favicon.png' },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './app/assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#0D0D0D',
      },
    ],
    'expo-localization',
    'expo-sqlite',
    'expo-file-system',
    'expo-sharing',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow GridDown to use your location for offline maps and coordinate display. Your location is never stored or transmitted.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './app/assets/images/icon.png',
        color: '#8B9E67',
        sounds: [],
      },
    ],
    // iOS 16.4 minimum required by SDK 57. Android compile/target SDK use the
    // Expo SDK defaults (which track Google Play requirements).
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.4',
        },
        android: {
          minSdkVersion: 26,
          // Smaller store download. R8 is safe here because every reflective
          // surface (llama.rn JNI callbacks, ML Kit, RevenueCat) is kept below.
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          extraProguardRules: [
            '# llama.rn: C++ calls back into these classes by name via JNI',
            '-keep class com.rnllama.** { *; }',
            '# fast-mlkit-translate-text TurboModule + Google ML Kit',
            '-keep class com.fastmlkittranslatetext.** { *; }',
            '-keep class com.google.mlkit.** { *; }',
            '-keep class com.google.android.gms.internal.mlkit_** { *; }',
            '# expo-quick-actions',
            '-keep class expo.modules.quickactions.** { *; }',
            '-dontwarn com.google.mlkit.**',
          ].join('\n'),
        },
      },
    ],
    // Home-screen long-press → Emergency Mode (iOS Quick Actions / Android App Shortcuts).
    'expo-quick-actions',
    // On-device LLM runtime (Field Intelligence). Adds iOS increased-memory
    // entitlements for production builds and C++20 flags for the native pods.
    ['llama.rn', { entitlementsProfile: 'production' }],
    // Android release signing from credentials/keystore.properties (gitignored).
    './plugins/withReleaseSigning',
  ],
  extra: {
    // EAS_PROJECT_ID must be set as an EAS secret / env var for production builds.
    // An empty fallback fails fast instead of registering to a bogus project.
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '' },
    revenueCatApiKeyIos:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
    revenueCatApiKeyAndroid:
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
    privacyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_URL ??
      'https://rceasar01.github.io/GridDown/privacy',
    termsUrl:
      process.env.EXPO_PUBLIC_TERMS_URL ??
      'https://rceasar01.github.io/GridDown/terms',
  },
});

