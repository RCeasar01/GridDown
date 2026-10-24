// Metro config — native builds use Expo's defaults; the additions here only matter for the
// web preview build (`npm run build:web` → GitHub Pages) and `expo start --web`.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite on web runs wa-sqlite in a worker and imports its .wasm as an asset.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Native-only modules get a web stub (see app/web-stubs/). Everything the stubs replace is
// behind a Platform/feature check in the app, so screens degrade instead of crashing.
const path = require('path');
const WEB_STUBS = {
  'llama.rn': path.resolve(__dirname, 'app/web-stubs/llama.rn.js'),
  'react-native-purchases': path.resolve(__dirname, 'app/web-stubs/react-native-purchases.js'),
  'expo-quick-actions': path.resolve(__dirname, 'app/web-stubs/expo-quick-actions.js'),
  'fast-mlkit-translate-text': path.resolve(__dirname, 'app/web-stubs/fast-mlkit-translate-text.js'),
};
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_STUBS[moduleName] };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
