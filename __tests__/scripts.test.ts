/* eslint-disable @typescript-eslint/no-var-requires -- Node built-ins without @types/node */
/**
 * Windows PowerShell 5.1 reads a BOM-less .ps1 as ANSI: an em dash (UTF-8 E2 80 94) decodes to a
 * curly double quote and silently ends the string, so the whole script fails to parse. That kept
 * build-android.ps1 from ever running. Keep every PowerShell script plain ASCII.
 */
const fs: { readdirSync(p: string): string[]; readFileSync(p: string, e: string): string } = require('fs');

test.each(fs.readdirSync('scripts').filter((f) => f.endsWith('.ps1')).map((f) => [f]))('scripts/%s is ASCII-only', (f) => {
  const src = fs.readFileSync(`scripts/${f}`, 'utf8');
  const bad = [...src].map((c, i) => [c, i] as const).filter(([c]) => c.charCodeAt(0) > 127);
  const where = bad.slice(0, 3).map(([c, i]) => `${JSON.stringify(c)} at line ${src.slice(0, i).split('\n').length}`);
  expect(where).toEqual([]);
});
