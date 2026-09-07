# Cocos Firebase（中文）

为 Cocos Creator 3.8.x 原生构建接入 Firebase（Analytics、Crashlytics、Remote
Config、Cloud Messaging、Auth）。基于 `JsbBridgeWrapper`（按事件命名、支持多监听器）
桥接，因此可以与其他扩展（例如 AdMob）共存，而不会独占 `native.bridge`。

构建之前，请先阅读[根目录 README](../../../README.md) 中的模块完成度表 —— Android 上
Cloud Messaging 尚未接通，两个平台上 Auth 都尚未接通。

## 兼容性

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | minSdk 23+（Firebase Android BoM 33.7.0 的要求） | iOS 15.0+（Firebase iOS SDK 12.x 的要求） | 仅预览 —— 原生桥是空操作，调用会输出"无原生环境"日志或直接超时 |

## 安装

1. 将 `extensions/firebase` 复制到项目的 `extensions/` 目录下。
2. 重启 Cocos Creator，或通过 **扩展 → 扩展管理器** 启用该扩展。
3. **仅 iOS**：在仓库根目录运行一次 `scripts/fetch-firebase-ios-sdk.sh`，下载并校验
   Firebase iOS SDK 的 xcframework（本仓库不提交这些文件，详见
   [ios/index.md](./ios/index.md)）。
4. 在 **构建** 面板中选择 Android 或 iOS，找到 Firebase 分区：
   - 勾选 **启用 Firebase**。
   - 将 **google-services.json**（Android）或 **GoogleService-Info.plist**（iOS）
     设置为你从 [Firebase 控制台](https://console.firebase.google.com/) 下载的配置
     文件的绝对路径。详见 [android/index.md](./android/index.md) /
     [ios/index.md](./ios/index.md)。**切勿提交这两个文件。**
   - 按需勾选 Analytics / Crashlytics / Remote Config / Messaging / Auth。
5. 构建。构建钩子会复制你的配置文件、修补原生工程，并（Android）注册
   `libfirebase` / （iOS）将 `firebase/` 载荷复制进生成的工程。

## 构建面板选项

以下每个选项均定义在 `source/builder.ts` 中，其标签/提示文案从 `i18n/en.js` /
`i18n/zh.js` 解析。Android 与 iOS 暴露相同的选项集合，仅配置文件路径这一项是各平台
专属的。

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| **启用 Firebase**（`enableFirebase`） | 开 | 总开关。关闭后，下一次构建会移除此前注入的所有 Firebase 配置（gradle 片段、AppActivity/AppDelegate 的插入内容）。 |
| **google-services.json**（Android）/ **GoogleService-Info.plist**（iOS） | 空，必填 | 你的 Firebase 项目平台配置文件在磁盘上的绝对路径。详见 [android/index.md](./android/index.md) / [ios/index.md](./ios/index.md)。 |
| **Analytics**（`enableAnalytics`） | 开 | 链接 Firebase Analytics 并在应用启动时初始化。 |
| **Crashlytics**（`enableCrashlytics`） | 开 | 链接 Firebase Crashlytics 并启用崩溃报告。 |
| **Remote Config**（`enableRemoteConfig`） | 开 | 链接 Firebase Remote Config。 |
| **Cloud Messaging**（`enableMessaging`） | 关 | 链接 FCM 与推送权限。iOS 已完整实现；Android 尚未实现（见完成度表）——默认关闭，需你主动开启。 |
| **Auth**（`enableAuth`） | 关 | 链接 Firebase Auth。两个平台的原生桥都还未实现对应监听器 —— 默认关闭，请视为实验性功能。 |
| **强制覆盖 Firebase 库文件**（`overwriteLibrary`） | 开 | 每次构建都强制用扩展自带的副本覆盖原生库/模板文件（Android 的 `libfirebase`，iOS 的 `firebase/` CMake + SDK 载荷），而不是保留此前已复制的版本。 |

## API 参考

直接从扩展的 asset-db 挂载路径（`db://firebase/...`）导入所需的客户端模块 ——
没有统一的聚合/index 模块，因此只需导入你实际用到的部分：

```ts
import { Analytics } from 'db://firebase/client/Analytics';
import { Crashlytics } from 'db://firebase/client/Crashlytics';
import { RemoteConfig } from 'db://firebase/client/RemoteConfig';
import { Messaging } from 'db://firebase/client/Messaging';
import { Auth } from 'db://firebase/client/Auth';
```

### `Analytics` —— 即发即弃

- `Analytics.logEvent(name: string, params?: Record<string, string | number>): void`
- `Analytics.setUserProperty(key: string, value: string): void`
- `Analytics.setUserId(id: string | null): void`
- `Analytics.setEnabled(enabled: boolean): void` —— 总开关（GDPR/用户同意）。

### `Crashlytics` —— 即发即弃

- `Crashlytics.log(message: string): void` —— 附加到下一次崩溃报告的面包屑日志。
- `Crashlytics.setKey(key: string, value: string | number | boolean): void`
- `Crashlytics.recordError(message: string, domain?: string): void` —— 记录非致命错误。
- `Crashlytics.setUserId(id: string): void`
- `Crashlytics.setEnabled(enabled: boolean): void`
- `Crashlytics.testCrash(): void` —— **仅调试用**，强制杀死应用以端到端验证崩溃报告。

### `RemoteConfig` —— 拉取/激活 + 同步读取

- `RemoteConfig.setDefaults(defaults: Record<string, string | number | boolean>): void`
  —— 设置本地默认值，首次拉取成功前一直生效。
- `RemoteConfig.fetchActivate(minIntervalSec?: number): Promise<boolean>` —— 拉取并激活；
  成功时解析为 `true`，并填充本地缓存。
- `RemoteConfig.getString(key: string, dflt?: string): string`
- `RemoteConfig.getNumber(key: string, dflt?: number): number`
- `RemoteConfig.getBool(key: string, dflt?: boolean): boolean`

`getString`/`getNumber`/`getBool` 读取的是由 `fetchActivate` 填充的内存缓存，因此是
同步的，在首次成功拉取后可以在任何地方安全调用。

### `Messaging` —— iOS 已完整实现，**Android 尚未实现**

- `Messaging.requestPermission(): Promise<boolean>` —— 请求系统通知权限（iOS /
  Android 13+）。
- `Messaging.getToken(): Promise<string | null>` —— 当前 FCM 注册 Token。
- `Messaging.onMessage(cb): void` —— 前台消息：`{ data, title, body }`。
- `Messaging.onTokenRefresh(cb): void` —— `{ token }`。
- `Messaging.subscribeTopic(topic: string): void` / `Messaging.unsubscribeTopic(topic: string): void`

在 Android 上，以上所有调用都会解析为 `null`/`false`，或者根本不会触发 —— 因为原生
监听器尚未注册。

### `Auth` —— **两个平台均未实现**

- `Auth.signInAnonymous(): Promise<string | null>`
- `Auth.currentUid(): string | null` —— 缓存值，同步读取。
- `Auth.signOut(): void`
- `Auth.onStateChanged(cb: (uid: string | null) => void): void`

所有请求/响应调用都会在约 15 秒后超时（解析为 `null`），因为两侧原生桥都尚未注册
`auth.*` 监听器。

## 示例

```ts
import { Analytics } from 'db://firebase/client/Analytics';
import { Crashlytics } from 'db://firebase/client/Crashlytics';
import { RemoteConfig } from 'db://firebase/client/RemoteConfig';

// Analytics
Analytics.logEvent('level_complete', { level: 3, score: 1200 });
Analytics.setUserProperty('plan', 'free');

// Crashlytics —— 在出问题之前先附加上下文
Crashlytics.setUserId('demo-user-123');
Crashlytics.log('Entered level 3');
try {
    riskyOperation();
} catch (e) {
    Crashlytics.recordError(String(e));
}

// Remote Config
RemoteConfig.setDefaults({ show_new_ui: false });
const ok = await RemoteConfig.fetchActivate(3600); // 最多每小时一次
if (ok && RemoteConfig.getBool('show_new_ui')) {
    // ...
}
```

完整可运行的示例见仓库根目录的 `assets/script/test/FirebaseTest.ts`（还涵盖了
Crashlytics 的 `testCrash()` 和 `Messaging.getToken()`）。

## 故障排查

- **启用 Firebase 后 Gradle 同步失败** —— 请确认在构建面板中把 **google-services.json**
  设置为真实的文件路径后再构建；路径为空/文件缺失只会打印警告（不会直接导致构建失败），
  之后 Gradle 会因为 `google-services` 插件自身报出 `google-services.json is missing`
  错误而失败。
- **Gradle 构建时出现"Duplicate class"错误** —— 通常是 Firebase BoM/版本与另一个同样
  引入 Firebase 或 Google Play Services 的扩展冲突。合并多个扩展的片段后，检查
  `native/engine/android/app/build.gradle` 中是否出现了两个不同版本的 Firebase BoM。
- **iOS 报错 "No such module 'FirebaseCore'" 或类似错误** —— 你还没有运行
  `scripts/fetch-firebase-ios-sdk.sh`，或者扩展的 `overwriteLibrary` 选项被关闭导致
  残留了旧文件。运行拉取脚本后重新构建；此时 `BuildTaskiOS.ts` 应该会提前给出明确的
  错误信息中止构建，而不是让 Xcode 报出难以理解的错误。
- **iOS CMake 报错提到 `Pre-firebase.cmake` / `Post-firebase.cmake`** —— 这两个文件
  会被复制到 `native/engine/ios/`；如果你手动编辑过该目录，请与
  `extensions/firebase/template/ios/` 中的原始文件比对，并在启用 **强制覆盖 Firebase
  库文件** 选项的情况下重新构建。
- **Android 上 FCM Token 一直取不到** —— 这是预期行为；本扩展在 Android 上尚未实现
  FCM（见模块完成度表）。
- **Auth 调用一直超时** —— 这是预期行为；两个平台上 Auth 都尚未实现。

## 已知限制

- Android 上尚未实现 Cloud Messaging（FCM）。
- Android 与 iOS 上都尚未实现 Auth。
- Firebase iOS SDK 不会提交到本仓库；每次新拉取仓库后，构建 iOS 之前都需要运行一次
  `scripts/fetch-firebase-ios-sdk.sh`。
- `google-services.json` 与 `GoogleService-Info.plist` 是你需要自行提供的项目级密钥，
  本扩展从不自带这两个文件。
