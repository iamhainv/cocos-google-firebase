"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onError = exports.unload = exports.onAfterBuild = exports.onAfterCompressSettings = exports.onBeforeBuild = exports.load = exports.throwError = exports.PACKAGE_NAME = void 0;
const BuildTaskAndroid_1 = require("./BuildTaskAndroid");
const BuildTaskiOS_1 = require("./BuildTaskiOS");
exports.PACKAGE_NAME = 'firebase';
function log(...arg) {
    return console.log(`[${exports.PACKAGE_NAME}] `, ...arg);
}
exports.throwError = true;
const load = function () {
    return __awaiter(this, void 0, void 0, function* () {
        log('load firebase build hook');
    });
};
exports.load = load;
const onBeforeBuild = function (options) {
    return __awaiter(this, void 0, void 0, function* () {
        log('onBeforeBuild', options.platform);
    });
};
exports.onBeforeBuild = onBeforeBuild;
// iOS post-build injection runs after settings are compressed (matches AdMob's timing).
const onAfterCompressSettings = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.platform === 'ios') {
            BuildTaskiOS_1.buildTaskiOS.ios.executePostBuildTasks(options, result);
        }
    });
};
exports.onAfterCompressSettings = onAfterCompressSettings;
// Android post-build injection (gradle / manifest / google-services.json / libfirebase).
const onAfterBuild = function (options, result) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.platform === 'android') {
            BuildTaskAndroid_1.buildTaskAndroid.android.executePostBuildTasks(options, result);
        }
    });
};
exports.onAfterBuild = onAfterBuild;
const unload = function () {
    return __awaiter(this, void 0, void 0, function* () {
        log('unload firebase build hook');
    });
};
exports.unload = unload;
const onError = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn(`${exports.PACKAGE_NAME} run onError`);
    });
};
exports.onError = onError;
