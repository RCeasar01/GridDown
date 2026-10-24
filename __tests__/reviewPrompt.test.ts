import { shouldPrompt } from '../app/utils/reviewPrompt';

const DAY = 86_400_000;
describe('shouldPrompt', () => {
  test('waits for 3 successes', () => {
    expect(shouldPrompt({ successes: 2, prompts: 0, lastPromptAt: null })).toBe(false);
    expect(shouldPrompt({ successes: 3, prompts: 0, lastPromptAt: null })).toBe(true);
  });
  test('respects the 90-day gap and the 3-prompt lifetime cap', () => {
    const now = Date.now();
    expect(shouldPrompt({ successes: 10, prompts: 1, lastPromptAt: now - 10 * DAY }, now)).toBe(false);
    expect(shouldPrompt({ successes: 10, prompts: 1, lastPromptAt: now - 91 * DAY }, now)).toBe(true);
    expect(shouldPrompt({ successes: 10, prompts: 3, lastPromptAt: now - 400 * DAY }, now)).toBe(false);
  });
});
