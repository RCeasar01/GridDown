#!/usr/bin/env node
/**
 * generate-brand-assets.js — renders every launcher/splash/notification asset
 * from one SVG mark so they always match.
 *
 *   node scripts/generate-brand-assets.js
 *
 * Outputs (app/assets/images/):
 *   icon.png              1024×1024 opaque      iOS + Android legacy launcher
 *   adaptive-icon.png     1024×1024 transparent Android adaptive foreground (mark inside the 66% safe zone)
 *   splash.png            1024×1024 transparent expo-splash-screen image (contain, imageWidth 200)
 *   favicon.png            192×192  opaque      web
 *   notification-icon.png   96×96  white-on-alpha Android status-bar icon (must be a silhouette)
 *
 * The mark: a dim 3×3 grid with one cell still lit, carrying a compass point.
 * Original geometry, no third-party imagery. Palette = app/theme/colors.ts.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'app', 'assets', 'images');
const BG = '#0D0D0D';
const GRID = '#3D4C2E';   // primaryDim
const LIT = '#8B9E67';    // primary
const INK = '#0D0D0D';

/**
 * @param {object} o
 * @param {number} o.size canvas px
 * @param {number} o.scale mark size as a fraction of the canvas (1 = full bleed grid)
 * @param {boolean} o.background paint the dark background (false → transparent)
 * @param {boolean} o.mono white silhouette for the notification icon
 */
function markSvg({ size, scale, background, mono }) {
  const s = size;
  const g = s * scale;            // grid extent
  const o = (s - g) / 2;          // offset
  const cell = g / 3;
  const stroke = Math.max(2, g * 0.07);
  const r = cell * 0.2;           // lit-cell corner radius
  const inset = cell * 0.03;      // lit cell nearly fills its grid cell
  const litX = o + cell + inset, litY = o + cell + inset, litS = cell - inset * 2;
  const cx = s / 2, cy = s / 2;
  const n = litS * 0.4;           // compass half-height
  const w = litS * 0.165;         // compass half-width
  const gridColor = mono ? '#FFFFFF' : GRID;
  const litColor = mono ? '#FFFFFF' : LIT;
  const inkColor = mono ? 'rgba(0,0,0,0)' : INK;

  // Grid lines broken at the lit cell (they stop short of it) — "the grid is down".
  const gap = cell * 0.5 + stroke * 1.1;
  const lines = [];
  for (const i of [1, 2]) {
    const p = o + i * cell;
    // vertical line i, split above/below the center row
    lines.push(`<line x1="${p}" y1="${o}" x2="${p}" y2="${cy - gap}" />`);
    lines.push(`<line x1="${p}" y1="${cy + gap}" x2="${p}" y2="${o + g}" />`);
    // horizontal line i, split left/right of the center column
    lines.push(`<line x1="${o}" y1="${p}" x2="${cx - gap}" y2="${p}" />`);
    lines.push(`<line x1="${cx + gap}" y1="${p}" x2="${o + g}" y2="${p}" />`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${background ? `<defs><radialGradient id="glow" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#1B2214"/><stop offset="1" stop-color="${BG}"/></radialGradient></defs>
  <rect width="${s}" height="${s}" fill="url(#glow)"/>` : ''}
  <g stroke="${gridColor}" stroke-width="${stroke}" stroke-linecap="round" fill="none" opacity="${mono ? 0.75 : 1}">
    ${lines.join('\n    ')}
  </g>
  <rect x="${litX}" y="${litY}" width="${litS}" height="${litS}" rx="${r}" fill="${litColor}"/>
  <!-- compass point: north blade solid, south blade hollow -->
  <polygon points="${cx},${cy - n} ${cx + w},${cy} ${cx},${cy + n} ${cx - w},${cy}" fill="${inkColor}" opacity="0.92"/>
  <polygon points="${cx},${cy - n} ${cx + w},${cy} ${cx},${cy}" fill="${mono ? 'rgba(0,0,0,0)' : litColor}" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${w * 0.35}" fill="${mono ? 'rgba(0,0,0,0)' : litColor}"/>
</svg>`;
}

async function render(name, svg, { flatten } = {}) {
  const size = Number(/width="(\d+)"/.exec(svg)[1]);
  // Render at 4× for clean anti-aliasing, then downsample to the exact target size.
  let img = sharp(Buffer.from(svg), { density: 288 }).resize(size, size, { kernel: 'lanczos3' });
  if (flatten) img = img.flatten({ background: BG });
  await img.png().toFile(path.join(OUT, name));
  const meta = await sharp(path.join(OUT, name)).metadata();
  console.log(`${name.padEnd(22)} ${meta.width}×${meta.height} alpha=${meta.hasAlpha}`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // iOS requires opaque, no rounded corners (the OS masks it). Mark fills ~72% of the tile.
  await render('icon.png', markSvg({ size: 1024, scale: 0.72, background: true, mono: false }), { flatten: true });
  // Android adaptive foreground: the mark's farthest points are the grid-line ends at
  // distance 0.527·g from centre; the 66 % safe circle has radius 338 px on a 1024 canvas,
  // so g ≤ 641 px → scale 0.62 is the largest that survives every launcher mask.
  await render('adaptive-icon.png', markSvg({ size: 1024, scale: 0.62, background: false, mono: false }));
  // Splash image: transparent mark, shown at imageWidth 200 on the dark background.
  await render('splash.png', markSvg({ size: 1024, scale: 0.9, background: false, mono: false }));
  await render('favicon.png', markSvg({ size: 192, scale: 0.78, background: true, mono: false }), { flatten: true });
  // Android notification icon: pure white silhouette on alpha.
  await render('notification-icon.png', markSvg({ size: 96, scale: 0.9, background: false, mono: true }));
  fs.writeFileSync(path.join(OUT, 'brand-mark.svg'), markSvg({ size: 1024, scale: 0.72, background: true, mono: false }));
  console.log('brand-mark.svg         source');
})().catch((e) => { console.error(e); process.exit(1); });
