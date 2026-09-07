/**
 * Build-panel options for the Firebase extension (mirrors GoogleAdMob's AdmobOption).
 * Values are entered in the Cocos Build panel; the build hooks read them off
 * `options.packages['firebase']`.
 */
export interface FirebaseOption {
    /** Master switch — when false the build hooks remove all injected Firebase config. */
    enableFirebase?: boolean;
    /** Re-copy the bundled native library / SDK over any existing copy on each build. */
    overwriteLibrary?: boolean;

    /** Absolute path to the project's google-services.json (Android Firebase config). */
    googleServicesJsonPath?: string;
    /** Absolute path to the project's GoogleService-Info.plist (iOS Firebase config). */
    googleServiceInfoPlistPath?: string;

    /** Per-feature toggles — only the enabled features are linked / initialised. */
    enableAnalytics?: boolean;
    enableCrashlytics?: boolean;
    enableRemoteConfig?: boolean;
    enableMessaging?: boolean;
    enableAuth?: boolean;
}
