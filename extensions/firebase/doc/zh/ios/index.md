# Cocos Firebase — iOS 要求（中文）

## 拉取 Firebase iOS SDK（首次 iOS 构建前必做）

本扩展不会把 Firebase iOS SDK 预编译的 xcframework 提交到仓库中（参见
`OPENSOURCE-PLAN.md` 中的决策 D1 以及根目录 README）。在构建 iOS 之前，请在仓库根
目录运行一次：

```bash
scripts/fetch-firebase-ios-sdk.sh
```

该脚本会做以下事情：

1. 从 [firebase/firebase-ios-sdk releases](https://github.com/firebase/firebase-ios-sdk/releases)
   下载官方发布的 `Firebase.zip`，固定版本为 **12.14.0**。
2. 用 `shasum -a 256 -c` 校验其 SHA-256，校验和是基于该确切发布包实际计算出来的。
   一旦校验不匹配，脚本会拒绝解包。
3. 解压出本扩展需要的 5 个产品 Pod（`FirebaseAnalytics`、`FirebaseAuth`、
   `FirebaseCrashlytics`、`FirebaseMessaging`、`FirebaseRemoteConfig`），并把它们
   包含的 23 个 xcframework 的并集复制到
   `extensions/firebase/template/ios/firebase/Firebase/`。

如果跳过这一步，`BuildTaskiOS.ts` 会立即中止构建，并列出具体缺失哪些
xcframework、提示你运行该脚本 —— 而不是让 Xcode 之后报出一个含糊的
"no such module" 错误。

可以随时重新运行该脚本来重新校验/重新拉取（如果目录已经有内容，脚本会先询问是否
覆盖）。

## 提供 `GoogleService-Info.plist`

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 中为你的项目添加一个
   iOS 应用（使用你应用真实的 Bundle Identifier）。
2. 下载生成的 `GoogleService-Info.plist`。
3. 在 Cocos Creator 的 **构建** 面板（iOS 平台）中，将 **GoogleService-Info.plist**
   设置为该文件的绝对路径。
4. 构建。`BuildTaskiOS.ts` 会把它复制到
   `<构建输出目录>/proj/firebase/GoogleService-Info.plist`，供 `[FIRApp configure]`
   在启动时读取。

**切勿提交 `GoogleService-Info.plist`。** 它是项目专属的，且在本模板的禁止提交文件
名列表（`scripts/check-secrets.sh`）中作为兜底 —— 请把这当作一道保险，而不是唯一的防线。

## 构建配置

- **部署目标：iOS 15.0+** —— 本扩展固定使用的 Firebase iOS SDK 12.x 系列的要求。
- `Pre-firebase.cmake` / `Post-firebase.cmake` 会被复制到 `native/engine/ios/`
  （由 Cocos 的 CMake 构建自动加载），负责链接上面拉取到的 xcframework。
- `firebase-config-info.plist` 会被合并进生成的 `Info.plist` —— 添加 FCM 后台模式
  的权限声明，以及（如果存在）App 跟踪透明度相关的键。项目自身 `Info.plist` 中已有
  的键始终优先。
- `AppDelegate-import.txt` / `AppDelegate-init.txt` 会把 `FirebaseCore` 的 import
  和 `[FIRApp configure]` 调用插入到 `AppDelegate.mm` 中，使用带关键码标记的插入
  方式，确保重新构建以及关闭 Firebase 时都能正确清理。

## 已知限制

- **尚未实现 Auth。** `FirebaseHub.mm` 没有注册任何 `auth.*` 监听器，因此
  `Auth.signInAnonymous()` / `Auth.onStateChanged()` 等调用都会超时。
- Analytics、Crashlytics、Remote Config、Cloud Messaging 均已实现，并在仓库根目录的
  演示场景中得到验证。
- 拉取到的 xcframework 是官方发布的多平台构建产物（同一个发布包里除了 iOS 真机 +
  模拟器切片外，还包含 Mac Catalyst/macOS/tvOS 切片）；Xcode 在链接时只会选取每个
  target 实际需要的切片，因此不会影响你最终 App 的体积，但这确实意味着运行拉取脚本
  后，本地（已被 gitignore 排除的）`Firebase/` 目录会比手工精简过的约 60 MB 版本
  占用更多磁盘空间。
