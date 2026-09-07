import { BuildPlugin } from '../@types';

export const PACKAGE_NAME = 'firebase';

/** @en Called when the extension is loaded by the editor. */
export const load: BuildPlugin.load = function () {
    console.debug(`${PACKAGE_NAME} load`);
};

/** @en Called when the extension is unloaded by the editor. */
export const unload: BuildPlugin.load = function () {
    console.debug(`${PACKAGE_NAME} unload`);
};

/**
 * @en
 * Shared option schema for both platforms — the toggles are identical, only the
 * native config-file option (key + placeholder) differs per platform.
 * Every `label`/`description` is an `i18n:` key resolved from `i18n/{en,zh}.js`;
 * see that file for the actual copy.
 */
function commonOptions(configPathKey: 'googleServicesJsonPath' | 'googleServiceInfoPlistPath', placeholder: string) {
    return {
        enableFirebase: {
            label: `i18n:${PACKAGE_NAME}.enableFirebase.title`,
            description: `i18n:${PACKAGE_NAME}.enableFirebase.tip`,
            default: true,
            render: { ui: 'ui-checkbox' },
        },
        [configPathKey]: {
            label: `i18n:${PACKAGE_NAME}.${configPathKey}.title`,
            description: `i18n:${PACKAGE_NAME}.${configPathKey}.tip`,
            default: '',
            render: { ui: 'ui-input', attributes: { placeholder } },
            verifyRules: ['required'],
        },
        enableAnalytics: {
            label: `i18n:${PACKAGE_NAME}.enableAnalytics.title`,
            description: `i18n:${PACKAGE_NAME}.enableAnalytics.tip`,
            default: true,
            render: { ui: 'ui-checkbox' },
        },
        enableCrashlytics: {
            label: `i18n:${PACKAGE_NAME}.enableCrashlytics.title`,
            description: `i18n:${PACKAGE_NAME}.enableCrashlytics.tip`,
            default: true,
            render: { ui: 'ui-checkbox' },
        },
        enableRemoteConfig: {
            label: `i18n:${PACKAGE_NAME}.enableRemoteConfig.title`,
            description: `i18n:${PACKAGE_NAME}.enableRemoteConfig.tip`,
            default: true,
            render: { ui: 'ui-checkbox' },
        },
        enableMessaging: {
            label: `i18n:${PACKAGE_NAME}.enableMessaging.title`,
            description: `i18n:${PACKAGE_NAME}.enableMessaging.tip`,
            default: false,
            render: { ui: 'ui-checkbox' },
        },
        enableAuth: {
            label: `i18n:${PACKAGE_NAME}.enableAuth.title`,
            description: `i18n:${PACKAGE_NAME}.enableAuth.tip`,
            default: false,
            render: { ui: 'ui-checkbox' },
        },
        overwriteLibrary: {
            label: `i18n:${PACKAGE_NAME}.overwriteLibrary.title`,
            description: `i18n:${PACKAGE_NAME}.overwriteLibrary.tip`,
            default: true,
            render: { ui: 'ui-checkbox' },
        },
    };
}

/**
 * @en
 * Build plugin configurations for Android and iOS platforms.
 * Each platform declares the hook entry-point and the options shown in the
 * build panel.
 */
export const configs: BuildPlugin.Configs = {
    'android': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: commonOptions('googleServicesJsonPath', 'google-services.json') as any,
    },
    'ios': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: commonOptions('googleServiceInfoPlistPath', 'GoogleService-Info.plist') as any,
    },
};
