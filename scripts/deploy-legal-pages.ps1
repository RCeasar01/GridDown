<#
.SYNOPSIS
  Publish docs/ (landing + privacy + terms) to Cloudflare Pages so the GitHub repo can go private.

.WHY
  The repo is public only because GitHub Pages serves the privacy policy and terms from docs/.
  Cloudflare Pages (free: unlimited bandwidth, 500 builds/mo) hosts the same static folder on a
  gdsurvival.com subdomain. After this, flip the repo to private and update two URLs.

.STEPS (one-time, ~10 min, free)
  1. .\scripts\deploy-legal-pages.ps1 -Login              # opens Cloudflare in the browser, once
  2. .\scripts\deploy-legal-pages.ps1                     # deploys docs/ to the "griddown-legal" Pages project
  3. In the Cloudflare dashboard: Pages → griddown-legal → Custom domains → add  legal.gdsurvival.com
     (Cloudflare adds the DNS record for you because the domain is already on Cloudflare.)
  4. Set in .env.local / CI:
        EXPO_PUBLIC_PRIVACY_URL=https://legal.gdsurvival.com/privacy
        EXPO_PUBLIC_TERMS_URL=https://legal.gdsurvival.com/terms
     and update the same two URLs in store-assets/DATA_SAFETY.md, APP_STORE_CONNECT.md, PLAY_CONSOLE.md.
  5. GitHub → RCeasar01/GridDown → Settings → General → Danger Zone → Change visibility → Private.
     (Disable GitHub Pages in Settings → Pages first.)

.NOTES
  Uses npx wrangler (no global install). Credentials live in %USERPROFILE%\.wrangler, never in the repo.
#>
param([switch]$Login, [string]$Project = 'griddown-legal')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if ($Login) { npx --yes wrangler@4 login; exit $LASTEXITCODE }
Write-Host ">> Deploying $root\docs to Cloudflare Pages project '$Project'"
npx --yes wrangler@4 pages deploy docs --project-name $Project --branch main --commit-dirty=true
if ($LASTEXITCODE -ne 0) {
  Write-Host "If the project does not exist yet:  npx wrangler@4 pages project create $Project --production-branch main" -ForegroundColor Yellow
  exit $LASTEXITCODE
}
Write-Host ">> Done. Verify: https://$Project.pages.dev/privacy  and  /terms"
