# Cocos Firebase — iOS Requirements (English)

## Fetching the Firebase iOS SDK (required before your first iOS build)

This extension does not commit the Firebase iOS SDK's prebuilt xcframeworks to the
repository (see decision D1 in `OPENSOURCE-PLAN.md` and the root README). Before
building for iOS, run once from the repo root:

```bash
scripts/fetch-firebase-ios-sdk.sh
```

What it does:

1. Downloads the official `Firebase.zip` release asset from
   [firebase/firebase-ios-sdk releases](https://github.com/firebase/firebase-ios-sdk/releases),
   pinned to version **12.14.0**.
2. Verifies its SHA-256 checksum with `shasum -a 256 -c` against a checksum computed
   from that exact release asset. It refuses to unpack anything on a mismatch.
3. Extracts the 5 product pods this extension needs
   (`FirebaseAnalytics`, `FirebaseAuth`, `FirebaseCrashlytics`, `FirebaseMessaging`,
   `FirebaseRemoteConfig`) and copies the union of the 23 xcframeworks they contain
   into `extensions/firebase/template/ios/firebase/Firebase/`.

If you skip this step, `BuildTaskiOS.ts` fails the build immediately with a message
listing exactly which xcframeworks are missing and telling you to run this script —
instead of letting Xcode fail later with an opaque "no such module" error.

Re-run the script any time to re-verify/re-fetch (it will ask before overwriting an
already-populated directory).

## Supplying `GoogleService-Info.plist`

1. In the [Firebase console](https://console.firebase.google.com/), add an iOS app to
   your project (use your app's real bundle identifier).
2. Download the generated `GoogleService-Info.plist`.
3. In Cocos Creator's **Build** panel (iOS platform), set
   **GoogleService-Info.plist** to the absolute path of that file.
4. Build. `BuildTaskiOS.ts` copies it to `<build output>/proj/firebase/GoogleService-Info.plist`,
   which `[FIRApp configure]` reads at launch.

**Never commit `GoogleService-Info.plist`** — it is project-specific and is on this
template's forbidden-filename list (`scripts/check-secrets.sh`) as a backstop; treat that as a
guard rail, not your only line of defense.

## Build Configuration

- **Deployment target: iOS 15.0+** — required by the Firebase iOS SDK 12.x line
  pinned by this extension.
- `Pre-firebase.cmake` / `Post-firebase.cmake` are copied into
  `native/engine/ios/` (auto-loaded by the Cocos CMake build) and link the
  xcframeworks fetched above.
- `firebase-config-info.plist` is merged into the generated `Info.plist` — it adds the
  FCM background modes entitlement and (if present) App Tracking Transparency keys.
  Existing keys in your project's `Info.plist` always win on conflict.
- `AppDelegate-import.txt` / `AppDelegate-init.txt` insert the `FirebaseCore` import
  and `[FIRApp configure]` call into `AppDelegate.mm`, using a keycode-marker pattern
  so re-builds and disabling Firebase both clean up correctly.

## Known Limitations

- **Auth is not implemented.** `FirebaseHub.mm` does not register any `auth.*`
  listener, so `Auth.signInAnonymous()` / `Auth.onStateChanged()` / etc. all time out.
- Analytics, Crashlytics, Remote Config, and Cloud Messaging are implemented and
  exercised by the demo scene at the repo root.
- The fetched xcframeworks are the official multi-platform release build (they
  include iOS device + simulator slices, plus Mac Catalyst/macOS/tvOS slices that
  ship in the same release archive); Xcode only links the slice it needs per target,
  so this does not affect your final app size, but it does mean the local, gitignored
  `Firebase/` folder on disk after running the fetch script is larger than the
  ~60 MB that a hand-trimmed copy would be.
