<#
.SYNOPSIS
  Build the browser preview of GridDown and publish it to GitHub Pages by hand.

.WHY
  CI does this automatically on every push to main (.github/workflows/deploy-web.yml). Use this
  script when you want to publish a local, uncommitted build, or if the workflow is ever broken.

.USAGE
  npm run deploy:web                 # build + push to gh-pages
  .\scripts\deploy-web.ps1 -SkipBuild  # push whatever is already in dist-web\

  Live at: https://rceasar01.github.io/GridDown/   (Pages takes ~1 minute to pick it up)

.NOTES
  Publishes from a throwaway git worktree so your working branch is never touched. The gh-pages
  branch history is replaced each time (it is a build artifact, not source).
#>
param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $SkipBuild) {
  Write-Host '>> Building web preview (npm run build:web)'
  npm run build:web
  if ($LASTEXITCODE -ne 0) { throw 'web export failed' }
}
if (-not (Test-Path "$root\dist-web\index.html")) { throw 'dist-web\index.html not found — run npm run build:web first' }

$wt = Join-Path $env:TEMP ('griddown-gh-pages-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$sha = (git rev-parse --short HEAD).Trim()
Write-Host ">> Publishing dist-web to gh-pages (worktree $wt)"
git fetch origin gh-pages 2>$null
git worktree add --detach $wt 2>&1 | Out-Null
try {
  Push-Location $wt
  git checkout -q --orphan gh-pages-new
  git rm -rfq . 2>$null
  Copy-Item "$root\dist-web\*" . -Recurse -Force
  git add -A
  git -c user.name='griddown-deploy' -c user.email='deploy@bannedproduct.com' commit -q -m "deploy: web preview from $sha (local)"
  git push -f origin HEAD:gh-pages
  Pop-Location
} finally {
  Set-Location $root
  git worktree remove --force $wt 2>$null
}
Write-Host '>> Done. https://rceasar01.github.io/GridDown/  (hard-refresh: Ctrl+F5)'
