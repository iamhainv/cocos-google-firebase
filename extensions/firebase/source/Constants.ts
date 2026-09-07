/**
 * Build-time paths for the Firebase extension. Mirrors GoogleAdMob's AndroidConstants,
 * extended with the iOS paths. `Editor.Project.path` is the project root; `__dirname` is
 * this extension's dist dir, so `../template` is the bundled native templates.
 */
export class FB {
    // ── shared ──────────────────────────────────────────────────────────────
    static readonly TemplateAndroid = `${__dirname}/../template/android`;
    static readonly TemplateIOS = `${__dirname}/../template/ios`;

    // ── Android ─────────────────────────────────────────────────────────────
    static readonly AndroidNativePath = `${Editor.Project.path}/native/engine/android`;
    /** App-module build.gradle (persistent native project — survives rebuilds). */
    static readonly AppBuildGradle = `${FB.AndroidNativePath}/app/build.gradle`;
    /** Project-level build.gradle (google-services classpath lives here). */
    static readonly ProjectBuildGradle = `${FB.AndroidNativePath}/build.gradle`;
    /** Marker-block snippets appended/removed by Util. */
    static readonly AppGradleSnippet = `${FB.TemplateAndroid}/app-build.gradle.snippet`;
    static readonly ProjectGradleSnippet = `${FB.TemplateAndroid}/project-build.gradle.snippet`;
    /** Where the user's google-services.json must land for the google-services plugin. */
    static readonly GoogleServicesDest = `${FB.AndroidNativePath}/app/google-services.json`;
    /** AppActivity for FirebaseHub.start(this) insertion (keycode-marker pattern). */
    static readonly AppActivityPath = `${FB.AndroidNativePath}/app/src/com/cocos/game/AppActivity.java`;
    static readonly AppActivityInit = `${FB.TemplateAndroid}/java/Init.java`;
    static readonly AppActivityKeyCode = `${FB.TemplateAndroid}/java/Init_keyCode.java`;
    /** libfirebase module: template src + the dest suffix under build/<dest>/proj. */
    static readonly LibFirebaseSrc = `${FB.TemplateAndroid}/libfirebase`;
    static readonly LibFirebaseDestSuffix = `/proj/libfirebase`;
    /** settings.gradle (in build/<dest>/proj) + the include snippet. */
    static readonly SettingsGradleSuffix = `/proj/settings.gradle`;
    static readonly SettingsSnippet = `${FB.TemplateAndroid}/settings.gradle.snippet`;

    // ── iOS ─────────────────────────────────────────────────────────────────
    static readonly IOSNativePath = `${Editor.Project.path}/native/engine/ios`;
    /** Bundled Firebase iOS SDK + ObjC wrappers + cmake (copied into build proj). */
    static readonly IOSFirebaseTemplate = `${FB.TemplateIOS}/firebase`;
    /** Vendored Firebase iOS SDK xcframeworks. NOT committed to git (see decision D1 in
     *  OPENSOURCE-PLAN.md) — fetched on demand by `scripts/fetch-firebase-ios-sdk.sh`. */
    static readonly IOSFirebaseFrameworksDir = `${FB.IOSFirebaseTemplate}/Firebase`;
    /** Pre/Post cmake hooks copied into native/engine/ios (auto-loaded by Cocos). */
    static readonly PreCmakeSrc = `${FB.TemplateIOS}/Pre-firebase.cmake`;
    static readonly PostCmakeSrc = `${FB.TemplateIOS}/Post-firebase.cmake`;
    static readonly PreCmakeDest = `${FB.IOSNativePath}/Pre-firebase.cmake`;
    static readonly PostCmakeDest = `${FB.IOSNativePath}/Post-firebase.cmake`;
    /** Info.plist additions (FCM background modes, ATT) merged into the engine plist. */
    static readonly IOSPlistSnippet = `${FB.TemplateIOS}/firebase-config-info.plist`;
    /** AppDelegate.mm [FIRApp configure] + import insertion (keycode-marker pattern). */
    static readonly IOSAppDelegate = `${FB.IOSNativePath}/AppDelegate.mm`;
    static readonly IOSADImport = `${FB.TemplateIOS}/AppDelegate-import.txt`;
    static readonly IOSADImportKey = `${FB.TemplateIOS}/AppDelegate-import-keycode.txt`;
    static readonly IOSADInit = `${FB.TemplateIOS}/AppDelegate-init.txt`;
    static readonly IOSADInitKey = `${FB.TemplateIOS}/AppDelegate-init-keycode.txt`;
}
