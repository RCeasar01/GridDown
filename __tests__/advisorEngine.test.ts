import { buildPrompt, estimateTokens, formatReference, trimToSentence, stripEchoedReference, REPLY_TOKENS, ADVISOR_MODELS } from '../app/utils/advisorEngine';

describe('buildPrompt', () => {
  const sys = 'You are Field Intelligence.';
  const turn = (role: 'user' | 'assistant', n: number) => ({ role, content: `${role} message ${n} `.repeat(30) });

  test('always returns system first and the user text last', () => {
    const out = buildPrompt({ systemPrompt: sys, history: [], userText: 'hello', contextTokens: 2048 });
    expect(out[0]).toEqual({ role: 'system', content: sys });
    expect(out[out.length - 1]).toEqual({ role: 'user', content: 'hello' });
  });

  test('trims the oldest history to fit the context window', () => {
    const history = Array.from({ length: 40 }, (_, i) => turn(i % 2 === 0 ? 'user' : 'assistant', i));
    const out = buildPrompt({ systemPrompt: sys, history, userText: 'q', contextTokens: 2048 });
    const total = out.reduce((n, m) => n + estimateTokens(m.content), 0);
    expect(total).toBeLessThanOrEqual(2048 - REPLY_TOKENS);
    expect(out.length).toBeLessThan(history.length + 2);
    // most recent turn is kept
    expect(out[out.length - 2].content).toBe(history[history.length - 1].content);
  });

  test('never starts history with an assistant turn', () => {
    const history = [turn('assistant', 0), turn('user', 1), turn('assistant', 2)];
    const out = buildPrompt({ systemPrompt: sys, history, userText: 'q', contextTokens: 100000 });
    expect(out[1].role).toBe('user');
  });

  test('puts reference material into the final user turn, not the system prompt', () => {
    const ref = formatReference(['GUIDE: A', 'GUIDE: B']);
    const out = buildPrompt({ systemPrompt: sys, reference: ref, history: [], userText: 'q' });
    expect(out[0].content).toBe(sys);
    const last = out[out.length - 1].content;
    expect(last).toContain('Guide: A');
    expect(last).toContain('Question: q');
    expect(last).toContain('in your own words');
  });
});

describe('model catalog', () => {
  test('lite model fits in less RAM and is smaller than standard', () => {
    expect(ADVISOR_MODELS.lite.sizeBytes).toBeLessThan(ADVISOR_MODELS.standard.sizeBytes);
    expect(ADVISOR_MODELS.lite.minDeviceRamBytes).toBeLessThan(ADVISOR_MODELS.standard.minDeviceRamBytes);
  });
  test('model URLs are https HuggingFace resolve links', () => {
    for (const m of Object.values(ADVISOR_MODELS)) {
      expect(m.url).toMatch(/^https:\/\/huggingface\.co\/.+\/resolve\/main\/.+\.gguf$/);
    }
  });
});

describe('trimToSentence', () => {
  test('cuts a length-capped reply back to the last full sentence', () => {
    expect(trimToSentence('Boil the water for one minute. Let it cool. Remember,')).toBe('Boil the water for one minute. Let it cool.');
  });
  test('leaves text alone when no sentence boundary is late enough', () => {
    expect(trimToSentence('Boil. a very long unfinished clause that keeps going and going')).toBe('Boil. a very long unfinished clause that keeps going and going');
  });
});

describe('stripEchoedReference', () => {
  test('removes echoed reference scaffolding lines', () => {
    const raw = '[1] Guide: Tornado (disaster)\nSituation: a tornado\nGet to the lowest floor now.\nStay away from windows.';
    expect(stripEchoedReference(raw)).toBe('Get to the lowest floor now.\nStay away from windows.');
  });
  test('keeps the text when stripping would leave nothing useful', () => {
    expect(stripEchoedReference('Guide: X')).toBe('Guide: X');
  });
});
