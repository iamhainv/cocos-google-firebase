"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTaskiOS = exports.BuildTaskiOS = void 0;
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const plist = __importStar(require("plist"));
const hooks_1 = require("./hooks");
const Constants_1 = require("./Constants");
const Util_1 = require("./Util");
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
class BuildTaskiOS {
    /**
     * Fail the build early — with a clear, actionable message — if the vendored Firebase
     * iOS SDK xcframeworks haven't been fetched yet, instead of silently copying a partial
     * `firebase/` payload and letting Xcode fail later with an opaque "no such module" error.
     */
    assertFrameworksPresent(opt) {
        if (!opt.enableFirebase)
            return;
        const dir = Constants_1.FB.IOSFirebaseFrameworksDir;
        const missing = !fs.existsSync(dir)
            ? REQUIRED_XCFRAMEWORKS
            : REQUIRED_XCFRAMEWORKS.filter((name) => !fs.existsSync(`${dir}/${name}.xcframework`));
        if (missing.length === 0)
            return;
        throw new Error(`${TAG} Firebase iOS SDK frameworks are missing (${missing.length}/${REQUIRED_XCFRAMEWORKS.length} not found ` +
            `under "${dir}"). This extension does not commit the ~60 MB Firebase iOS SDK to git. ` +
            `Run "scripts/fetch-firebase-ios-sdk.sh" from the repo root to download and verify the official ` +
            `Firebase iOS SDK release, then retry the build. Missing frameworks: ${missing.join(', ')}.`);
    }
    /** Merge Firebase Info.plist additions (FCM background modes, ATT) into the engine plist. */
    mergePlist(opt) {
        if (!opt.enableFirebase || !fs.existsSync(Constants_1.FB.IOSPlistSnippet))
            return;
        const add = plist.parse(fs.readFileSync(Constants_1.FB.IOSPlistSnippet, 'utf8'));
        const nativePlistPath = `${Constants_1.FB.IOSNativePath}/Info.plist`;
        if (!fs.existsSync(nativePlistPath)) {
            console.warn(TAG, 'native Info.plist missing');
            return;
        }
        const base = plist.parse(fs.readFileSync(nativePlistPath, 'utf8'));
        const merged = Object.assign({}, add, base); // base wins on conflicts
        fs.writeFileSync(nativePlistPath, plist.build(merged), 'utf8');
        console.log(TAG, 'Info.plist merged');
    }
    /** Copy the Pre/Post-firebase.cmake (→ native/engine/ios, auto-loaded) + the firebase/
     *  dir (ObjC wrappers + bundled xcframeworks → build/<dest>/proj/firebase). */
    copyResources(opt, result) {
        if (!opt.enableFirebase)
            return;
        const ow = opt.overwriteLibrary !== false;
        if (fs.existsSync(Constants_1.FB.PreCmakeSrc))
            fse.copySync(Constants_1.FB.PreCmakeSrc, Constants_1.FB.PreCmakeDest, { overwrite: ow });
        if (fs.existsSync(Constants_1.FB.PostCmakeSrc))
            fse.copySync(Constants_1.FB.PostCmakeSrc, Constants_1.FB.PostCmakeDest, { overwrite: ow });
        if (fs.existsSync(Constants_1.FB.IOSFirebaseTemplate)) {
            fse.copySync(Constants_1.FB.IOSFirebaseTemplate, `${result.dest}/proj/firebase`, { recursive: true, overwrite: ow });
        }
        console.log(TAG, 'cmake + firebase/ resources copied');
    }
    /** Copy the user's GoogleService-Info.plist into the build proj (read by [FIRApp configure]). */
    copyConfig(opt, result) {
        if (!opt.enableFirebase)
            return;
        const src = opt.googleServiceInfoPlistPath;
        if (!src || !fs.existsSync(src)) {
            console.warn(TAG, `GoogleService-Info.plist not found at "${src}" — set it in the Build panel.`);
            return;
        }
        fse.copySync(src, `${result.dest}/proj/firebase/GoogleService-Info.plist`, { overwrite: true });
        console.log(TAG, 'GoogleService-Info.plist copied');
    }
    /** Insert (or remove) the `[FIRApp configure]` call + FirebaseCore import in AppDelegate.mm. */
    handleAppDelegate(opt) {
        if (!fs.existsSync(Constants_1.FB.IOSAppDelegate)) {
            console.warn(TAG, 'AppDelegate.mm missing');
            return;
        }
        if (opt.enableFirebase) {
            (0, Util_1.insertDestToSrcBehindKey)(Constants_1.FB.IOSAppDelegate, Constants_1.FB.IOSADImport, Constants_1.FB.IOSADImportKey);
            (0, Util_1.insertDestToSrcBehindKey)(Constants_1.FB.IOSAppDelegate, Constants_1.FB.IOSADInit, Constants_1.FB.IOSADInitKey);
        }
        else {
            (0, Util_1.deleteDestToSrcBehindKey)(Constants_1.FB.IOSAppDelegate, Constants_1.FB.IOSADImport);
            (0, Util_1.deleteDestToSrcBehindKey)(Constants_1.FB.IOSAppDelegate, Constants_1.FB.IOSADInit);
        }
    }
    executePostBuildTasks(options, result) {
        const opt = options.packages[hooks_1.PACKAGE_NAME];
        this.assertFrameworksPresent(opt);
        this.mergePlist(opt);
        this.copyResources(opt, result);
        this.copyConfig(opt, result);
        this.handleAppDelegate(opt);
        console.log(TAG, 'post-build tasks done');
    }
}
exports.BuildTaskiOS = BuildTaskiOS;
exports.buildTaskiOS = { ios: new BuildTaskiOS() };
