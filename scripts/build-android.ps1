<#
.SYNOPSIS
  Local Android build for GridDown — no EAS, no cloud, no cost.

.USAGE
  .\scripts\build-android.ps1 -Target debug          # dev APK (android/app/build/outputs/apk/debug/)
  .\scripts\build-android.ps1 -Target release        # Play Store AAB (signed with credentials/keystore.properties)
  .\scripts\build-android.ps1 -Target release -Apk   # signed release APK for sideload testing
  .\scripts\build-android.ps1 -Target debug -Prebuild  # regenerate android/ from app.config.ts first
  .\scripts\build-android.ps1 -Install               # after a build: adb install the APK on the connected device

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
  [switch]$Clean
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
}

if ($Target -eq 'release' -and -not (Test-Path "$root\credentials\keystore.properties")) {
  Write-Warning 'credentials/keystore.properties not found — release build will be DEBUG-signed and NOT uploadable to Play.'
}

$task = if ($Target -eq 'debug') { 'assembleDebug' } elseif ($Apk) { 'assembleRelease' } else { 'bundleRelease' }
$log  = "$root\android\build-$Target.log"
Write-Host ">> gradlew $task  (log: $log)"
Push-Location "$root\android"
try {
  $args = @($task, '--console=plain')
  if ($Clean) { $args = @('clean') + $args }
  & .\gradlew.bat @args 2>&1 | Tee-Object -FilePath $log
  if ($LASTEXITCODE -ne 0) { throw "gradle $task failed — see $log" }
} finally { Pop-Location }

Write-Host ''
Write-Host '== OUTPUT =='
if ($task -eq 'bundleRelease') {
  Get-ChildItem "$root\android\app\build\outputs\bundle\release\*.aab" | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
} else {
  Get-ChildItem "$root\android\app\build\outputs\apk" -Recurse -Filter '*.apk' | Select-Object FullName, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
}
