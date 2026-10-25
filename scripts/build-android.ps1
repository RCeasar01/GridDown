<#
.SYNOPSIS
  Local Android build for GridDown - no EAS, no cloud, no cost.

.USAGE
  .\scripts\build-android.ps1 -Target debug          # dev APK (android/app/build/outputs/apk/debug/)
  .\scripts\build-android.ps1 -Target release        # Play Store AAB (signed with credentials/keystore.properties)
  .\scripts\build-android.ps1 -Target release -Apk   # signed release APK for sideload testing
  .\scripts\build-android.ps1 -Target debug -Prebuild  # regenerate android/ from app.config.ts first
  .\scripts\build-android.ps1 -Install               # after a build: adb install the APK on the connected device
  .\scripts\build-android.ps1 -Target release -Apk -UnlockAll
                                                     # TEST APK with every paywall open (EXPO_PUBLIC_UNLOCK_ALL=1);
                                                     # copied to E:\Projects\GridDown\_exports\GridDown-<ver>-TEST-unlocked.apk
                                                     # A Play bundle (AAB) can never be built with it on.

.REQUIREMENTS (all free, already installed on this machine)
  JDK 21            E:\Tools\jdk-21
  Android SDK       E:\Android\Sdk  (platforms 34/36, build-tools 36, NDK 27.1.12297006, cmake 3.22.1)
  Node 24           C:\Program Files\nodejs
#>
param(
  [ValidateSet('debug','release')] [string]$Target = 'debug',
  [switch]$Apk,
  [switch]$Prebuild,
  [switch]$Install,
  [switch]$Clean,
  [switch]$UnlockAll
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:JAVA_HOME        = 'E:\Tools\jdk-21'
$env:ANDROID_HOME     = 'E:\Android\Sdk'
$env:ANDROID_SDK_ROOT = 'E:\Android\Sdk'
$env:Path             = "E:\Tools\jdk-21\bin;E:\Android\Sdk\platform-tools;E:\Android\Sdk\cmdline-tools\latest\bin;$env:Path"
# Gradle dependency/wrapper cache on E:\ (default is C:\Users\<you>\.gradle)
$env:GRADLE_USER_HOME = 'E:\Android\.gradle'

if ($Install) {
  $apk = Get-ChildItem "$root\android\app\build\outputs\apk" -Recurse -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $apk) { throw 'No APK found. Build first.' }
  Write-Host "Installing $($apk.FullName)"
  adb install -r $apk.FullName
  exit $LASTEXITCODE
}

if ($Prebuild -or -not (Test-Path "$root\android\gradlew.bat")) {
  Write-Host '>> npx expo prebuild --platform android --clean'
  npx expo prebuild --platform android --clean --no-install
  if ($LASTEXITCODE -ne 0) { throw 'prebuild failed' }
  Set-Content "$root\android\local.properties" 'sdk.dir=E:\\Android\\Sdk'
  # Gradle needs more heap for the C++ (llama.rn) build; drop the 32-bit x86 emulator ABI nobody ships.
  $gp = "$root\android\gradle.properties"
  $g = [IO.File]::ReadAllText($gp)
  $g = $g.Replace('org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m', 'org.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g')
  $g = $g.Replace('reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64', 'reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64')
  [IO.File]::WriteAllText($gp, $g)
}

# -- Paywall test switch (app/config/access.ts) -----------------------------------
# Expo inlines EXPO_PUBLIC_* at bundle time, from the process env or .env / .env.local.
$isBundle = ($Target -eq 'release' -and -not $Apk)
$envFiles = @('.env', '.env.local', '.env.production') | ForEach-Object { Join-Path $root $_ } | Where-Object { Test-Path $_ }
$fileUnlock = $envFiles | Where-Object { (Get-Content $_ -Raw) -match '(?m)^\s*EXPO_PUBLIC_UNLOCK_ALL\s*=\s*(1|true|yes)\s*$' }
if ($isBundle -and ($UnlockAll -or $fileUnlock)) {
  throw "Refusing to build a Play bundle with EXPO_PUBLIC_UNLOCK_ALL on (it unlocks every paid feature). Remove it from $($fileUnlock -join ', ') / drop -UnlockAll."
}
if ($UnlockAll) {
  $env:EXPO_PUBLIC_UNLOCK_ALL = '1'
  Write-Host '>> TEST BUILD: EXPO_PUBLIC_UNLOCK_ALL=1 - every paywall open, banner shown on Home + Settings' -ForegroundColor Yellow
} elseif (-not $fileUnlock) {
  Remove-Item Env:\EXPO_PUBLIC_UNLOCK_ALL -ErrorAction SilentlyContinue
}
# Inlined env values can survive in Metro's transform cache between builds; clear it so a test
# flag never leaks into the next release build (or vice versa).
Get-ChildItem $env:TEMP -Directory -Filter 'metro-*' -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem $env:TEMP -Directory -Filter 'haste-map-*' -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

if ($Target -eq 'release' -and -not (Test-Path "$root\credentials\keystore.properties")) {
  Write-Warning 'credentials/keystore.properties not found - release build will be DEBUG-signed and NOT uploadable to Play.'
}

$task = if ($Target -eq 'debug') { 'assembleDebug' } elseif ($Apk) { 'assembleRelease' } else { 'bundleRelease' }
$log  = "$root\android\build-$Target.log"
Write-Host ">> gradlew $task  (log: $log)"
Push-Location "$root\android"
try {
  $args = @($task, '--console=plain')
  # Gradle's up-to-date check ignores environment variables, so a JS bundle built with
  # EXPO_PUBLIC_UNLOCK_ALL=1 would be reused by the next store build (and vice versa).
  # Always re-run the bundle task on release builds.
  if ($Target -eq 'release') { $args = @($task, ':app:createBundleReleaseJsAndAssets', '--rerun', '--console=plain') }
  if ($Clean) { $args = @('clean') + $args }
  & .\gradlew.bat @args 2>&1 | Tee-Object -FilePath $log
  if ($LASTEXITCODE -ne 0) { throw "gradle $task failed - see $log" }
} finally { Pop-Location }

Write-Host ''
Write-Host '== OUTPUT =='
if ($task -eq 'bundleRelease') {
  Get-ChildItem "$root\android\app\build\outputs\bundle\release\*.aab" | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
} else {
  Get-ChildItem "$root\android\app\build\outputs\apk" -Recurse -Filter '*.apk' | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
}

if ($UnlockAll -and $task -ne 'bundleRelease') {
  $ver = (Select-String -Path "$root\app.config.ts" -Pattern "version:\s*'([^']+)'" | Select-Object -First 1).Matches[0].Groups[1].Value
  $built = Get-ChildItem "$root\android\app\build\outputs\apk" -Recurse -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $exp = 'E:\Projects\GridDown\_exports'
  if ($built -and (Test-Path $exp)) {
    $dest = Join-Path $exp "GridDown-$ver-TEST-unlocked.apk"
    Copy-Item $built.FullName $dest -Force
    Write-Host ">> Test APK: $dest  (install: .\scripts\test-on-pc.ps1 -Apk `"$dest`")" -ForegroundColor Yellow
  }
}
