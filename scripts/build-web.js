#!/usr/bin/env node
/**
 * build-web.js — export the app as a static web preview into dist-web/.
 *
 *   npm run build:web                 # for GitHub Pages (served under /GridDown/)
 *   npm run build:web -- --base /     # for a root-hosted preview
 *
 * Also copies the legal pages (docs/privacy.html, docs/terms.html) next to the app so
 * https://rceasar01.github.io/GridDown/privacy keeps working, writes .nojekyll so Pages
 * serves the _expo/ folder, and a 404.html so a refresh on any path still loads the app.
 *
 * Native-only modules (llama.rn, RevenueCat, ML Kit translate, quick actions) are stubbed
 * for web in metro.config.js — the Advisor, paywall purchases and translator report
 * "not available in this build" instead of crashing.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist-web');
const baseIdx = process.argv.indexOf('--base');
const base = baseIdx !== -1 ? process.argv[baseIdx + 1] : '/GridDown';

// The browser preview is a test surface (no store purchases on web), so every paywall is open.
const env = { ...process.env, CI: '1', EXPO_PUBLIC_UNLOCK_ALL: process.env.EXPO_PUBLIC_UNLOCK_ALL ?? '1' };
if (base && base !== '/') env.EXPO_WEB_BASE_URL = base.replace(/\/$/, '');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const r = spawnSync(npx, ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-web', '--clear'], {
  cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32',
});
if (r.status !== 0) process.exit(r.status ?? 1);

fs.writeFileSync(path.join(out, '.nojekyll'), '');
for (const f of ['privacy.html', 'terms.html']) {
  const src = path.join(root, 'docs', f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, f));
}
fs.copyFileSync(path.join(out, 'index.html'), path.join(out, '404.html'));
const total = (function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? walk(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0); })(out);
console.log(`\nWeb preview exported to dist-web/ (${(total / 1024 / 1024).toFixed(1)} MB, base "${base}")`);
