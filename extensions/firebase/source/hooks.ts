import { IBuildTaskOption, BuildHook, IBuildResult } from '../@types';
import { buildTaskAndroid } from './BuildTaskAndroid';
import { buildTaskiOS } from './BuildTaskiOS';
import { FirebaseOption } from './FirebaseOptions';

export const PACKAGE_NAME = 'firebase';

export interface ITaskOptions extends IBuildTaskOption {
    packages: {
        firebase: FirebaseOption;
    };
}

function log(...arg: any[]) {
    return console.log(`[${PACKAGE_NAME}] `, ...arg);
}

export const throwError: BuildHook.throwError = true;

export const load: BuildHook.load = async function () {
    log('load firebase build hook');
};

export const onBeforeBuild: BuildHook.onBeforeBuild = async function (options: ITaskOptions) {
    log('onBeforeBuild', options.platform);
};

// iOS post-build injection runs after settings are compressed (matches AdMob's timing).
export const onAfterCompressSettings: BuildHook.onAfterCompressSettings = async function (options: ITaskOptions, result: IBuildResult) {
    if (options.platform === 'ios') {
        buildTaskiOS.ios.executePostBuildTasks(options, result);
    }
};

// Android post-build injection (gradle / manifest / google-services.json / libfirebase).
export const onAfterBuild: BuildHook.onAfterBuild = async function (options: ITaskOptions, result: IBuildResult) {
    if (options.platform === 'android') {
        buildTaskAndroid.android.executePostBuildTasks(options, result);
    }
};

export const unload: BuildHook.unload = async function () {
    log('unload firebase build hook');
};

export const onError: BuildHook.onError = async function () {
    console.warn(`${PACKAGE_NAME} run onError`);
};
