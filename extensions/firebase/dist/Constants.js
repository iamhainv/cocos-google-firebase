"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FB = void 0;
/**
 * Build-time paths for the Firebase extension. Mirrors GoogleAdMob's AndroidConstants,
 * extended with the iOS paths. `Editor.Project.path` is the project root; `__dirname` is
 * this extension's dist dir, so `../template` is the bundled native templates.
 */
class FB {
}
exports.FB = FB;
// ── shared ──────────────────────────────────────────────────────────────
FB.TemplateAndroid = `${__dirname}/../template/android`;
FB.TemplateIOS = `${__dirname}/../template/ios`;
// ── Android ─────────────────────────────────────────────────────────────
FB.AndroidNativePath = `${Editor.Project.path}/native/engine/android`;
/** App-module build.gradle (persistent native project — survives rebuilds). */
FB.AppBuildGradle = `${FB.AndroidNativePath}/app/build.gradle`;
/** Project-level build.gradle (google-services classpath lives here). */
FB.ProjectBuildGradle = `${FB.AndroidNativePath}/build.gradle`;
/** Marker-block snippets appended/removed by Util. */
FB.AppGradleSnippet = `${FB.TemplateAndroid}/app-build.gradle.snippet`;
FB.ProjectGradleSnippet = `${FB.TemplateAndroid}/project-build.gradle.snippet`;
/** Where the user's google-services.json must land for the google-services plugin. */
FB.GoogleServicesDest = `${FB.AndroidNativePath}/app/google-services.json`;
/** AppActivity for FirebaseHub.start(this) insertion (keycode-marker pattern). */
FB.AppActivityPath = `${FB.AndroidNativePath}/app/src/com/cocos/game/AppActivity.java`;
FB.AppActivityInit = `${FB.TemplateAndroid}/java/Init.java`;
FB.AppActivityKeyCode = `${FB.TemplateAndroid}/java/Init_keyCode.java`;
/** libfirebase module: template src + the dest suffix under build/<dest>/proj. */
FB.LibFirebaseSrc = `${FB.TemplateAndroid}/libfirebase`;
FB.LibFirebaseDestSuffix = `/proj/libfirebase`;
/** settings.gradle (in build/<dest>/proj) + the include snippet. */
FB.SettingsGradleSuffix = `/proj/settings.gradle`;
FB.SettingsSnippet = `${FB.TemplateAndroid}/settings.gradle.snippet`;
// ── iOS ─────────────────────────────────────────────────────────────────
FB.IOSNativePath = `${Editor.Project.path}/native/engine/ios`;
/** Bundled Firebase iOS SDK + ObjC wrappers + cmake (copied into build proj). */
FB.IOSFirebaseTemplate = `${FB.TemplateIOS}/firebase`;
/** Vendored Firebase iOS SDK xcframeworks. NOT committed to git (see decision D1 in
 *  OPENSOURCE-PLAN.md) — fetched on demand by `scripts/fetch-firebase-ios-sdk.sh`. */
FB.IOSFirebaseFrameworksDir = `${FB.IOSFirebaseTemplate}/Firebase`;
/** Pre/Post cmake hooks copied into native/engine/ios (auto-loaded by Cocos). */
FB.PreCmakeSrc = `${FB.TemplateIOS}/Pre-firebase.cmake`;
FB.PostCmakeSrc = `${FB.TemplateIOS}/Post-firebase.cmake`;
FB.PreCmakeDest = `${FB.IOSNativePath}/Pre-firebase.cmake`;
FB.PostCmakeDest = `${FB.IOSNativePath}/Post-firebase.cmake`;
/** Info.plist additions (FCM background modes, ATT) merged into the engine plist. */
FB.IOSPlistSnippet = `${FB.TemplateIOS}/firebase-config-info.plist`;
/** AppDelegate.mm [FIRApp configure] + import insertion (keycode-marker pattern). */
FB.IOSAppDelegate = `${FB.IOSNativePath}/AppDelegate.mm`;
FB.IOSADImport = `${FB.TemplateIOS}/AppDelegate-import.txt`;
FB.IOSADImportKey = `${FB.TemplateIOS}/AppDelegate-import-keycode.txt`;
FB.IOSADInit = `${FB.TemplateIOS}/AppDelegate-init.txt`;
FB.IOSADInitKey = `${FB.TemplateIOS}/AppDelegate-init-keycode.txt`;
