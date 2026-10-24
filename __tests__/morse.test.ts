import { encodeText, decodeMorse, MORSE_CODE } from '../app/utils/morse';

describe('morse', () => {
  test('encodes SOS and words', () => {
    expect(encodeText('SOS')).toBe('... --- ...');
    expect(encodeText('help me')).toBe('.... . .-.. .--. / -- .');
  });
  test('round-trips text', () => {
    const text = 'GRID DOWN 2026';
    expect(decodeMorse(encodeText(text))).toBe(text);
  });
  test('unknown symbols decode to ?', () => {
    expect(decodeMorse('......-')).toBe('?');
  });
  test('table has every letter and digit', () => {
    for (const c of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') expect(MORSE_CODE[c]).toBeTruthy();
  });
});
