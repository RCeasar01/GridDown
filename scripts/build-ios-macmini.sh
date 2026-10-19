#!/usr/bin/env bash
# GridDown — local iOS build on the Mac mini (192.168.7.253). No EAS, no cloud cost.
#
# ONE-TIME SETUP ON THE MAC MINI
#   1. System Settings → General → Sharing → Remote Login: ON   (lets the PC run this over SSH)
#   2. Xcode installed + `sudo xcodebuild -license accept` + `xcode-select --install`
#   3. Node 22/24:  brew install node        CocoaPods:  brew install cocoapods
#   4. Sign in to Xcode → Settings → Accounts with the Apple Developer account ($99/yr)
#   5. Clone the repo:  git clone https://github.com/RCeasar01/GridDown.git ~/Projects/GridDown
#
# USAGE (on the Mac, or from the PC via:  ssh robertceasar@192.168.7.253 'bash ~/Projects/GridDown/scripts/build-ios-macmini.sh sim')
#   bash scripts/build-ios-macmini.sh sim       # Simulator build, no signing needed — verify the app + Advisor runs
#   bash scripts/build-ios-macmini.sh device    # Debug build to a plugged-in iPhone (needs free Apple ID signing)
#   bash scripts/build-ios-macmini.sh archive   # Release .xcarchive + App Store .ipa (needs paid Developer account)
set -euo pipefail
MODE="${1:-sim}"
cd "$(dirname "$0")/.."

export LANG=en_US.UTF-8
echo ">> git pull"; git pull --ff-only || true
echo ">> npm ci"; npm ci --no-audit --no-fund

echo ">> npx expo prebuild --platform ios --clean"
npx expo prebuild --platform ios --clean --no-install
echo ">> pod install"; (cd ios && pod install --repo-update)

SCHEME="GridDown"
WORKSPACE="ios/GridDown.xcworkspace"

case "$MODE" in
  sim)
    xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Debug \
      -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build \
      CODE_SIGNING_ALLOWED=NO build | tail -n 30
    echo "Simulator app: ios/build/Build/Products/Debug-iphonesimulator/GridDown.app"
    echo "Run:  xcrun simctl boot 'iPhone 16' ; xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/GridDown.app ; xcrun simctl launch booted com.bannedproduct.griddown"
    ;;
  device)
    npx expo run:ios --device --configuration Debug
    ;;
  archive)
    mkdir -p ios/build
    xcodebuild -workspace "$WORKSPACE" -scheme "$SCHEME" -configuration Release \
      -destination 'generic/platform=iOS' -archivePath ios/build/GridDown.xcarchive \
      -allowProvisioningUpdates archive | tail -n 30
    cat > ios/build/ExportOptions.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>uploadSymbols</key><true/>
  <key>signingStyle</key><string>automatic</string>
</dict></plist>
EOF
    xcodebuild -exportArchive -archivePath ios/build/GridDown.xcarchive \
      -exportOptionsPlist ios/build/ExportOptions.plist -exportPath ios/build/export \
      -allowProvisioningUpdates | tail -n 20
    echo "IPA: ios/build/export/GridDown.ipa"
    echo "Upload with Transporter.app, or:  xcrun altool --upload-app -f ios/build/export/GridDown.ipa -t ios --apiKey <KEY_ID> --apiIssuer <ISSUER_ID>"
    ;;
  *) echo "usage: $0 sim|device|archive"; exit 1;;
esac
