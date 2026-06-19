#!/usr/bin/env node
/**
 * scripts/audit-accessibility.js
 *
 * Scans all .tsx / .ts files under app/ and reports:
 *   ♿ TouchableOpacity / Pressable without accessibilityLabel
 *   🔤 Text with allowFontScaling={false}
 *   🖼️  Image without accessibilityLabel or accessible={false}
 *
 * Usage:
 *   node scripts/audit-accessibility.js
 *   npm run audit:accessibility
 *
 * Exit code 0 = clean. Exit code 1 = issues found.
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '..', 'app');

function walkDir(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())  out.push(...walkDir(full));
    else if (entry.name.match(/\.(tsx|ts)$/)) out.push(full);
  }
  return out;
}

/**
 * Reads forward from lineIndex until the JSX element tag closes (first '>')
 * and returns the accumulated string.
 */
function readElement(lines, startIdx) {
  let buf = '';
  for (let i = startIdx; i < Math.min(startIdx + 12, lines.length); i++) {
    buf += ' ' + lines[i];
    if (lines[i].includes('>')) break;
  }
  return buf;
}

function auditFile(filePath) {
  const src   = fs.readFileSync(filePath, 'utf-8');
  const lines = src.split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line    = lines[i];
    const lineNum = i + 1;

    // ── TouchableOpacity ────────────────────────────────────────────────────
    if (/<TouchableOpacity[\s>]/.test(line)) {
      const block = readElement(lines, i);
      if (!/accessibilityLabel/.test(block)) {
        issues.push({
          type: 'MISSING_ACCESSIBILITY_LABEL',
          element: 'TouchableOpacity',
          line: lineNum,
          snippet: line.trim().slice(0, 90),
        });
      }
    }

    // ── Pressable ───────────────────────────────────────────────────────────
    if (/<Pressable[\s>]/.test(line)) {
      const block = readElement(lines, i);
      if (!/accessibilityLabel/.test(block)) {
        issues.push({
          type: 'MISSING_ACCESSIBILITY_LABEL',
          element: 'Pressable',
          line: lineNum,
          snippet: line.trim().slice(0, 90),
        });
      }
    }

    // ── Text allowFontScaling={false} ───────────────────────────────────────
    if (/allowFontScaling=\{false\}/.test(line)) {
      issues.push({
        type: 'FONT_SCALING_DISABLED',
        element: 'Text',
        line: lineNum,
        snippet: line.trim().slice(0, 90),
      });
    }

    // ── Image without label ─────────────────────────────────────────────────
    if (/<Image[\s>]/.test(line) || /<FastImage[\s>]/.test(line)) {
      const block = readElement(lines, i);
      if (!/accessibilityLabel/.test(block) && !/accessible=\{false\}/.test(block)) {
        issues.push({
          type: 'IMAGE_MISSING_LABEL',
          element: line.includes('FastImage') ? 'FastImage' : 'Image',
          line: lineNum,
          snippet: line.trim().slice(0, 90),
        });
      }
    }
  }

  return issues;
}

function main() {
  const files = walkDir(APP_DIR);
  let totalIssues = 0;

  console.log(`\n🔍  GridDown Accessibility Audit`);
  console.log(`     Scanning ${files.length} TypeScript file(s) in app/\n`);

  for (const file of files) {
    const issues = auditFile(file);
    if (issues.length === 0) continue;

    totalIssues += issues.length;
    const rel = path.relative(process.cwd(), file);
    console.log(`📄  ${rel}`);
    for (const issue of issues) {
      const icon =
        issue.type === 'MISSING_ACCESSIBILITY_LABEL' ? '♿' :
        issue.type === 'FONT_SCALING_DISABLED'       ? '🔤' : '🖼️ ';
      console.log(`    ${icon}  [${issue.type}] Line ${issue.line} — ${issue.element}`);
      console.log(`       ${issue.snippet}`);
    }
    console.log();
  }

  if (totalIssues === 0) {
    console.log('✅  No accessibility issues found.\n');
    process.exitCode = 0;
  } else {
    console.log(`⚠️   ${totalIssues} issue(s) found. Fix before App Store submission.\n`);
    process.exitCode = 1;
  }
}

main();
