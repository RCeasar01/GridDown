const mockGet = jest.fn(async (_opts: Record<string, unknown>) => ({ coords: { latitude: 35.58, longitude: -80.81 } }));
jest.mock('expo-location', () => ({
  getCurrentPositionAsync: (opts: Record<string, unknown>) => mockGet(opts),
  Accuracy: { Balanced: 3, High: 4, Lowest: 1 },
}));

import { getPosition, _resetGeoForTests, hasOfferedSettingsDialog } from '../app/utils/geo';

beforeEach(() => { mockGet.mockClear(); _resetGeoForTests(); });

test('the Location Accuracy dialog is offered once per session, then suppressed', async () => {
  await getPosition({ accuracy: 3 });
  await getPosition({ accuracy: 3 });
  await getPosition({ accuracy: 4 });
  const flags = mockGet.mock.calls.map((c) => c[0].mayShowUserSettingsDialog);
  expect(flags).toEqual([true, false, false]);
  expect(hasOfferedSettingsDialog()).toBe(true);
});

test('a call that opts out never consumes the one offer', async () => {
  await getPosition({ mayShowUserSettingsDialog: false });
  expect(hasOfferedSettingsDialog()).toBe(false);
  await getPosition({});
  const flags = mockGet.mock.calls.map((c) => c[0].mayShowUserSettingsDialog);
  expect(flags).toEqual([false, true]);
});

test('other options pass through untouched', async () => {
  await getPosition({ accuracy: 4 });
  expect(mockGet.mock.calls[0][0]).toEqual({ accuracy: 4, mayShowUserSettingsDialog: true });
});
