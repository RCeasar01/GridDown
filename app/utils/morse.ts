/** Morse code table and codec. Pure functions — unit-tested in __tests__/morse.test.ts. */
export const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '/': '-..-.',
  'SOS': '...---...',
};

export const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

export function encodeText(text: string): string {
  if (!text.trim()) return '';
  const words = text.toUpperCase().split(' ');
  return words
    .map(word =>
      word
        .split('')
        .map(char => MORSE_CODE[char] || '')
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .join(' / ');
}

export function decodeMorse(morse: string): string {
  if (!morse.trim()) return '';
  const words = morse.split(' / ');
  return words
    .map(word =>
      word
        .split(' ')
        .map(symbol => REVERSE_MORSE[symbol] || '?')
        .join('')
    )
    .join(' ');
}
