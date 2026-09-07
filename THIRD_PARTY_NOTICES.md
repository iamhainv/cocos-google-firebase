# Third-Party Notices

Cocos Firebase bundles or depends on the following third-party software. Their
licenses are referenced below; consult the linked upstream repository for the full
license text of each component.

Firebase iOS SDK components are **not committed to this repository** — they are
fetched on demand by `scripts/fetch-firebase-ios-sdk.sh` (see the root README's "iOS
setup" section and `.gitignore`). Firebase Android SDK / Gradle plugin components are
resolved by Gradle from Maven Central / Google's Maven repository at build time and
are likewise not vendored here.

| Component | Version pinned by this extension | License | Source |
| --- | --- | --- | --- |
| Firebase iOS SDK (`FirebaseAnalytics`, `FirebaseAuth`, `FirebaseCrashlytics`, `FirebaseMessaging`, `FirebaseRemoteConfig`, `FirebaseCore`, and transitive Firebase pods) | 12.14.0 | Apache License 2.0 | [firebase/firebase-ios-sdk](https://github.com/firebase/firebase-ios-sdk) |
| GoogleUtilities (transitive, bundled inside the Firebase iOS SDK release) | ships with 12.14.0 | Apache License 2.0 | [GoogleUtilities](https://github.com/google/GoogleUtilities) |
| GoogleDataTransport (transitive) | ships with 12.14.0 | Apache License 2.0 | [firebase/firebase-ios-sdk](https://github.com/firebase/firebase-ios-sdk) |
| GTMSessionFetcher (transitive) | ships with 12.14.0 | Apache License 2.0 | [google/gtm-session-fetcher](https://github.com/google/gtm-session-fetcher) |
| Promises / FBLPromises (transitive) | ships with 12.14.0 | Apache License 2.0 | [google/promises](https://github.com/google/promises) |
| nanopb (transitive) | ships with 12.14.0 | zlib License | [nanopb/nanopb](https://github.com/nanopb/nanopb) |
| RecaptchaInterop (transitive) | ships with 12.14.0 | Apache License 2.0 | [firebase/firebase-ios-sdk](https://github.com/firebase/firebase-ios-sdk) |
| Firebase Android SDK / Firebase Android BoM (`firebase-analytics`, `firebase-crashlytics`, `firebase-config`, `firebase-messaging`, `firebase-auth`) | BoM `33.7.0`, resolved via Gradle | Apache License 2.0 | [firebase/firebase-android-sdk](https://github.com/firebase/firebase-android-sdk) |
| `com.google.gms:google-services` Gradle plugin | `4.4.2` | Apache License 2.0 | [google-services on GitHub](https://github.com/google/play-services-plugins) |
| `com.google.firebase:firebase-crashlytics-gradle` plugin | `3.0.2` | Apache License 2.0 | [firebase/firebase-android-sdk](https://github.com/firebase/firebase-android-sdk) |
| `com.google.code.gson:gson` | `2.9.0` | Apache License 2.0 | [google/gson](https://github.com/google/gson) |

All of the above are used unmodified as prebuilt binaries (iOS xcframeworks) or
resolved as-is via Gradle/Maven (Android). This project does not redistribute their
source code; it only declares the dependency and, for iOS, provides a script that
downloads the official release artifact and verifies its checksum.
