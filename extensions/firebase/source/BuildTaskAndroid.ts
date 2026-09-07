import * as fs from 'fs';
import * as fse from 'fs-extra';
import { IBuildResult } from '../@types';
import { ITaskOptions, PACKAGE_NAME } from './hooks';
import { FB } from './Constants';
import { FirebaseOption } from './FirebaseOptions';
import { appendDestContentToSrcFileIfNo, deleteDestContentInSrcFile, insertDestToSrcBehindKey, deleteDestToSrcBehindKey } from './Util';

const TAG = '[firebase:android]';

export class BuildTaskAndroid {
    /** Apply the google-services plugin + Firebase BoM/deps to the app & project gradle. */
    private handleGradle(opt: FirebaseOption) {
        if (opt.enableFirebase) {
            appendDestContentToSrcFileIfNo(FB.AppBuildGradle, FB.AppGradleSnippet);
            appendDestContentToSrcFileIfNo(FB.ProjectBuildGradle, FB.ProjectGradleSnippet);
            console.log(TAG, 'gradle snippets applied');
        } else {
            deleteDestContentInSrcFile(FB.AppBuildGradle, FB.AppGradleSnippet);
            deleteDestContentInSrcFile(FB.ProjectBuildGradle, FB.ProjectGradleSnippet);
        }
    }

    /** Copy the user's google-services.json into the app module so the plugin can read it. */
    private copyGoogleServices(opt: FirebaseOption) {
        if (!opt.enableFirebase) return;
        const src = opt.googleServicesJsonPath;
        if (!src || !fs.existsSync(src)) {
            console.warn(TAG, `google-services.json not found at "${src}" — set it in the Build panel.`);
            return;
        }
        fse.copySync(src, FB.GoogleServicesDest, { overwrite: true });
        console.log(TAG, `google-services.json → ${FB.GoogleServicesDest}`);
    }

    /** Copy the libfirebase module into the build proj + register it in settings.gradle. */
    private copyLibAndSettings(opt: FirebaseOption, result: IBuildResult) {
        const settings = `${result.dest}${FB.SettingsGradleSuffix}`;
        if (opt.enableFirebase) {
            const dest = `${result.dest}${FB.LibFirebaseDestSuffix}`;
            if (fs.existsSync(FB.LibFirebaseSrc)) {
                fse.copySync(FB.LibFirebaseSrc, dest, { recursive: true, overwrite: opt.overwriteLibrary !== false });
                console.log(TAG, `libfirebase → ${dest}`);
            }
            appendDestContentToSrcFileIfNo(settings, FB.SettingsSnippet);
        } else {
            deleteDestContentInSrcFile(settings, FB.SettingsSnippet);
        }
    }

    /** Insert (or remove) `FirebaseHub.start(this)` in AppActivity.java after the SDKWrapper init. */
    private handleAppActivity(opt: FirebaseOption) {
        if (!fs.existsSync(FB.AppActivityPath)) { console.warn(TAG, 'AppActivity.java missing'); return; }
        if (opt.enableFirebase) {
            insertDestToSrcBehindKey(FB.AppActivityPath, FB.AppActivityInit, FB.AppActivityKeyCode);
        } else {
            deleteDestToSrcBehindKey(FB.AppActivityPath, FB.AppActivityInit);
        }
    }

    executePostBuildTasks(options: ITaskOptions, result: IBuildResult) {
        const opt = options.packages[PACKAGE_NAME] as FirebaseOption;
        this.handleGradle(opt);
        this.copyGoogleServices(opt);
        this.copyLibAndSettings(opt, result);
        this.handleAppActivity(opt);
        console.log(TAG, 'post-build tasks done');
    }
}

export const buildTaskAndroid = { android: new BuildTaskAndroid() };
