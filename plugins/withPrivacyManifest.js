const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin — writes PrivacyInfo.xcprivacy into the iOS project root.
 * Required by Apple for all apps since May 2024.
 *
 * Declared required-reason APIs:
 *   NSPrivacyAccessedAPICategoryUserDefaults   → CA92.1 (app functionality)
 *   NSPrivacyAccessedAPICategoryFileTimestamp  → C617.1 (app functionality)
 *   NSPrivacyAccessedAPICategoryDiskSpace      → E174.1 (display to user)
 *   NSPrivacyAccessedAPICategorySystemBootTime → 35F9.1 (app functionality)
 */
module.exports = function withPrivacyManifest(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const privacyManifest = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>E174.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>35F9.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>`;
      const iosDir = path.join(config.modRequest.platformProjectRoot);
      fs.writeFileSync(path.join(iosDir, 'PrivacyInfo.xcprivacy'), privacyManifest);
      return config;
    },
  ]);
};
