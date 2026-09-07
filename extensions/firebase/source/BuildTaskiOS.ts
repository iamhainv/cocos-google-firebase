import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as plist from 'plist';
import { IBuildResult } from '../@types';
import { ITaskOptions, PACKAGE_NAME } from './hooks';
import { FB } from './Constants';
import { FirebaseOption } from './FirebaseOptions';
import { insertDestToSrcBehindKey, deleteDestToSrcBehindKey } from './Util';

const TAG = '[firebase:ios]';

/**
 * xcframework bundle names this extension links against on iOS. This is the union of what
 * FirebaseAnalytics + FirebaseAuth + FirebaseCrashlytics + FirebaseMessaging +
 * FirebaseRemoteConfig pull in from the official Firebase.zip release asset. Kept in sync
 * with `scripts/fetch-firebase-ios-sdk.sh`, which is the only supported way to populate
 * `template/ios/firebase/Firebase/` (not committed to git — see README "iOS setup").
 */
const REQUIRED_XCFRAMEWORKS = [
    'FBLPromises', 'FirebaseABTesting', 'FirebaseAnalytics', 'FirebaseAppCheckInterop',
    'FirebaseAuth', 'FirebaseAuthInterop', 'FirebaseCore', 'FirebaseCoreExtension',
    'FirebaseCoreInternal', 'FirebaseCrashlytics', 'FirebaseInstallations', 'FirebaseMessaging',
    'FirebaseRemoteConfig', 'FirebaseRemoteConfigInterop', 'FirebaseSessions', 'FirebaseSharedSwift',
    'GoogleAppMeasurement', 'GoogleDataTransport', 'GoogleUtilities', 'GTMSessionFetcher',
    'nanopb', 'Promises', 'RecaptchaInterop',
];

export class BuildTaskiOS {
    /**
     * Fail the build early — with a clear, actionable message — if the vendored Firebase
     * iOS SDK xcframeworks haven't been fetched yet, instead of silently copying a partial
     * `firebase/` payload and letting Xcode fail later with an opaque "no such module" error.
     */
    private assertFrameworksPresent(opt: FirebaseOption) {
        if (!opt.enableFirebase) return;
        const dir = FB.IOSFirebaseFrameworksDir;
        const missing = !fs.existsSync(dir)
            ? REQUIRED_XCFRAMEWORKS
            : REQUIRED_XCFRAMEWORKS.filter((name) => !fs.existsSync(`${dir}/${name}.xcframework`));
        if (missing.length === 0) return;
        throw new Error(
            `${TAG} Firebase iOS SDK frameworks are missing (${missing.length}/${REQUIRED_XCFRAMEWORKS.length} not found ` +
            `under "${dir}"). This extension does not commit the ~60 MB Firebase iOS SDK to git. ` +
            `Run "scripts/fetch-firebase-ios-sdk.sh" from the repo root to download and verify the official ` +
            `Firebase iOS SDK release, then retry the build. Missing frameworks: ${missing.join(', ')}.`
        );
    }

    /** Merge Firebase Info.plist additions (FCM background modes, ATT) into the engine plist. */
    private mergePlist(opt: FirebaseOption) {
        if (!opt.enableFirebase || !fs.existsSync(FB.IOSPlistSnippet)) return;
        const add = plist.parse(fs.readFileSync(FB.IOSPlistSnippet, 'utf8')) as Record<string, unknown>;
        const nativePlistPath = `${FB.IOSNativePath}/Info.plist`;
        if (!fs.existsSync(nativePlistPath)) { console.warn(TAG, 'native Info.plist missing'); return; }
        const base = plist.parse(fs.readFileSync(nativePlistPath, 'utf8')) as Record<string, unknown>;
        const merged = Object.assign({}, add, base);   // base wins on conflicts
        fs.writeFileSync(nativePlistPath, plist.build(merged), 'utf8');
        console.log(TAG, 'Info.plist merged');
    }

    /** Copy the Pre/Post-firebase.cmake (→ native/engine/ios, auto-loaded) + the firebase/
     *  dir (ObjC wrappers + bundled xcframeworks → build/<dest>/proj/firebase). */
    private copyResources(opt: FirebaseOption, result: IBuildResult) {
        if (!opt.enableFirebase) return;
        const ow = opt.overwriteLibrary !== false;
        if (fs.existsSync(FB.PreCmakeSrc)) fse.copySync(FB.PreCmakeSrc, FB.PreCmakeDest, { overwrite: ow });
        if (fs.existsSync(FB.PostCmakeSrc)) fse.copySync(FB.PostCmakeSrc, FB.PostCmakeDest, { overwrite: ow });
        if (fs.existsSync(FB.IOSFirebaseTemplate)) {
            fse.copySync(FB.IOSFirebaseTemplate, `${result.dest}/proj/firebase`, { recursive: true, overwrite: ow });
        }
        console.log(TAG, 'cmake + firebase/ resources copied');
    }

    /** Copy the user's GoogleService-Info.plist into the build proj (read by [FIRApp configure]). */
    private copyConfig(opt: FirebaseOption, result: IBuildResult) {
        if (!opt.enableFirebase) return;
        const src = opt.googleServiceInfoPlistPath;
        if (!src || !fs.existsSync(src)) {
            console.warn(TAG, `GoogleService-Info.plist not found at "${src}" — set it in the Build panel.`);
            return;
        }
        fse.copySync(src, `${result.dest}/proj/firebase/GoogleService-Info.plist`, { overwrite: true });
        console.log(TAG, 'GoogleService-Info.plist copied');
    }

    /** Insert (or remove) the `[FIRApp configure]` call + FirebaseCore import in AppDelegate.mm. */
    private handleAppDelegate(opt: FirebaseOption) {
        if (!fs.existsSync(FB.IOSAppDelegate)) { console.warn(TAG, 'AppDelegate.mm missing'); return; }
        if (opt.enableFirebase) {
            insertDestToSrcBehindKey(FB.IOSAppDelegate, FB.IOSADImport, FB.IOSADImportKey);
            insertDestToSrcBehindKey(FB.IOSAppDelegate, FB.IOSADInit, FB.IOSADInitKey);
        } else {
            deleteDestToSrcBehindKey(FB.IOSAppDelegate, FB.IOSADImport);
            deleteDestToSrcBehindKey(FB.IOSAppDelegate, FB.IOSADInit);
        }
    }

    executePostBuildTasks(options: ITaskOptions, result: IBuildResult) {
        const opt = options.packages[PACKAGE_NAME] as FirebaseOption;
        this.assertFrameworksPresent(opt);
        this.mergePlist(opt);
        this.copyResources(opt, result);
        this.copyConfig(opt, result);
        this.handleAppDelegate(opt);
        console.log(TAG, 'post-build tasks done');
    }
}

export const buildTaskiOS = { ios: new BuildTaskiOS() };
