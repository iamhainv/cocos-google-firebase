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
exports.buildTaskAndroid = exports.BuildTaskAndroid = void 0;
const fs = __importStar(require("fs"));
const fse = __importStar(require("fs-extra"));
const hooks_1 = require("./hooks");
const Constants_1 = require("./Constants");
const Util_1 = require("./Util");
const TAG = '[firebase:android]';
class BuildTaskAndroid {
    /** Apply the google-services plugin + Firebase BoM/deps to the app & project gradle. */
    handleGradle(opt) {
        if (opt.enableFirebase) {
            (0, Util_1.appendDestContentToSrcFileIfNo)(Constants_1.FB.AppBuildGradle, Constants_1.FB.AppGradleSnippet);
            (0, Util_1.appendDestContentToSrcFileIfNo)(Constants_1.FB.ProjectBuildGradle, Constants_1.FB.ProjectGradleSnippet);
            console.log(TAG, 'gradle snippets applied');
        }
        else {
            (0, Util_1.deleteDestContentInSrcFile)(Constants_1.FB.AppBuildGradle, Constants_1.FB.AppGradleSnippet);
            (0, Util_1.deleteDestContentInSrcFile)(Constants_1.FB.ProjectBuildGradle, Constants_1.FB.ProjectGradleSnippet);
        }
    }
    /** Copy the user's google-services.json into the app module so the plugin can read it. */
    copyGoogleServices(opt) {
        if (!opt.enableFirebase)
            return;
        const src = opt.googleServicesJsonPath;
        if (!src || !fs.existsSync(src)) {
            console.warn(TAG, `google-services.json not found at "${src}" — set it in the Build panel.`);
            return;
        }
        fse.copySync(src, Constants_1.FB.GoogleServicesDest, { overwrite: true });
        console.log(TAG, `google-services.json → ${Constants_1.FB.GoogleServicesDest}`);
    }
    /** Copy the libfirebase module into the build proj + register it in settings.gradle. */
    copyLibAndSettings(opt, result) {
        const settings = `${result.dest}${Constants_1.FB.SettingsGradleSuffix}`;
        if (opt.enableFirebase) {
            const dest = `${result.dest}${Constants_1.FB.LibFirebaseDestSuffix}`;
            if (fs.existsSync(Constants_1.FB.LibFirebaseSrc)) {
                fse.copySync(Constants_1.FB.LibFirebaseSrc, dest, { recursive: true, overwrite: opt.overwriteLibrary !== false });
                console.log(TAG, `libfirebase → ${dest}`);
            }
            (0, Util_1.appendDestContentToSrcFileIfNo)(settings, Constants_1.FB.SettingsSnippet);
        }
        else {
            (0, Util_1.deleteDestContentInSrcFile)(settings, Constants_1.FB.SettingsSnippet);
        }
    }
    /** Insert (or remove) `FirebaseHub.start(this)` in AppActivity.java after the SDKWrapper init. */
    handleAppActivity(opt) {
        if (!fs.existsSync(Constants_1.FB.AppActivityPath)) {
            console.warn(TAG, 'AppActivity.java missing');
            return;
        }
        if (opt.enableFirebase) {
            (0, Util_1.insertDestToSrcBehindKey)(Constants_1.FB.AppActivityPath, Constants_1.FB.AppActivityInit, Constants_1.FB.AppActivityKeyCode);
        }
        else {
            (0, Util_1.deleteDestToSrcBehindKey)(Constants_1.FB.AppActivityPath, Constants_1.FB.AppActivityInit);
        }
    }
    executePostBuildTasks(options, result) {
        const opt = options.packages[hooks_1.PACKAGE_NAME];
        this.handleGradle(opt);
        this.copyGoogleServices(opt);
        this.copyLibAndSettings(opt, result);
        this.handleAppActivity(opt);
        console.log(TAG, 'post-build tasks done');
    }
}
exports.BuildTaskAndroid = BuildTaskAndroid;
exports.buildTaskAndroid = { android: new BuildTaskAndroid() };
