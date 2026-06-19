"""Fix TypeScript errors in new screen files."""
import pathlib, re

BASE = pathlib.Path(r'E:\Projects\GridDown')

# ─── Fix TranslatorScreen.tsx ─────────────────────────────────────────────────
f = BASE / 'app' / 'screens' / 'TranslatorScreen.tsx'
txt = f.read_text(encoding='utf-8')

# 1. Remove duplicate React import (keep only the first line)
lines = txt.splitlines()
seen_react = False
fixed_lines = []
for line in lines:
    if line.startswith("import React,") and "from 'react'" in line:
        if seen_react:
            continue  # skip the duplicate
        seen_react = True
    fixed_lines.append(line)
txt = '\n'.join(fixed_lines)

# 2. Replace expo-clipboard with react-native Clipboard
txt = txt.replace(
    "import * as Clipboard from 'expo-clipboard';",
    "import { Clipboard } from 'react-native';"
)

# 3. Fix Clipboard usage: Clipboard.setStringAsync -> Clipboard.setString
txt = txt.replace('Clipboard.setStringAsync(', 'Clipboard.setString(')

# 4. Fix downloadLanguageModel callback: (progress: number) -> (p: DownloadProgress)
txt = txt.replace(
    'await downloadLanguageModel(targetLang, (progress: number) => {\n        setDownloadProgress(progress);\n      });',
    'await downloadLanguageModel(targetLang, (p) => {\n        setDownloadProgress(p.progress);\n      });'
)

# 5. Fix lang.flag -> lang.flagEmoji
txt = txt.replace('{lang.flag}', '{lang.flagEmoji}')

f.write_text(txt, encoding='utf-8')
print("TranslatorScreen.tsx fixed.")

# ─── Fix MorseCodeScreen.tsx ──────────────────────────────────────────────────
f2 = BASE / 'app' / 'screens' / 'MorseCodeScreen.tsx'
txt2 = f2.read_text(encoding='utf-8')

# 1. Remove duplicate React import
lines2 = txt2.splitlines()
seen_react2 = False
fixed_lines2 = []
for line in lines2:
    if line.startswith("import React,") and "from 'react'" in line:
        if seen_react2:
            continue
        seen_react2 = True
    fixed_lines2.append(line)
txt2 = '\n'.join(fixed_lines2)

# 2. Replace expo-clipboard with react-native Clipboard
txt2 = txt2.replace(
    "import * as Clipboard from 'expo-clipboard';",
    "import { Clipboard } from 'react-native';"
)

# 3. Fix Clipboard usage
txt2 = txt2.replace('Clipboard.setStringAsync(', 'Clipboard.setString(')

# 4. Remove expo-av import (not installed) - replace with comment
txt2 = txt2.replace(
    "import { Audio } from 'expo-av';",
    "// Audio playback via expo-av (install: npx expo install expo-av)"
)

f2.write_text(txt2, encoding='utf-8')
print("MorseCodeScreen.tsx fixed.")

# ─── Verify no more expo-clipboard references ─────────────────────────────────
for fname in ['TranslatorScreen.tsx', 'MorseCodeScreen.tsx']:
    fp = BASE / 'app' / 'screens' / fname
    content = fp.read_text(encoding='utf-8')
    if 'expo-clipboard' in content:
        print(f"WARNING: {fname} still contains expo-clipboard!")
    elif 'Clipboard' in content:
        print(f"{fname}: Clipboard usage OK")
    if 'lang.flag}' in content and fname == 'TranslatorScreen.tsx':
        print(f"WARNING: {fname} still has lang.flag!")
    duplicate_count = content.count("import React,")
    if duplicate_count > 1:
        print(f"WARNING: {fname} still has {duplicate_count} React imports!")
    else:
        print(f"{fname}: imports OK ({duplicate_count} React import)")

print("\nAll TS error fixes applied.")
