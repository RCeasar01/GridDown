/**
 * Generation watchdog — drives the real generate() path against a mockCtx llama.rn
 * context. Mirrors the field failure seen on a 3 GB device: the native side
 * finishes but neither tokens nor the result ever reach JS.
 */
const mockCtx = {
  mode: 'hang' as 'hang' | 'stream',
  completion: jest.fn(),
  stopCompletion: jest.fn(async () => {}),
  release: jest.fn(async () => {}),
};

jest.mock('llama.rn', () => ({
  initLlama: jest.fn(async () => mockCtx),
}));

import * as engine from '../app/utils/advisorEngine';

beforeEach(() => {
  mockCtx.completion.mockReset();
  mockCtx.stopCompletion.mockClear();
  mockCtx.release.mockClear();
});

async function loadFake() {
  await engine.loadModel(engine.ADVISOR_MODELS.lite, '/tmp/fake.gguf');
  expect(engine.isModelLoaded()).toBe(true);
}

test('watchdog rejects a silent completion and releases the model', async () => {
  mockCtx.completion.mockImplementation(() => new Promise(() => {})); // never settles, no tokens
  await loadFake();
  const started = Date.now();
  await expect(
    engine.generate([{ role: 'user', content: 'hi' }], { watchdogMs: 120 }),
  ).rejects.toBeInstanceOf(engine.GenerationTimeoutError);
  expect(Date.now() - started).toBeGreaterThanOrEqual(100);
  expect(mockCtx.stopCompletion).toHaveBeenCalled();
  expect(mockCtx.release).toHaveBeenCalled();
  expect(engine.isModelLoaded()).toBe(false);
});

test('a healthy stream re-arms the watchdog and resolves normally', async () => {
  mockCtx.completion.mockImplementation(async (_params: unknown, onToken: (d: { token: string }) => void) => {
    const parts = ['Get ', 'to ', 'the ', 'lowest ', 'floor.'];
    for (const p of parts) {
      await new Promise((r) => setTimeout(r, 60)); // each gap is under the watchdog...
      onToken({ token: p });
    }
    return { text: parts.join(''), stopped_limit: 0 }; // ...but the total (300 ms) is well over it
  });
  await loadFake();
  const seen: string[] = [];
  const out = await engine.generate([{ role: 'user', content: 'tornado' }], {
    watchdogMs: 150,
    onToken: (t) => seen.push(t),
  });
  expect(out).toBe('Get to the lowest floor.');
  expect(seen).toHaveLength(5);
  expect(mockCtx.release).not.toHaveBeenCalled();
  expect(engine.isModelLoaded()).toBe(true);
});

test('a non-timeout failure propagates untouched and keeps the model loaded', async () => {
  mockCtx.completion.mockImplementation(async () => { throw new Error('Context is busy'); });
  await loadFake();
  await expect(engine.generate([{ role: 'user', content: 'x' }], { watchdogMs: 1000 })).rejects.toThrow('Context is busy');
  expect(mockCtx.release).not.toHaveBeenCalled();
  expect(engine.isModelLoaded()).toBe(true);
});
