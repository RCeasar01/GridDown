/** Jest config — unit tests for pure logic and content integrity (no native modules needed). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|llama\\.rn|fast-mlkit-translate-text|expo-quick-actions)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['app/utils/**/*.ts', '!app/utils/purchases.ts'],
};
