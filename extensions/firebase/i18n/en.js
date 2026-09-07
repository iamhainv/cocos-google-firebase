module.exports = {
    title: 'Firebase — Analytics / Crashlytics / Remote Config / Messaging / Auth',
    description: 'Firebase for Cocos Creator native builds (Analytics, Crashlytics, Remote Config, Cloud Messaging, Auth). Bridges over JsbBridgeWrapper so it coexists with other extensions (e.g. AdMob) without owning native.bridge.',

    enableFirebase: {
        title: 'Enable Firebase',
        tip: 'Master switch for this extension. When enabled, the build hook injects the Firebase native config (google-services.json / GoogleService-Info.plist), copies the native library/SDK into the build project, and patches gradle / CMake / AppActivity / AppDelegate. When disabled, all previously-injected Firebase config is removed on the next build.',
    },

    googleServicesJsonPath: {
        title: 'google-services.json',
        tip: 'Absolute path on disk to your Firebase project\'s google-services.json (Android). Download it from the Firebase console (Project settings → Your apps → Android app). Required when Firebase is enabled. Never commit this file to source control.',
    },

    googleServiceInfoPlistPath: {
        title: 'GoogleService-Info.plist',
        tip: 'Absolute path on disk to your Firebase project\'s GoogleService-Info.plist (iOS). Download it from the Firebase console (Project settings → Your apps → iOS app). Required when Firebase is enabled. Never commit this file to source control.',
    },

    enableAnalytics: {
        title: 'Analytics',
        tip: 'Link Firebase Analytics and initialise it on app start. Well covered: logEvent / setUserProperty / setUserId / setEnabled are implemented natively on both Android and iOS.',
    },

    enableCrashlytics: {
        title: 'Crashlytics',
        tip: 'Link Firebase Crashlytics and enable crash reporting. Well covered: log / setKey / recordError / setUserId / setEnabled / testCrash are implemented natively on both Android and iOS.',
    },

    enableRemoteConfig: {
        title: 'Remote Config',
        tip: 'Link Firebase Remote Config. Well covered: setDefaults / fetchActivate are implemented natively on both Android and iOS; fetched values are cached on the JS side for synchronous reads.',
    },

    enableMessaging: {
        title: 'Cloud Messaging',
        tip: 'Link Firebase Cloud Messaging (FCM) and the push notification entitlement. iOS: fully implemented (permission request, token, topic subscribe/unsubscribe, token refresh). Android: the JS API exists but the native listener is NOT yet wired up in this extension — calls will time out. Treat Android FCM support as experimental / not implemented; see the docs before shipping.',
    },

    enableAuth: {
        title: 'Auth',
        tip: 'Link Firebase Auth. Experimental: the JS client (sign in anonymously, sign out, auth-state listener) exists, but neither the Android nor the iOS native bridge implements the corresponding listeners in this extension yet — calls will time out. Do not rely on this in production without adding the native glue code yourself.',
    },

    overwriteLibrary: {
        title: 'Force overwrite the Firebase library',
        tip: 'Force overwrite the native library/template files (libfirebase on Android, the firebase/ CMake + SDK payload on iOS) with the extension\'s bundled copies on every build, instead of leaving a previously-copied version untouched.',
    },
};
