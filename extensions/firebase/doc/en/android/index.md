# Cocos Firebase — Android Requirements (English)

## Permissions / Capabilities

- `android.permission.POST_NOTIFICATIONS` is declared in `libfirebase`'s
  `AndroidManifest.xml` (required for FCM/notification permission prompts on
  Android 13+), and is merged into your app's manifest automatically.
- No other Android permissions are declared by this extension.

## Supplying `google-services.json`

1. In the [Firebase console](https://console.firebase.google.com/), add an Android
   app to your project (use your app's real `applicationId`/package name).
2. Download the generated `google-services.json`.
3. In Cocos Creator's **Build** panel (Android platform), set
   **google-services.json** to the absolute path of that file.
4. Build. `BuildTaskAndroid.ts` copies it to
   `native/engine/android/app/google-services.json`, where the
   `com.google.gms.google-services` Gradle plugin reads it during the build.

**Never commit `google-services.json`** — it is project-specific and is on this
template's forbidden-filename list (`scripts/check-secrets.sh`) as a backstop; treat that as a
guard rail, not your only line of defense.

## Build Configuration

Minimum requirements (see the root README's compatibility table):

- **minSdkVersion 23+** — required by the Firebase Android BoM `33.7.0` pinned in
  `template/android/libfirebase/build.gradle` and `app-build.gradle.snippet`.
- `compileSdkVersion` / `targetSdkVersion` are inherited from your project's own
  Gradle properties (`PROP_COMPILE_SDK_VERSION` / `PROP_TARGET_SDK_VERSION`); this
  extension does not pin either.

### Where the Gradle snippets land

| Snippet | Inserted into | Purpose |
| --- | --- | --- |
| `app-build.gradle.snippet` | `native/engine/android/app/build.gradle` | Applies the `com.google.gms.google-services` and `com.google.firebase.crashlytics` plugins; adds the Firebase BoM + `firebase-analytics`/`firebase-crashlytics`/`firebase-config`/`firebase-messaging`/`firebase-auth` + the `libfirebase` module dependency. |
| `project-build.gradle.snippet` | `native/engine/android/build.gradle` | Declares the plugin classpaths (`com.google.gms:google-services:4.4.2`, `com.google.firebase:firebase-crashlytics-gradle:3.0.2`) so the app-module `apply plugin` calls above can resolve. |
| `settings.gradle.snippet` | `build/android/proj/settings.gradle` (per-build output) | Registers the `libfirebase` module (`include ':libfirebase'`) in the generated project. |

All three are inserted/removed idempotently by marker comments
(`>>> Firebase extension >>> ... <<< Firebase extension <<<`) based on the
**Enable Firebase** toggle — you never need to hand-edit them.

### The `libfirebase` native module

`template/android/libfirebase/` is a small Android library module
(`com.cocos.firebase`) holding `FirebaseHub.java`, the native bridge that receives
`JsbBridgeWrapper` events from the JS clients and forwards them to the real Firebase
Android SDK calls. It is copied into `build/android/proj/libfirebase` on every build
(controlled by the **Force overwrite the Firebase library** option) and registered via
`settings.gradle.snippet`.

## Known Limitations

- **Cloud Messaging (FCM) is not implemented.** `FirebaseHub.java` does not register
  any `messaging.*` listener, so `Messaging.requestPermission()` /
  `Messaging.getToken()` / topic subscribe/unsubscribe all resolve to
  `false`/`null`/no-op after timing out. The manifest even has a commented-out FCM
  service declaration (`libfirebase/src/main/AndroidManifest.xml`) as a starting
  point if you want to implement this yourself.
- **Auth is not implemented.** Same situation — the JS API exists, the native
  listener does not.
- Analytics, Crashlytics, and Remote Config are implemented and exercised by the demo
  scene at the repo root.
