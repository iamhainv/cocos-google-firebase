# Cocos Firebase (English)

Firebase (Analytics, Crashlytics, Remote Config, Cloud Messaging, Auth) for Cocos
Creator 3.8.x native builds. Bridges over `JsbBridgeWrapper` (event-named,
multi-listener) so it coexists with other extensions (e.g. AdMob) without owning
`native.bridge`.

See the module coverage table in the [root README](../../../README.md) before you
build — Cloud Messaging is not wired up on Android, and Auth is not wired up on either
platform.

## Compatibility

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | minSdk 23+ (Firebase Android BoM 33.7.0 requirement) | iOS 15.0+ (Firebase iOS SDK 12.x requirement) | Preview only — the native bridge is a no-op; calls log a "no native" line or time out |

## Installation

1. Copy `extensions/firebase` into your project's `extensions/` folder.
2. Restart Cocos Creator, or use **Extension → Extension Manager** to enable it.
3. **iOS only**: run `scripts/fetch-firebase-ios-sdk.sh` from the repo root once, to
   download and verify the Firebase iOS SDK xcframeworks (not committed to this repo —
   see [ios/index.md](./ios/index.md)).
4. In the **Build** panel, select Android or iOS, find the Firebase section, and:
   - Check **Enable Firebase**.
   - Set **google-services.json** (Android) or **GoogleService-Info.plist** (iOS) to
     the absolute path of the config file you downloaded from the
     [Firebase console](https://console.firebase.google.com/). See
     [android/index.md](./android/index.md) / [ios/index.md](./ios/index.md) for
     details. **Never commit either file.**
   - Toggle Analytics / Crashlytics / Remote Config / Messaging / Auth as needed.
5. Build. The hook copies your config file, patches the native project, and (Android)
   registers `libfirebase` / (iOS) copies the `firebase/` payload into the generated
   project.

## Build Panel Options

Every option below is defined in `source/builder.ts` and its label/tip text is
resolved from `i18n/en.js` / `i18n/zh.js`. Both Android and iOS expose the same set,
except for the config-file path, which is platform-specific.

| Option | Default | What it does |
| --- | --- | --- |
| **Enable Firebase** (`enableFirebase`) | on | Master switch. When off, the build hook removes all previously-injected Firebase config (gradle snippets, AppActivity/AppDelegate insertions) on the next build. |
| **google-services.json** (Android) / **GoogleService-Info.plist** (iOS) | empty, required | Absolute path on disk to your Firebase project's platform config file. See [android/index.md](./android/index.md) / [ios/index.md](./ios/index.md). |
| **Analytics** (`enableAnalytics`) | on | Links Firebase Analytics and initializes it on app start. |
| **Crashlytics** (`enableCrashlytics`) | on | Links Firebase Crashlytics and enables crash reporting. |
| **Remote Config** (`enableRemoteConfig`) | on | Links Firebase Remote Config. |
| **Cloud Messaging** (`enableMessaging`) | off | Links FCM + the push entitlement. iOS is fully implemented; Android is not (see coverage table) — defaults to off so you opt in knowingly. |
| **Auth** (`enableAuth`) | off | Links Firebase Auth. Neither platform's native bridge implements the listeners yet — defaults to off; treat as experimental. |
| **Force overwrite the Firebase library** (`overwriteLibrary`) | on | Overwrite the native library/template files (Android `libfirebase`, iOS `firebase/` CMake + SDK payload) with the extension's bundled copies on every build, instead of leaving a previously-copied version untouched. |

## API Reference

Import each client module directly from the extension's asset-db mount
(`db://firebase/...`) — there is no single aggregator/index module, so import only
what you use:

```ts
import { Analytics } from 'db://firebase/client/Analytics';
import { Crashlytics } from 'db://firebase/client/Crashlytics';
import { RemoteConfig } from 'db://firebase/client/RemoteConfig';
import { Messaging } from 'db://firebase/client/Messaging';
import { Auth } from 'db://firebase/client/Auth';
```

### `Analytics` — fire-and-forget

- `Analytics.logEvent(name: string, params?: Record<string, string | number>): void`
- `Analytics.setUserProperty(key: string, value: string): void`
- `Analytics.setUserId(id: string | null): void`
- `Analytics.setEnabled(enabled: boolean): void` — master opt-out (GDPR/consent).

### `Crashlytics` — fire-and-forget

- `Crashlytics.log(message: string): void` — breadcrumb attached to the next crash report.
- `Crashlytics.setKey(key: string, value: string | number | boolean): void`
- `Crashlytics.recordError(message: string, domain?: string): void` — non-fatal error.
- `Crashlytics.setUserId(id: string): void`
- `Crashlytics.setEnabled(enabled: boolean): void`
- `Crashlytics.testCrash(): void` — **debug only**, force-kills the app to verify
  crash reporting end to end.

### `RemoteConfig` — fetch/activate + synchronous reads

- `RemoteConfig.setDefaults(defaults: Record<string, string | number | boolean>): void`
  — seeds local defaults, used until the first fetch lands.
- `RemoteConfig.fetchActivate(minIntervalSec?: number): Promise<boolean>` — fetches +
  activates; resolves `true` on success and populates the local cache.
- `RemoteConfig.getString(key: string, dflt?: string): string`
- `RemoteConfig.getNumber(key: string, dflt?: number): number`
- `RemoteConfig.getBool(key: string, dflt?: boolean): boolean`

`getString`/`getNumber`/`getBool` read from an in-memory cache populated by
`fetchActivate`, so they're synchronous and safe to call anywhere after the first
successful fetch.

### `Messaging` — iOS fully implemented, **Android not implemented**

- `Messaging.requestPermission(): Promise<boolean>` — OS notification permission
  (iOS / Android 13+).
- `Messaging.getToken(): Promise<string | null>` — current FCM registration token.
- `Messaging.onMessage(cb): void` — foreground message: `{ data, title, body }`.
- `Messaging.onTokenRefresh(cb): void` — `{ token }`.
- `Messaging.subscribeTopic(topic: string): void` / `Messaging.unsubscribeTopic(topic: string): void`

On Android, all of the above resolve to `null`/`false` or simply never fire — the
native listener isn't registered yet.

### `Auth` — **not implemented on either platform**

- `Auth.signInAnonymous(): Promise<string | null>`
- `Auth.currentUid(): string | null` — cached, synchronous.
- `Auth.signOut(): void`
- `Auth.onStateChanged(cb: (uid: string | null) => void): void`

All request/response calls will time out (resolve `null`) after ~15s because neither
native bridge registers an `auth.*` listener yet.

## Examples

```ts
import { Analytics } from 'db://firebase/client/Analytics';
import { Crashlytics } from 'db://firebase/client/Crashlytics';
import { RemoteConfig } from 'db://firebase/client/RemoteConfig';

// Analytics
Analytics.logEvent('level_complete', { level: 3, score: 1200 });
Analytics.setUserProperty('plan', 'free');

// Crashlytics — attach context before something goes wrong
Crashlytics.setUserId('demo-user-123');
Crashlytics.log('Entered level 3');
try {
    riskyOperation();
} catch (e) {
    Crashlytics.recordError(String(e));
}

// Remote Config
RemoteConfig.setDefaults({ show_new_ui: false });
const ok = await RemoteConfig.fetchActivate(3600); // at most once/hour
if (ok && RemoteConfig.getBool('show_new_ui')) {
    // ...
}
```

See `assets/script/test/FirebaseTest.ts` at the repo root for a complete, runnable
example (also covers Crashlytics `testCrash()` and `Messaging.getToken()`).

## Troubleshooting

- **Gradle sync fails after enabling Firebase** — make sure you set
  **google-services.json** to a real file path in the Build panel before building;
  an empty/missing path is logged as a warning (not a hard build failure) and Gradle
  will then fail with a `google-services.json is missing` error from the
  `google-services` plugin itself.
- **"Duplicate class" errors during Gradle build** — usually a Firebase BoM/version
  mismatch with another extension that also pulls Firebase or Google Play Services.
  Check `native/engine/android/app/build.gradle` for two different Firebase BoM
  versions after merging multiple extensions' snippets.
- **iOS: "No such module 'FirebaseCore'" or similar** — you haven't run
  `scripts/fetch-firebase-ios-sdk.sh` yet, or the extension's `overwriteLibrary`
  option was off and stale files are present. Run the fetch script and rebuild;
  `BuildTaskiOS.ts` should fail the build early with an explicit message in this case
  rather than letting Xcode fail obscurely.
- **iOS CMake errors mentioning `Pre-firebase.cmake` / `Post-firebase.cmake`** — these
  are copied into `native/engine/ios/`; if you've manually edited that directory,
  compare it against `extensions/firebase/template/ios/` and re-run the build with
  **Force overwrite the Firebase library** enabled.
- **FCM token never resolves on Android** — expected; Android FCM is not implemented
  in this extension yet (see the module coverage table).
- **Auth calls always time out** — expected; Auth is not implemented on either
  platform yet.

## Known Limitations

- Cloud Messaging (FCM) is not implemented on Android.
- Auth is not implemented on either Android or iOS.
- The Firebase iOS SDK is not committed to this repo; you must run
  `scripts/fetch-firebase-ios-sdk.sh` once per checkout before building for iOS.
- `google-services.json` and `GoogleService-Info.plist` are per-project secrets you
  must supply yourself; they are never bundled with this extension.
