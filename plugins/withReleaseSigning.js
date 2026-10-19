/**
 * withReleaseSigning — Expo config plugin.
 *
 * Injects a `release` signingConfig into android/app/build.gradle that reads
 * ../../credentials/keystore.properties (gitignored). When that file is absent
 * (CI, a fresh clone, Expo Go) the release build silently falls back to the
 * debug keystore so `prebuild` never breaks.
 *
 * Why a plugin: android/ is generated (Continuous Native Generation) and is
 * wiped by `npx expo prebuild --clean`, so edits made directly to build.gradle
 * would be lost. This plugin re-applies them on every prebuild.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = '// GRIDDOWN_RELEASE_SIGNING';

const PROPS_BLOCK = `${MARKER}
def gdKeystorePropsFile = rootProject.file("../credentials/keystore.properties")
def gdKeystoreProps = new Properties()
if (gdKeystorePropsFile.exists()) {
    gdKeystoreProps.load(new FileInputStream(gdKeystorePropsFile))
}
`;

const SIGNING_CONFIG = `        release {
            if (gdKeystoreProps.getProperty("storeFile")) {
                storeFile file(gdKeystoreProps.getProperty("storeFile"))
                storePassword gdKeystoreProps.getProperty("storePassword")
                keyAlias gdKeystoreProps.getProperty("keyAlias")
                keyPassword gdKeystoreProps.getProperty("keyPassword")
            } else {
                // No upload keystore present: fall back to debug signing so local builds still work.
                storeFile file("debug.keystore")
                storePassword "android"
                keyAlias "androiddebugkey"
                keyPassword "android"
            }
        }
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (c) => {
    let gradle = c.modResults.contents;
    if (gradle.includes(MARKER)) return c;

    // 1) Load keystore.properties near the top of the file (after the `apply plugin` lines).
    gradle = gradle.replace(/(apply plugin: "com\.facebook\.react"\s*\n)/, `$1\n${PROPS_BLOCK}\n`);

    // 2) Add the release signingConfig next to the generated debug one.
    gradle = gradle.replace(
      /(signingConfigs\s*\{\s*\n\s*debug\s*\{[\s\S]*?\n\s*\}\n)/,
      `$1${SIGNING_CONFIG}`,
    );

    // 3) Make the release buildType use it (template points release at debug by default).
    gradle = gradle.replace(
      /(release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/,
      '$1signingConfigs.release',
    );

    c.modResults.contents = gradle;
    return c;
  });
};
