module.exports = {
    title: 'Firebase — Analytics / Crashlytics / Remote Config / Messaging / Auth',
    description: '面向 Cocos Creator 原生构建的 Firebase 扩展（Analytics、Crashlytics、Remote Config、Cloud Messaging、Auth）。通过 JsbBridgeWrapper 桥接，因此可与其他扩展（例如 AdMob）共存，而不会独占 native.bridge。',

    enableFirebase: {
        title: '启用 Firebase',
        tip: '本扩展的总开关。启用后，构建钩子会注入 Firebase 原生配置（google-services.json / GoogleService-Info.plist），将原生库/SDK 复制到构建工程中，并修补 gradle / CMake / AppActivity / AppDelegate。禁用后，下一次构建会移除此前注入的所有 Firebase 配置。',
    },

    googleServicesJsonPath: {
        title: 'google-services.json',
        tip: '你的 Firebase 项目 google-services.json（Android）在磁盘上的绝对路径。可在 Firebase 控制台下载（项目设置 → 你的应用 → Android 应用）。启用 Firebase 时必填。切勿将该文件提交到版本库。',
    },

    googleServiceInfoPlistPath: {
        title: 'GoogleService-Info.plist',
        tip: '你的 Firebase 项目 GoogleService-Info.plist（iOS）在磁盘上的绝对路径。可在 Firebase 控制台下载（项目设置 → 你的应用 → iOS 应用）。启用 Firebase 时必填。切勿将该文件提交到版本库。',
    },

    enableAnalytics: {
        title: 'Analytics（分析）',
        tip: '链接 Firebase Analytics 并在应用启动时初始化。覆盖完善：logEvent / setUserProperty / setUserId / setEnabled 已在 Android 与 iOS 上原生实现。',
    },

    enableCrashlytics: {
        title: 'Crashlytics（崩溃报告）',
        tip: '链接 Firebase Crashlytics 并启用崩溃报告。覆盖完善：log / setKey / recordError / setUserId / setEnabled / testCrash 已在 Android 与 iOS 上原生实现。',
    },

    enableRemoteConfig: {
        title: 'Remote Config（远程配置）',
        tip: '链接 Firebase Remote Config。覆盖完善：setDefaults / fetchActivate 已在 Android 与 iOS 上原生实现；拉取到的值会缓存在 JS 侧以便同步读取。',
    },

    enableMessaging: {
        title: 'Cloud Messaging（云消息推送）',
        tip: '链接 Firebase Cloud Messaging（FCM）及推送通知能力。iOS：已完整实现（权限请求、获取 Token、主题订阅/取消订阅、Token 刷新）。Android：JS API 已存在，但本扩展尚未接通原生监听 —— 调用会超时。请将 Android 上的 FCM 支持视为实验性/尚未实现，正式使用前请先阅读文档。',
    },

    enableAuth: {
        title: 'Auth（身份认证）',
        tip: '链接 Firebase Auth。实验性功能：JS 客户端（匿名登录、登出、认证状态监听）已存在，但本扩展的 Android 与 iOS 原生桥接均尚未实现对应的监听器 —— 调用会超时。在生产环境使用前，请自行补充原生桥接代码。',
    },

    overwriteLibrary: {
        title: '强制覆盖 Firebase 库文件',
        tip: '每次构建时强制用扩展自带的副本覆盖原生库/模板文件（Android 上的 libfirebase，iOS 上的 firebase/ CMake + SDK 载荷），而不是保留此前已复制的版本。',
    },
};
