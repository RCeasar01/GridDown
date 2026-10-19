"""One-off migration (2026-10-19): switch every screen from react-native's
deprecated SafeAreaView to react-native-safe-area-context's (needed for
Android edge-to-edge insets on SDK 57), and wrap the app root in SafeAreaProvider.
Idempotent. Usage: python scripts\\migrate-safearea.py E:\\Projects\\GridDown
"""
import re, sys, pathlib

root = pathlib.Path(sys.argv[1])
screens = sorted(list((root / "app" / "screens").glob("*.tsx")) + list((root / "app" / "screens" / "auth").glob("*.tsx")))
changed = []

RN_IMPORT = re.compile(r"import\s*\{([^}]*)\}\s*from\s*'react-native';", re.S)

for f in screens:
    t = f.read_text(encoding="utf-8")
    if "react-native-safe-area-context" in t:
        continue
    m = RN_IMPORT.search(t)
    if not m or "SafeAreaView" not in m.group(1):
        continue
    names = [n.strip() for n in m.group(1).replace("\n", " ").split(",")]
    names = [n for n in names if n and n != "SafeAreaView"]
    if "\n" in m.group(1):
        body = "\n  " + ", ".join(names) + ",\n"
    else:
        body = " " + ", ".join(names) + " "
    new_import = f"import {{{body}}} from 'react-native';"
    if not names:
        new_import = ""
    t = t[: m.start()] + new_import + "\nimport { SafeAreaView } from 'react-native-safe-area-context';" + t[m.end():]
    t = t.replace("\n\nimport { SafeAreaView } from 'react-native-safe-area-context';", "\nimport { SafeAreaView } from 'react-native-safe-area-context';")
    f.write_text(t, encoding="utf-8")
    changed.append(f.name)

app = root / "App.tsx"
t = app.read_text(encoding="utf-8")
if "SafeAreaProvider" not in t:
    t = t.replace("import { StatusBar } from 'expo-status-bar';",
                  "import { StatusBar } from 'expo-status-bar';\nimport { SafeAreaProvider } from 'react-native-safe-area-context';")
    old = """  return (
    <ErrorBoundary>
      {/* backgroundColor removed: Android edge-to-edge (SDK 54+) ignores it */}
      <StatusBar style="light" />
      {onboardingCompleted ? <AppNavigator /> : <OnboardingScreen />}
    </ErrorBoundary>
  );"""
    new = """  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* backgroundColor removed: Android edge-to-edge (SDK 54+) ignores it */}
        <StatusBar style="light" />
        {onboardingCompleted ? <AppNavigator /> : <OnboardingScreen />}
      </ErrorBoundary>
    </SafeAreaProvider>
  );"""
    old_crlf = old.replace("\n", "\r\n"); new_crlf = new.replace("\n", "\r\n")
    if t.count(old) == 1:
        t = t.replace(old, new)
    elif t.count(old_crlf) == 1:
        t = t.replace(old_crlf, new_crlf)
    else:
        raise SystemExit("App.tsx render block not found")
    app.write_text(t, encoding="utf-8")
    changed.append("App.tsx")

print(f"changed {len(changed)} files:", ", ".join(changed))
