<#
.SYNOPSIS
  Run the real Android release build on your PC (Android emulator) - one command.

.USAGE
  .\scripts\test-on-pc.ps1                      # boot the GridDown_Test emulator, install the latest release APK, launch the app
  .\scripts\test-on-pc.ps1 -Apk E:\path\to.apk  # install a specific APK
  .\scripts\test-on-pc.ps1 -Avd Pixel_7         # use a different emulator image (list: emulator -list-avds)
  .\scripts\test-on-pc.ps1 -Test                # install the UNLOCKED test APK (GridDown-<ver>-TEST-unlocked.apk)
  .\scripts\test-on-pc.ps1 -Stop                # shut the emulator down

.WHAT YOU GET
  The exact signed APK that will go to Google Play, running on a 4 GB Pixel-class virtual phone -
  Advisor models download and run, SQLite, location (use the emulator's ... > Location panel), all of it.
  For a quick look in a browser instead:  npm run web   (opens http://localhost:8081 - native-only features
  such as the Advisor, in-app purchases and the translator are stubbed out there).

.NOTES
  Default APK: the newest E:\Projects\GridDown\_exports\GridDown-*-release-*.apk, falling back to the
  worktree's android\app\build\outputs\apk\release\app-release.apk.
#>
param(
  [string]$Avd = 'GridDown_Test',
  [string]$Apk,
  [string]$Sdk = $(if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { 'E:\Android\Sdk' }),
  [switch]$Stop,
  [switch]$Test
)
$ErrorActionPreference = 'Stop'
# The emulator images live on E:\ (E:\Android\avd), not in %USERPROFILE%\.android\avd.
if (-not $env:ANDROID_AVD_HOME -and (Test-Path 'E:\Android\avd')) { $env:ANDROID_AVD_HOME = 'E:\Android\avd' }
$adb = Join-Path $Sdk 'platform-tools\adb.exe'
$emu = Join-Path $Sdk 'emulator\emulator.exe'
$pkg = 'com.bannedproduct.griddown'
if (-not (Test-Path $adb)) { throw "adb not found at $adb - pass -Sdk <path to Android SDK>" }

if ($Stop) {
  & $adb emu kill 2>$null
  Write-Host 'Emulator stopped.'
  exit 0
}

# 1. APK to install
if (-not $Apk) {
  $pattern = if ($Test) { 'GridDown-*-TEST-unlocked.apk' } else { 'GridDown-*-release-*.apk' }
  $cand = Get-ChildItem (Join-Path 'E:\Projects\GridDown\_exports' $pattern) -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($Test -and -not $cand) { throw 'No test APK yet. Build one: .\scripts\build-android.ps1 -Target release -Apk -UnlockAll' }
  if (-not $cand) { $cand = Get-Item (Join-Path (Split-Path -Parent $PSScriptRoot) 'android\app\build\outputs\apk\release\app-release.apk') -ErrorAction SilentlyContinue }
  if (-not $cand) { throw 'No release APK found. Build one first: .\scripts\build-android.ps1' }
  $Apk = $cand.FullName
}
Write-Host ">> APK: $Apk ($([math]::Round((Get-Item $Apk).Length/1MB)) MB, built $((Get-Item $Apk).LastWriteTime))"

# 2. Emulator
$running = (& $adb devices) -match '^emulator-\d+\s+device'
if (-not $running) {
  if (-not (Test-Path $emu)) { throw "emulator not found at $emu" }
  $avds = & $emu -list-avds
  if ($avds -notcontains $Avd) { throw "AVD '$Avd' not found. Available: $($avds -join ', ')  (create one in Android Studio > Device Manager: Pixel 7, 4 GB RAM, Google APIs image)" }
  Write-Host ">> Booting emulator '$Avd' (first boot takes a minute or two)"
  Start-Process $emu -ArgumentList @('-avd', $Avd, '-no-snapshot-load', '-no-boot-anim') -WindowStyle Normal | Out-Null
  & $adb wait-for-device
  $deadline = (Get-Date).AddMinutes(4)
  do {
    Start-Sleep -Seconds 3
    $booted = (& $adb shell getprop sys.boot_completed 2>$null).Trim()
  } while ($booted -ne '1' -and (Get-Date) -lt $deadline)
  if ($booted -ne '1') { throw 'Emulator did not finish booting in 4 minutes' }
  Start-Sleep -Seconds 5
} else {
  Write-Host '>> Emulator already running'
}

# 3. Install + launch
Write-Host '>> Installing (keeps app data; add -r semantics are default)'
& $adb install -r $Apk | Select-Object -Last 1
& $adb shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 2>&1 | Out-Null
Write-Host ">> GridDown is running on the emulator. Stop it later with: .\scripts\test-on-pc.ps1 -Stop"
