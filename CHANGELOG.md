# Changelog

All notable changes to this extension will be documented in this file.

## 1.0.0 — Initial release

- Initial open-source release of the Cocos Firebase extension: Analytics, Crashlytics,
  Remote Config, Cloud Messaging, and Auth clients for Cocos Creator 3.8.x native
  builds (Android + iOS), bridged over `JsbBridgeWrapper`.
- Android and iOS build hooks that inject `google-services.json` /
  `GoogleService-Info.plist`, patch Gradle/CMake/AppActivity/AppDelegate, and copy the
  native `libfirebase` module / iOS `firebase/` payload into the generated project.
- `i18n/en.js` and `i18n/zh.js` for every Build panel option (previously missing).
- `scripts/fetch-firebase-ios-sdk.sh` to fetch and verify the Firebase iOS SDK
  xcframeworks on demand instead of committing ~200 MB of binaries to this repo.
- Runnable demo scene (`assets/scene/main.scene` +
  `assets/script/test/FirebaseTest.ts`) exercising Analytics, Crashlytics
  (test crash), Remote Config, and FCM token retrieval.
- Known limitations, documented rather than hidden: Cloud Messaging is not wired up on
  Android, and Auth is not wired up on either platform — see the README's module
  coverage table.
