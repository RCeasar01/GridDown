// Jest setup — mock native modules the pure-logic tests touch indirectly.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
