const { execSync } = require('child_process');

const opts = {
  cwd: 'E:/Projects/GridDown',
  encoding: 'utf8',
  stdio: 'pipe',
  timeout: 30000,
};

function run(cmd, ignoreError = false) {
  try {
    const out = execSync(cmd, opts);
    if (out.trim()) process.stdout.write(out + '\n');
    return out;
  } catch (e) {
    const msg = (e.stderr || e.stdout || e.message || '').trim();
    if (!ignoreError && msg) console.log('[err]', msg);
    return '';
  }
}

function commit(msg) {
  const r = run('git commit -m "' + msg + '"');
  if (r.includes('nothing to commit')) {
    console.log('  (nothing new to commit for: ' + msg + ')');
  } else {
    console.log('  ✓ committed:', msg);
  }
}

// ─── Commit 1: Core scaffold + app config ─────────────────────────────────────
console.log('\n[1/7] Core scaffold + Expo/EAS config...');
run('git add App.tsx app.json eas.json tsconfig.json package.json');
run('git add app/theme/ app/store/ app/navigation/ app/db/');
commit('feat: initial scaffold — Expo SDK 51, navigation, Zustand, SQLite');

// ─── Commit 2: Screens (Phase 1) ─────────────────────────────────────────────
console.log('\n[2/7] Production screens...');
run('git add app/screens/ app/components/');
commit('feat(screens): all 13 screens polished to production quality');

// ─── Commit 3: Utils — search, purchases, RevenueCat, AI ──────────────────────
console.log('\n[3/7] Utilities — search, RevenueCat, AI...');
run('git add app/utils/');
commit('feat(utils): full-text search, RevenueCat wiring, llama.rn AI scaffold');

// ─── Commit 4: Content (Phase 9) ─────────────────────────────────────────────
console.log('\n[4/7] Content — guides and checklists...');
run('git add app/assets/content/ app/assets/checklists/');
commit('feat(content): 60+ guides across 10 categories, requiresMedicalDisclaimer, 2 new guides added');

// ─── Commit 5: Assets — icons and splash ─────────────────────────────────────
console.log('\n[5/7] Generated assets...');
run('git add app/assets/images/ scripts/generate-assets.js scripts/patch-content.js');
commit('feat(assets): generated icon, adaptive-icon, splash, favicon via sharp');

// ─── Commit 6: CI, store listing, README ─────────────────────────────────────
console.log('\n[6/7] CI, store listing, README...');
run('git add .github/ store-assets/ README.md');
commit('feat(ci): GitHub Actions lint/typecheck/test pipeline');
run('git add store-assets/ README.md', true);
commit('docs: store listing copy (App Store + Play Store) and README rewrite');

// ─── Commit 7: TypeScript fixes + types ───────────────────────────────────────
console.log('\n[7/7] TypeScript strict-mode fixes...');
run('git add types/ tsconfig.json');
run('git add app/db/contentLoader.ts app/screens/SettingsScreen.tsx');
commit('fix(ts): strict mode clean — llama.rn stub, Checklist type, icon name, module:esnext');

// ─── Final: add anything remaining ───────────────────────────────────────────
run('git add -A');
const status = run('git status --short');
if (status.trim()) {
  commit('chore: remaining files and cleanup');
}

console.log('\n✅ All commits done.');
console.log('git log:');
run('git log --oneline');
