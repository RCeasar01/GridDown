#!/usr/bin/env node
/**
 * GridDown Screenshot Capture Script
 *
 * Automates capturing App Store and Google Play screenshots using
 * the iOS Simulator and Android Emulator via xcrun and adb.
 *
 * Usage:
 *   node scripts/capture-screenshots.js --platform ios
 *   node scripts/capture-screenshots.js --platform android
 *   node scripts/capture-screenshots.js --platform both
 *
 * Prerequisites:
 *   - Xcode + iOS Simulator installed (for iOS)
 *   - Android Studio + emulator running (for Android)
 *   - EAS dev client build installed on the simulator/emulator
 *   - App running in the simulator/emulator
 *
 * Output: store-assets/screenshots/{ios|android}/
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PLATFORM = (() => {
  const idx = process.argv.indexOf('--platform');
  return idx !== -1 ? process.argv[idx + 1] : 'ios';
})();

const OUT_DIR = path.join(__dirname, '..', 'store-assets', 'screenshots');

/** App Store requires exactly these sizes (points, @3x = 1242×2688 for iPhone 15 Pro Max) */
const IOS_DEVICE = 'iPhone 15 Pro Max'; // adjust to your booted simulator

/** Play Store: screenshots up to 3840px on either side, min 320px */
const ANDROID_DEVICE_SERIAL = process.env.ANDROID_SERIAL ?? 'emulator-5554';

// ---------------------------------------------------------------------------
// Screen sequences to capture
// ---------------------------------------------------------------------------

/**
 * Each entry:
 *   name      — output filename stem
 *   delay     — ms to wait before capturing (let animations settle)
 *   deepLink  — optional: URL scheme to open (griddown://screen)
 *   instruction — human-readable prompt shown in interactive mode
 */
const SCREENS = [
  {
    name: '01_home',
    delay: 2000,
    instruction: 'Navigate to the HOME screen. Make sure some category cards are visible.',
  },
  {
    name: '02_guide_detail',
    delay: 1500,
    instruction: 'Open a GUIDE — e.g. “Tourniquets”. Scroll so 2–3 steps are visible.',
  },
  {
    name: '03_offline_map',
    delay: 2000,
    instruction: 'Navigate to the MAP screen. GPS coordinates should be visible.',
  },
  {
    name: '04_checklist',
    delay: 1500,
    instruction: 'Open a CHECKLIST — e.g. 72-Hour Kit. Check 3–4 items.',
  },
  {
    name: '05_search',
    delay: 1200,
    instruction: 'Navigate to SEARCH. Type “water purification”. Results should show.',
  },
  {
    name: '06_paywall',
    delay: 1500,
    instruction: 'Open the PAYWALL / upgrade screen. Show all three plan tiers.',
  },
  {
    name: '07_ai_advisor',
    delay: 2000,
    instruction: 'Navigate to the AI FIELD ADVISOR screen (Extreme plan feature or locked state).',
  },
  {
    name: '08_settings',
    delay: 1500,
    instruction: 'Navigate to SETTINGS. Show the language download section.',
  },
  {
    name: '09_categories',
    delay: 1200,
    instruction: 'Navigate to a CATEGORY list — e.g. Medical. Show 6+ guide cards.',
  },
  {
    name: '10_guide_translation',
    delay: 2000,
    instruction: 'Open a guide with TRANSLATION ACTIVE (Spanish or French). Show the translate bar.',
  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

// ---------------------------------------------------------------------------
// iOS Screenshot
// ---------------------------------------------------------------------------

async function captureIOS(screen, outDir) {
  const outPath = path.join(outDir, `${screen.name}.png`);
  console.log(`\n📸 [iOS] ${screen.name}`);
  console.log(`   → ${screen.instruction}`);
  await prompt('   Press ENTER when ready to capture...');
  await sleep(screen.delay);
  try {
    execSync(`xcrun simctl io booted screenshot "${outPath}"`, { stdio: 'pipe' });
    console.log(`   ✅ Saved: ${path.basename(outPath)}`);
  } catch (err) {
    console.error(`   ❌ xcrun error: ${err.message}`);
    console.log('   ⚠️  Make sure iOS Simulator is open with a booted device.');
  }
}

// ---------------------------------------------------------------------------
// Android Screenshot
// ---------------------------------------------------------------------------

async function captureAndroid(screen, outDir) {
  const outPath = path.join(outDir, `${screen.name}.png`);
  const devicePath = `/sdcard/griddown_screenshot_${screen.name}.png`;
  console.log(`\n📸 [Android] ${screen.name}`);
  console.log(`   → ${screen.instruction}`);
  await prompt('   Press ENTER when ready to capture...');
  await sleep(screen.delay);
  try {
    execSync(`adb -s ${ANDROID_DEVICE_SERIAL} shell screencap -p "${devicePath}"`, { stdio: 'pipe' });
    execSync(`adb -s ${ANDROID_DEVICE_SERIAL} pull "${devicePath}" "${outPath}"`, { stdio: 'pipe' });
    execSync(`adb -s ${ANDROID_DEVICE_SERIAL} shell rm "${devicePath}"`, { stdio: 'pipe' });
    console.log(`   ✅ Saved: ${path.basename(outPath)}`);
  } catch (err) {
    console.error(`   ❌ adb error: ${err.message}`);
    console.log('   ⚠️  Make sure Android emulator is running and adb is in PATH.');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🟧 GridDown Screenshot Capture');
  console.log('='.repeat(50));
  console.log(`Platform: ${PLATFORM.toUpperCase()}`);
  console.log('Mode: Interactive (press ENTER for each screen)');
  console.log('='.repeat(50));
  console.log('⚠️  Before starting:');
  console.log('   1. Open the iOS Simulator or Android Emulator');
  console.log('   2. Launch GridDown (dev client build or EAS preview build)');
  console.log('   3. Log in to an Extreme plan account for full feature coverage');
  console.log('   4. Enable Dark Mode on the device (it is the only theme)');
  console.log('');

  const platforms = PLATFORM === 'both' ? ['ios', 'android'] : [PLATFORM];

  for (const platform of platforms) {
    const outDir = path.join(OUT_DIR, platform);
    ensureDir(outDir);
    console.log(`\n📂 Output directory: ${outDir}\n`);

    for (const screen of SCREENS) {
      if (platform === 'ios') await captureIOS(screen, outDir);
      else await captureAndroid(screen, outDir);
    }

    console.log(`\n✅ All ${SCREENS.length} ${platform.toUpperCase()} screenshots captured.`);
    console.log(`   Files saved to: ${outDir}`);
  }

  console.log('\n🎉 Done! Next steps:');
  console.log('   1. Review screenshots in store-assets/screenshots/');
  console.log('   2. Add marketing overlays/text in Figma or Canva if desired');
  console.log('   3. Upload to App Store Connect and Google Play Console');
  console.log('   4. Refer to store-assets/SCREENSHOT_GUIDE.md for requirements');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
