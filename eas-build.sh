#!/usr/bin/env bash
# GridDown EAS Build & Submit Script
# Usage: ./eas-build.sh [profile] [platform]
# Examples:
#   ./eas-build.sh development ios
#   ./eas-build.sh preview both
#   ./eas-build.sh production ios
#   ./eas-build.sh production android
#   ./eas-build.sh production both

set -euo pipefail

PROFILE="${1:-production}"
PLATFORM="${2:-both}"

echo ""
echo "🟧 GridDown EAS Build"
echo "=============================="
echo "Profile:  $PROFILE"
echo "Platform: $PLATFORM"
echo ""

# Validate profile
if [[ "$PROFILE" != "development" && "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
  echo "❌ Unknown profile: $PROFILE"
  echo "   Valid profiles: development, preview, production"
  exit 1
fi

# Validate platform
if [[ "$PLATFORM" != "ios" && "$PLATFORM" != "android" && "$PLATFORM" != "both" ]]; then
  echo "❌ Unknown platform: $PLATFORM"
  echo "   Valid platforms: ios, android, both"
  exit 1
fi

# Check required tools
for cmd in node npx; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ $cmd is not installed or not in PATH"
    exit 1
fi
done

# Check .env.local exists
if [[ ! -f ".env.local" ]]; then
  echo "⚠️  .env.local not found. Copying from .env.example..."
  cp .env.example .env.local
  echo "   ❗ Fill in your RevenueCat keys in .env.local before running production builds."
fi

# Check eas-cli
if ! command -v eas &>/dev/null; then
  echo "📦 Installing @expo/eas-cli globally..."
  npm install -g @expo/eas-cli
fi

# TypeScript check before building production
if [[ "$PROFILE" == "production" ]]; then
  echo "🔍 Running TypeScript check..."
  npx tsc --noEmit
  echo "✅ TypeScript OK"
fi

echo ""
echo "🚀 Starting EAS build..."
echo ""

if [[ "$PLATFORM" == "both" ]]; then
  eas build --profile "$PROFILE" --platform ios --non-interactive
  eas build --profile "$PROFILE" --platform android --non-interactive
elif [[ "$PLATFORM" == "ios" ]]; then
  eas build --profile "$PROFILE" --platform ios --non-interactive
elif [[ "$PLATFORM" == "android" ]]; then
  eas build --profile "$PROFILE" --platform android --non-interactive
fi

echo ""
echo "✅ Build submitted to EAS."
echo ""

# Auto-submit to stores on production
if [[ "$PROFILE" == "production" ]]; then
  echo "❓ Auto-submit to App Store and Google Play? (y/N)"
  read -r SUBMIT
  if [[ "$SUBMIT" == "y" || "$SUBMIT" == "Y" ]]; then
    echo ""
    echo "🚀 Submitting to stores..."
    if [[ "$PLATFORM" == "both" || "$PLATFORM" == "ios" ]]; then
      eas submit --profile production --platform ios --latest
    fi
    if [[ "$PLATFORM" == "both" || "$PLATFORM" == "android" ]]; then
      eas submit --profile production --platform android --latest
    fi
    echo "✅ Submitted to stores."
  else
    echo "   Skipped store submission. Run 'eas submit' manually when ready."
  fi
fi

echo ""
echo "🎉 Done!"
