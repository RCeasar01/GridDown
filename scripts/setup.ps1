# GridDown Dev Environment Setup (Windows / PowerShell)
# Run as: powershell -ExecutionPolicy Bypass -File scripts\setup.ps1

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "  ____      _     _ ____
 / ___|_ __(_) __| |  _ \  _____      ___ __
| |  _| '__| |/ _\` | | | |/ _ \ \ /\ / / '_ \
| |_| | |  | | (_| | |_| | (_) \ V  V /| | | |
 \____|_|  |_|\__,_|____/ \___/ \_/\_/ |_| |_|" -ForegroundColor Red

Write-Host ""
Write-Host "  GridDown Dev Setup (Windows)" -ForegroundColor Yellow
Write-Host "  BannedProduct Media Inc. — Veteran-Owned" -ForegroundColor Gray
Write-Host ""

# ---------------------------------------------------------------------------
# 1. Check Node.js
# ---------------------------------------------------------------------------
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Cyan
try {
  $nodeVersion = node --version
  Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Node.js not found. Install from https://nodejs.org (LTS)" -ForegroundColor Red
  Write-Host "     Then re-run this script." -ForegroundColor Gray
  exit 1
}

# ---------------------------------------------------------------------------
# 2. Check Git
# ---------------------------------------------------------------------------
Write-Host "[2/6] Checking Git..." -ForegroundColor Cyan
try {
  $gitVersion = git --version
  Write-Host "  ✓ $gitVersion" -ForegroundColor Green
} catch {
  Write-Host "  ✗ Git not found. Install from https://git-scm.com" -ForegroundColor Red
  exit 1
}

# ---------------------------------------------------------------------------
# 3. Install npm dependencies
# ---------------------------------------------------------------------------
Write-Host "[3/6] Installing npm dependencies..." -ForegroundColor Cyan
if (-not (Test-Path '.\node_modules')) {
  Write-Host "  Installing... (this may take a minute)" -ForegroundColor Gray
  cmd /c "npm install --legacy-peer-deps 2>&1"
  Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
  Write-Host "  ✓ node_modules already exists. Skipping. (Run 'npm install --legacy-peer-deps' to update)" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 4. Set up .env.local
# ---------------------------------------------------------------------------
Write-Host "[4/6] Setting up .env.local..." -ForegroundColor Cyan
if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.example' '.env.local'
  Write-Host "  ✓ Created .env.local from .env.example" -ForegroundColor Green
  Write-Host "  ❗ Open .env.local and fill in your RevenueCat API keys before building." -ForegroundColor Yellow
} else {
  Write-Host "  ✓ .env.local already exists" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 5. Install EAS CLI
# ---------------------------------------------------------------------------
Write-Host "[5/6] Checking EAS CLI..." -ForegroundColor Cyan
try {
  $easVersion = eas --version 2>&1
  Write-Host "  ✓ EAS CLI $easVersion" -ForegroundColor Green
} catch {
  Write-Host "  Installing @expo/eas-cli globally..." -ForegroundColor Gray
  cmd /c "npm install -g @expo/eas-cli 2>&1"
  Write-Host "  ✓ EAS CLI installed" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# 6. TypeScript check
# ---------------------------------------------------------------------------
Write-Host "[6/6] Running TypeScript check..." -ForegroundColor Cyan
try {
  $tsOutput = cmd /c "npx tsc --noEmit 2>&1"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️ TypeScript errors found:" -ForegroundColor Yellow
    Write-Host $tsOutput -ForegroundColor Red
    Write-Host "  Fix these before building. Run 'npx tsc --noEmit' to recheck." -ForegroundColor Gray
  } else {
    Write-Host "  ✓ No TypeScript errors" -ForegroundColor Green
  }
} catch {
  Write-Host "  ⚠️ Could not run tsc. Is TypeScript installed?" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Gray
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Gray
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env.local with your RevenueCat API keys" -ForegroundColor Gray
Write-Host "  2. Run: npx expo start" -ForegroundColor Gray
Write-Host "     (Note: translation features require a dev client build," -ForegroundColor Gray
Write-Host "      not Expo Go. Run 'eas build --profile development' first.)" -ForegroundColor Gray
Write-Host "  3. For a production build: .\eas-build.sh production both" -ForegroundColor Gray
Write-Host "     (or on Windows: eas build --profile production --platform ios)" -ForegroundColor Gray
Write-Host ""
Write-Host "  GitHub: https://github.com/rceasar01/GridDown" -ForegroundColor Gray
Write-Host "  Docs:   https://rceasar01.github.io/GridDown/" -ForegroundColor Gray
Write-Host ""
