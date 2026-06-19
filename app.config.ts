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
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'GridDown uses your location to show your coordinates for offline navigation.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'GridDown uses your location for offline maps and navigation.',
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
    ['expo-location', {
      locationAlwaysAndWhenInUsePermission:
        'Allow GridDown to use your location for offline maps and coordinate display.',
    }],
    '@react-native-ml-kit/translate',
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
