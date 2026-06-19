"""Update store assets and docs for v1.1.0-beta."""
import pathlib

BASE = pathlib.Path(r'E:\Projects\GridDown')

# ── APP_STORE_CONNECT.md ──────────────────────────────────────────────────────
f = BASE / 'store-assets' / 'APP_STORE_CONNECT.md'
txt = f.read_text(encoding='utf-8')

NEW_SECTION = (
    "NEW IN v1.1 — 12 CATEGORIES, 500+ GUIDES\n"
    "---\n"
    "- Offline Translator: 10 languages (Spanish, French, Portuguese, German, Arabic,\n"
    "  Chinese, Japanese, Korean, Russian, Hindi) — fully on-device, no internet needed.\n"
    "  Emergency phrases pre-loaded for instant large-font display.\n"
    "- HAM Radio Repeater Database: 200+ US repeater entries across all 50 states.\n"
    "  Search by state, city, or frequency. Filter by OPEN/ARES/RACES/SKYWARN.\n"
    "- Morse Code Tool: encode/decode in real time, visual flash playback, SOS shortcut,\n"
    "  full international Morse table.\n"
    "- US Army Field Manuals: condensed from public-domain FM 21-76 (Urban Survival),\n"
    "  Map & Compass Navigation, Field Sanitation, Immediate Action Drills, and\n"
    "  Combat Lifesaver Extended Care.\n"
    "- Vehicle & Mechanical: tire change without jack, battery/jump-start, engine\n"
    "  overheating, fuel siphoning, generator maintenance.\n"
    "- Homesteading & Food Production: raising chickens, high-yield emergency gardening,\n"
    "  food preservation without electricity, rainwater collection, livestock butchering.\n"
    "---\n\n"
)

# Insert before the existing WHAT'S INSIDE section
old_marker = "WHAT’S INSIDE\n"
if old_marker in txt:
    txt = txt.replace(old_marker, NEW_SECTION + old_marker, 1)
    f.write_text(txt, encoding='utf-8')
    print("APP_STORE_CONNECT.md updated.")
else:
    # Try plain apostrophe
    old_marker2 = "WHAT'S INSIDE\n"
    if old_marker2 in txt:
        txt = txt.replace(old_marker2, NEW_SECTION + old_marker2, 1)
        f.write_text(txt, encoding='utf-8')
        print("APP_STORE_CONNECT.md updated (plain apostrophe).")
    else:
        print("APP_STORE_CONNECT.md: marker not found, appending note.")
        txt += "\n\n## v1.1 New Features\n" + NEW_SECTION
        f.write_text(txt, encoding='utf-8')

# ── PLAY_CONSOLE.md ───────────────────────────────────────────────────────────
f2 = BASE / 'store-assets' / 'PLAY_CONSOLE.md'
txt2 = f2.read_text(encoding='utf-8')

PLAY_INSERT = (
    "\n\n--- NEW IN v1.1 ---\n"
    "12 content categories now live. New: Offline Translator (10 on-device languages),\n"
    "HAM Radio Repeater Database (200+ entries, all 50 states), Morse Code Tool,\n"
    "US Army Field Manuals (public domain, 5 guides), Vehicle & Mechanical category\n"
    "(5 guides), Homesteading & Food Production category (5 guides).\n"
    "---\n"
)

if "--- NEW IN v1.1 ---" not in txt2:
    # Append at end of description block
    txt2 = txt2.replace("───\nZERO DATA COLLECTION", PLAY_INSERT + "───\nZERO DATA COLLECTION", 1)
    if PLAY_INSERT not in txt2:
        txt2 += PLAY_INSERT
    f2.write_text(txt2, encoding='utf-8')
    print("PLAY_CONSOLE.md updated.")
else:
    print("PLAY_CONSOLE.md already has v1.1 note.")

# ── LAUNCH_CHECKLIST.md ───────────────────────────────────────────────────────
f3 = BASE / 'store-assets' / 'LAUNCH_CHECKLIST.md'
txt3 = f3.read_text(encoding='utf-8')

V11_CHECKLIST = (
    "\n---\n\n## v1.1.0-beta New Feature Checklist\n\n"
    "### Translator Screen\n"
    "- [x] TranslatorScreen.tsx written and added to More stack\n"
    "- [x] MoreScreen.tsx updated with Translator entry\n"
    "- [x] AppNavigator.tsx: Translator screen registered\n"
    "- [ ] Test with @react-native-ml-kit/translate in dev client build\n"
    "- [ ] Test all 10 language model downloads\n"
    "- [ ] Test emergency phrase auto-translate\n\n"
    "### HAM Radio Repeater Database\n"
    "- [x] ham-repeaters.json: 200+ entries, all 50 states\n"
    "- [x] HamRadioScreen.tsx written and added to More stack\n"
    "- [ ] Verify sample frequencies for accuracy\n"
    "- [ ] Test search and filter performance with 200+ entries\n\n"
    "### Morse Code Tool\n"
    "- [x] MorseCodeScreen.tsx written and added to More stack\n"
    "- [x] Encode/decode logic verified\n"
    "- [ ] Test audio playback with expo-av in dev client\n"
    "- [ ] Test SOS shortcut playback\n\n"
    "### New Content Categories\n"
    "- [x] vehicle.json: 5 guides written\n"
    "- [x] homesteading.json: 5 guides written\n"
    "- [x] CategoryGrid.tsx: vehicle + homesteading added (12 total)\n"
    "- [x] helpers.ts: icons + descriptions for new categories\n"
    "- [x] guideRegistry.ts: all new guides registered\n\n"
    "### Field Manuals\n"
    "- [x] fm-001.json through fm-005.json written\n"
    "- [x] guideRegistry.ts: field manuals imported and tagged\n"
    "- [x] HomeScreen.tsx: Field Manuals horizontal row added\n"
    "- [ ] Verify source attribution on all field manual guides\n\n"
    "### v1.1 GitHub\n"
    "- [x] All files committed: feat: HAM radio, vehicle & homestead categories, translator tool, Morse code, field manuals\n"
    "- [x] Tag v1.1.0-beta pushed\n"
)

if "v1.1.0-beta" not in txt3:
    txt3 += V11_CHECKLIST
    f3.write_text(txt3, encoding='utf-8')
    print("LAUNCH_CHECKLIST.md updated.")
else:
    print("LAUNCH_CHECKLIST.md already has v1.1 section.")

print("\nAll store asset updates complete.")
