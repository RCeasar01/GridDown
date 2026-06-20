#!/usr/bin/env node
/**
 * GridDown Asset Generator
 * Generates icon.png, adaptive-icon.png, and splash.png using sharp.
 * Run: node scripts/generate-assets.js
 * Install: npm install sharp --save-dev
 */

const path = require('path');
const fs = require('fs');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('sharp not installed. Run: npm install sharp --save-dev');
    process.exit(1);
  }

  const outDir = path.join(__dirname, '..', 'app', 'assets', 'images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // ── SVG definitions ──────────────────────────────────────────────────────
  const BG = '#0D0D0D';
  const ORANGE = '#8B9E67';
  const GRAY = '#888888';

  // Lightning bolt shield SVG for icon
  const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" fill="${BG}"/>
  
  <!-- Shield outline -->
  <path d="M512 80 L820 180 L820 480 C820 680 680 820 512 944 C344 820 204 680 204 480 L204 180 Z"
        fill="none" stroke="${ORANGE}" stroke-width="18" stroke-linejoin="round"/>
  
  <!-- Shield fill (slightly lighter) -->
  <path d="M512 80 L820 180 L820 480 C820 680 680 820 512 944 C344 820 204 680 204 480 L204 180 Z"
        fill="#1A0A05" opacity="0.7"/>
  
  <!-- Lightning bolt -->
  <path d="M570 200 L420 540 L500 540 L440 840 L620 420 L540 420 Z"
        fill="${ORANGE}" stroke="none"/>
</svg>`;

  // Splash SVG — 1284x2778 (iPhone 15 Pro Max native)
  const splashSvg = `<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="${BG}"/>
  
  <!-- Small shield icon centered -->
  <g transform="translate(642, 1150) scale(0.45) translate(-512, -512)">
    <path d="M512 80 L820 180 L820 480 C820 680 680 820 512 944 C344 820 204 680 204 480 L204 180 Z"
          fill="none" stroke="${ORANGE}" stroke-width="18" stroke-linejoin="round"/>
    <path d="M512 80 L820 180 L820 480 C820 680 680 820 512 944 C344 820 204 680 204 480 L204 180 Z"
          fill="#1A0A05" opacity="0.7"/>
    <path d="M570 200 L420 540 L500 540 L440 840 L620 420 L540 420 Z"
          fill="${ORANGE}"/>
  </g>
  
  <!-- GRIDDOWN text -->
  <text x="642" y="1560" 
        font-family="Arial Black, Arial, sans-serif" 
        font-size="108" 
        font-weight="900" 
        letter-spacing="28"
        fill="${ORANGE}" 
        text-anchor="middle">GRIDDOWN</text>
  
  <!-- Tagline -->
  <text x="642" y="1660" 
        font-family="Arial, sans-serif" 
        font-size="44" 
        font-weight="400"
        letter-spacing="4"
        fill="${GRAY}" 
        text-anchor="middle">When help is not coming.</text>
</svg>`;

  console.log('Generating app assets...\n');

  // ── icon.png (1024x1024) ─────────────────────────────────────────────────
  process.stdout.write('  icon.png (1024x1024)... ');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'icon.png'));
  console.log('✓');

  // ── adaptive-icon.png (1024x1024) ────────────────────────────────────────
  process.stdout.write('  adaptive-icon.png (1024x1024)... ');
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'adaptive-icon.png'));
  console.log('✓');

  // ── splash.png (1284x2778) ───────────────────────────────────────────────
  process.stdout.write('  splash.png (1284x2778)... ');
  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'splash.png'));
  console.log('✓');

  // ── favicon.png (64x64) ──────────────────────────────────────────────────
  process.stdout.write('  favicon.png (64x64)... ');
  await sharp(Buffer.from(iconSvg))
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(outDir, 'favicon.png'));
  console.log('✓');

  console.log('\nAll assets generated successfully.');
  console.log(`Output directory: ${outDir}`);
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
