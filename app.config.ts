import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'GridDown',
  slug: 'griddown',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './app/assets/images/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './app/assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0D0D0D',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bannedproduct.griddown',
    buildNumber: '1',
    // Apple requires iOS 16.0 minimum as of 2025 submission requirements.
    // @ts-ignore: deploymentTarget is valid in EAS config but not in @expo/config-types yet
    deploymentTarget: '16.0',
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
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './app/assets/images/adaptive-icon.png',
      backgroundColor: '#0D0D0D',
    },
    package: 'com.bannedproduct.griddown',
    versionCode: 1,
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  web: { favicon: './app/assets/images/favicon.png' },
  plugins: [
    'expo-sqlite',
    'expo-file-system',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow GridDown to use your location for offline maps and coordinate display. Your location is never stored or transmitted.',
      },
    ],
    '@react-native-ml-kit/translate',
    // Apple 2025: minimum iOS 16.0 / Google Play: targetSdkVersion 35
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.0',
        },
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          minSdkVersion: 26,
        },
      },
    ],
    // Apple 2025: Privacy Manifest (PrivacyInfo.xcprivacy)
    './plugins/withPrivacyManifest',
  ],
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID ?? 'YOUR_EAS_PROJECT_ID' },
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
