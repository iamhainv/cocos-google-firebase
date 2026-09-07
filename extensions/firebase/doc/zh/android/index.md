# Cocos Firebase — Android 要求（中文）

## 权限 / 能力

- `libfirebase` 的 `AndroidManifest.xml` 中声明了
  `android.permission.POST_NOTIFICATIONS`（Android 13+ 上 FCM/通知权限弹窗所需），
  会自动合并进你的应用清单。
- 本扩展不声明其他 Android 权限。

## 提供 `google-services.json`

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 中为你的项目添加一个
   Android 应用（使用你应用真实的 `applicationId`/包名）。
2. 下载生成的 `google-services.json`。
3. 在 Cocos Creator 的 **构建** 面板（Android 平台）中，将 **google-services.json**
   设置为该文件的绝对路径。
4. 构建。`BuildTaskAndroid.ts` 会把它复制到
   `native/engine/android/app/google-services.json`，`com.google.gms.google-services`
   Gradle 插件在构建时会读取该文件。

**切勿提交 `google-services.json`。** 它是项目专属的，且在本模板的禁止提交文件名
列表（`scripts/check-secrets.sh`）中作为兜底 —— 请把这当作一道保险，而不是唯一的防线。

## 构建配置

最低要求（另见根目录 README 的兼容性表）：

- **minSdkVersion 23+** —— `template/android/libfirebase/build.gradle` 与
  `app-build.gradle.snippet` 中固定使用的 Firebase Android BoM `33.7.0` 的要求。
- `compileSdkVersion` / `targetSdkVersion` 继承自你项目自身的 Gradle 属性
  （`PROP_COMPILE_SDK_VERSION` / `PROP_TARGET_SDK_VERSION`）；本扩展不会固定这两个值。

### Gradle 片段插入位置

| 片段 | 插入到 | 作用 |
| --- | --- | --- |
| `app-build.gradle.snippet` | `native/engine/android/app/build.gradle` | 应用 `com.google.gms.google-services` 与 `com.google.firebase.crashlytics` 插件；添加 Firebase BoM 以及 `firebase-analytics`/`firebase-crashlytics`/`firebase-config`/`firebase-messaging`/`firebase-auth` 依赖，并依赖 `libfirebase` 模块。 |
| `project-build.gradle.snippet` | `native/engine/android/build.gradle` | 声明插件 classpath（`com.google.gms:google-services:4.4.2`、`com.google.firebase:firebase-crashlytics-gradle:3.0.2`），使上面 app 模块中的 `apply plugin` 能够解析成功。 |
| `settings.gradle.snippet` | `build/android/proj/settings.gradle`（每次构建生成的输出工程） | 在生成的工程中注册 `libfirebase` 模块（`include ':libfirebase'`）。 |

以上三处均通过标记注释（`>>> Firebase extension >>> ... <<< Firebase extension <<<`）
根据 **启用 Firebase** 开关幂等地插入/移除 —— 你无需手动编辑这些文件。

### `libfirebase` 原生模块

`template/android/libfirebase/` 是一个小型 Android library 模块
（`com.cocos.firebase`），其中的 `FirebaseHub.java` 是原生桥，接收来自 JS 客户端的
`JsbBridgeWrapper` 事件并转发给真实的 Firebase Android SDK 调用。它会在每次构建时
复制到 `build/android/proj/libfirebase`（受 **强制覆盖 Firebase 库文件** 选项控制），
并通过 `settings.gradle.snippet` 注册。

## 已知限制

- **尚未实现 Cloud Messaging（FCM）。** `FirebaseHub.java` 没有注册任何
  `messaging.*` 监听器，因此 `Messaging.requestPermission()` /
  `Messaging.getToken()` / 主题订阅/取消订阅在超时后都会解析为
  `false`/`null`/空操作。清单文件中甚至留有一段注释掉的 FCM service 声明
  （`libfirebase/src/main/AndroidManifest.xml`），如果你想自己实现，可以从那里开始。
- **尚未实现 Auth。** 情况相同 —— JS API 存在，但原生监听器不存在。
- Analytics、Crashlytics、Remote Config 已实现，并在仓库根目录的演示场景中得到验证。
