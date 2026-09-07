# Cocos Firebase

[![CI](https://github.com/iamhainv/cocos-google-firebase/actions/workflows/ci.yml/badge.svg)](https://github.com/iamhainv/cocos-google-firebase/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](#english) | [中文](#中文)

---

<a id="english"></a>
## English

A Cocos Creator 3.8.x extension that wires up [Firebase](https://firebase.google.com/)
(Analytics, Crashlytics, Remote Config, Cloud Messaging, Auth) for native Android/iOS
builds, with a small async/sync TypeScript API. It bridges over `JsbBridgeWrapper`
(event-named, multi-listener) rather than the raw `native.bridge` single slot, so it
coexists with other native extensions (e.g. AdMob) instead of fighting them for the
bridge.

### Module coverage — read this before you build

This extension is **not equally finished on every module**. Being upfront about that:

| Module | Android | iOS | Notes |
| --- | --- | --- | --- |
| **Analytics** | Implemented | Implemented | `logEvent` / `setUserProperty` / `setUserId` / `setEnabled`. Solid on both platforms. |
| **Crashlytics** | Implemented | Implemented | `log` / `setKey` / `recordError` / `setUserId` / `setEnabled` / `testCrash`. Solid on both platforms. |
| **Remote Config** | Implemented | Implemented | `setDefaults` / `fetchActivate`; fetched values are cached in JS for synchronous reads. Solid on both platforms. |
| **Cloud Messaging (FCM)** | **Not implemented** | Implemented | The JS API (`Messaging.*`) exists and compiles on both platforms, but the Android native bridge does not register any `messaging.*` listener yet — calls will time out. iOS is fully wired (permission request, token, topic subscribe/unsubscribe, token refresh). Treat Android push as **experimental / TODO**. |
| **Auth** | **Not implemented** | **Not implemented** | The JS API (`Auth.*`) exists on both platforms, but neither native bridge registers an `auth.*` listener — every call times out. Treat as a stub; you'll need to add the native `FIRAuth`/`FirebaseAuth` glue yourself before shipping anything that depends on it. |

"Implemented" here means: the native bridge method is registered and forwards to the
real Firebase SDK call, and it has been exercised through the demo scene below. It
does not mean "battle-tested in a shipped app" — review the native code in
`extensions/firebase/template/{android,ios}/` before depending on it in production.

### Demo

A runnable demo lives at the project root:

- Scene: [`assets/scene/main.scene`](./assets/scene/main.scene)
- Script: [`assets/script/test/FirebaseTest.ts`](./assets/script/test/FirebaseTest.ts)

Open this repo as a Cocos Creator 3.8.x project, open `main.scene`, and build for
Android or iOS. It builds its whole UI in code — five buttons (Log Event, Set User
Property, Force Test Crash, Fetch Remote Config, Get FCM Token) plus a small on-screen
log — so the example is readable in a single file. On web/editor preview, the native
bridge is a no-op, so most calls simply log a "no native" line or time out; that's
expected, build to a device to see real behavior.

> **Known first-open caveat**: `main.scene` was hand-authored (not saved by the
> Creator GUI), and the `FirebaseTest` component is referenced by the script asset's
> full UUID rather than Creator's internal compressed script id. If Creator shows a
> "script asset lost" / missing-script warning on the `Content` node the first time you
> open the project, just re-drag `assets/script/test/FirebaseTest.ts` onto that node in
> the Inspector and re-save the scene — a one-time fix; only the `Content` node is
> affected, nothing else is at risk.

### Compatibility

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | minSdk 23+ (Firebase Android BoM 33.7.0 requirement) | iOS 15.0+ (Firebase iOS SDK 12.x requirement) | Preview only (native features degrade to no-ops / timeouts) |

### Installation

1. Copy `extensions/firebase` into your project's `extensions/` folder.
2. Restart Cocos Creator, or use **Extension → Extension Manager** to enable it.
3. **iOS only** — fetch the Firebase iOS SDK frameworks (see below). This is a
   one-time setup step; the extension does not commit the ~200+ MB of prebuilt
   xcframeworks to this repo.
4. See the full documentation: [doc/en](./extensions/firebase/doc/en/index.md)

### iOS setup: fetching the Firebase iOS SDK

`extensions/firebase/template/ios/firebase/Firebase/` (the 23 xcframeworks the iOS
build links against) is **not committed to this repository** — see
[`.gitignore`](./.gitignore) and the rationale in `OPENSOURCE-PLAN.md` decision D1.
Instead, run:

```bash
scripts/fetch-firebase-ios-sdk.sh
```

from the repo root before your first iOS build. It downloads the official
`Firebase.zip` release asset from
[firebase/firebase-ios-sdk](https://github.com/firebase/firebase-ios-sdk/releases)
(pinned to **12.14.0**), verifies its SHA-256 against a checksum computed from that
exact release asset, and unpacks only the 23 xcframeworks this extension needs. If you
skip this step, `BuildTaskiOS.ts` will fail the build with a clear error instead of
silently producing a broken Xcode project.

### Supplying `google-services.json` / `GoogleService-Info.plist`

You must provide your own Firebase project config files — this extension does not (and
must not) ship one:

1. Create/open your project in the [Firebase console](https://console.firebase.google.com/).
2. Add an Android app and an iOS app to it, then download:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
3. In Cocos Creator's **Build** panel, under the Firebase section, point
   **google-services.json** / **GoogleService-Info.plist** at the absolute path of
   the file you downloaded (one field per platform). The build hook copies it into
   the generated native project for you.

**Never commit either file to source control.** Both contain project-specific
identifiers tied to your Firebase project and are listed as forbidden filenames in
this template's sanitize check (`.gitignore` already excludes them as a backstop —
don't rely on that alone).

### Where the Android Gradle snippets get inserted

`extensions/firebase/template/android/*.snippet` are marker-delimited blocks
(`>>> Firebase extension >>> ... <<< Firebase extension <<<`) that the build hook
inserts/removes idempotently. You do not edit these files yourself, but it helps to
know where they land if something doesn't compile:

| Snippet | Inserted into | When |
| --- | --- | --- |
| `app-build.gradle.snippet` | `native/engine/android/app/build.gradle` (the persistent native project — survives rebuilds) | On every build where Firebase is enabled |
| `project-build.gradle.snippet` | `native/engine/android/build.gradle` (project-level; declares the `google-services`/`crashlytics` Gradle plugin classpaths) | Same |
| `settings.gradle.snippet` | `build/<platform>/proj/settings.gradle` (the per-build output project; registers the `libfirebase` module) | Same |

If you disable Firebase in the Build panel and rebuild, all three insertions are
cleanly removed again.

### Documentation

- English: [extensions/firebase/doc/en/index.md](./extensions/firebase/doc/en/index.md)
- 中文: [extensions/firebase/doc/zh/index.md](./extensions/firebase/doc/zh/index.md)

### Third-party notices

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the licenses of the
Firebase SDKs and Gradle plugins this extension depends on.

### License

MIT — see [LICENSE](./LICENSE).

### Trademarks

This project is an independent, community-maintained wrapper and is **not
affiliated with, endorsed by, or sponsored by** Cocos, Google, or Apple.
"Cocos Creator", "AdMob", "Firebase", "Google Play" and "App Store" are
trademarks of their respective owners.

---

<a id="中文"></a>
## 中文

一个 Cocos Creator 3.8.x 扩展，为原生 Android/iOS 构建接入
[Firebase](https://firebase.google.com/)（Analytics、Crashlytics、Remote Config、
Cloud Messaging、Auth），提供小巧的异步/同步 TypeScript API。它基于
`JsbBridgeWrapper`（按事件命名、支持多监听器）桥接，而不是占用单一插槽的原生
`native.bridge`，因此可以和其他原生扩展（例如 AdMob）共存，而不会互相冲突。

### 模块完成度 — 构建前请先阅读

本扩展**并非每个模块完成度都一致**，以下如实说明：

| 模块 | Android | iOS | 说明 |
| --- | --- | --- | --- |
| **Analytics（分析）** | 已实现 | 已实现 | `logEvent` / `setUserProperty` / `setUserId` / `setEnabled`，双平台均较完善。 |
| **Crashlytics（崩溃报告）** | 已实现 | 已实现 | `log` / `setKey` / `recordError` / `setUserId` / `setEnabled` / `testCrash`，双平台均较完善。 |
| **Remote Config（远程配置）** | 已实现 | 已实现 | `setDefaults` / `fetchActivate`；拉取到的值会缓存在 JS 侧以便同步读取。双平台均较完善。 |
| **Cloud Messaging（云消息推送）** | **未实现** | 已实现 | JS API（`Messaging.*`）在两个平台上都存在且能编译，但 Android 原生桥尚未注册任何 `messaging.*` 监听器 —— 调用会超时。iOS 已完整实现（权限请求、Token、主题订阅/取消订阅、Token 刷新）。请将 Android 推送视为**实验性 / 待办事项**。 |
| **Auth（身份认证）** | **未实现** | **未实现** | JS API（`Auth.*`）在两个平台上都存在，但两侧原生桥均未注册 `auth.*` 监听器 —— 所有调用都会超时。请视为占位实现；在生产环境依赖它之前，需要自行补充原生的 `FIRAuth` / `FirebaseAuth` 桥接代码。 |

这里的"已实现"是指：原生桥方法已注册，并会转发到真实的 Firebase SDK 调用，且已通过下方的
演示场景验证过。这**不代表**"已在正式发布的应用中长期验证"—— 在生产环境依赖之前，请自行审阅
`extensions/firebase/template/{android,ios}/` 下的原生代码。

### 演示

项目根目录提供了一个可直接运行的演示：

- 场景：[`assets/scene/main.scene`](./assets/scene/main.scene)
- 脚本：[`assets/script/test/FirebaseTest.ts`](./assets/script/test/FirebaseTest.ts)

用 Cocos Creator 3.8.x 打开本仓库，打开 `main.scene`，构建到 Android 或 iOS。演示的整个
UI 都是代码生成的 —— 五个按钮（记录事件 / 设置用户属性 / 强制测试崩溃 / 拉取 Remote
Config / 获取 FCM Token）加上一小块屏幕日志 —— 因此示例可以在单个文件中读完。在网页/编辑器预览
下，原生桥是空操作，大多数调用会输出"无原生环境"日志或直接超时，这是预期行为；请构建到真机上
查看真实效果。

> **首次打开的已知提示**：`main.scene` 是手工编写的（并非由 Creator GUI 保存），
> `FirebaseTest` 组件是通过脚本资源的完整 UUID 引用的，而不是 Creator 内部的压缩脚本 id。
> 如果 Creator 第一次打开项目时，在 `Content` 节点上提示"脚本资源丢失"/脚本缺失警告，
> 只需把 `assets/script/test/FirebaseTest.ts` 重新拖拽到该节点的 Inspector 面板上并重新保存场景即可
> —— 这是一次性修复，只影响 `Content` 节点，不会有其他风险。

### 兼容性

| Cocos Creator | Android | iOS | Web |
| --- | --- | --- | --- |
| >= 3.8.0 | minSdk 23+（Firebase Android BoM 33.7.0 的要求） | iOS 15.0+（Firebase iOS SDK 12.x 的要求） | 仅预览（原生功能会降级为空操作/超时） |

### 安装

1. 将 `extensions/firebase` 复制到项目的 `extensions/` 目录下。
2. 重启 Cocos Creator，或通过 **扩展 → 扩展管理器** 启用该扩展。
3. **仅 iOS**：拉取 Firebase iOS SDK 框架文件（见下文）。这是一次性设置步骤；本仓库不会
   提交这 200+ MB 的预编译 xcframework。
4. 查看完整文档：[doc/zh](./extensions/firebase/doc/zh/index.md)

### iOS 设置：拉取 Firebase iOS SDK

`extensions/firebase/template/ios/firebase/Firebase/`（iOS 构建所链接的 23 个
xcframework）**不会提交到本仓库** —— 参见 [`.gitignore`](./.gitignore) 以及
`OPENSOURCE-PLAN.md` 决策 D1 中的说明。请在首次 iOS 构建前，在仓库根目录运行：

```bash
scripts/fetch-firebase-ios-sdk.sh
```

该脚本会从 [firebase/firebase-ios-sdk](https://github.com/firebase/firebase-ios-sdk/releases)
下载官方发布的 `Firebase.zip`（固定版本 **12.14.0**），用基于该确切发布包计算出的
SHA-256 校验和进行验证，并只解包本扩展需要的 23 个 xcframework。如果跳过此步骤，
`BuildTaskiOS.ts` 会以清晰的错误信息中止构建，而不是悄悄生成一个损坏的 Xcode 工程。

### 提供 `google-services.json` / `GoogleService-Info.plist`

你必须提供自己的 Firebase 项目配置文件 —— 本扩展不会（也不应该）自带：

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 中创建/打开你的项目。
2. 分别添加 Android 应用和 iOS 应用，然后下载：
   - `google-services.json`（Android）
   - `GoogleService-Info.plist`（iOS）
3. 在 Cocos Creator 的 **构建** 面板中，Firebase 分区下的 **google-services.json** /
   **GoogleService-Info.plist** 字段填写你下载文件的绝对路径（每个平台各一个字段）。
   构建钩子会自动把它复制进生成的原生工程。

**切勿将这两个文件提交到版本库。** 它们都包含与你的 Firebase 项目绑定的专属标识符，
且在本模板的 sanitize 检查中属于禁止提交的文件名（`.gitignore` 已将它们排除作为兜底 ——
但不要仅依赖这一点）。

### Android Gradle 片段插入位置

`extensions/firebase/template/android/*.snippet` 是带标记的代码块
（`>>> Firebase extension >>> ... <<< Firebase extension <<<`），由构建钩子幂等地
插入/移除。你无需自己编辑这些文件，但了解它们插入到哪里有助于排查编译问题：

| 片段 | 插入到 | 时机 |
| --- | --- | --- |
| `app-build.gradle.snippet` | `native/engine/android/app/build.gradle`（持久化的原生工程，构建之间不会被清空） | 每次启用 Firebase 的构建 |
| `project-build.gradle.snippet` | `native/engine/android/build.gradle`（工程级，声明 `google-services`/`crashlytics` 插件的 classpath） | 同上 |
| `settings.gradle.snippet` | `build/<平台>/proj/settings.gradle`（每次构建生成的输出工程，注册 `libfirebase` 模块） | 同上 |

如果在构建面板中禁用 Firebase 并重新构建，以上三处插入都会被干净地移除。

### 文档

- English: [extensions/firebase/doc/en/index.md](./extensions/firebase/doc/en/index.md)
- 中文: [extensions/firebase/doc/zh/index.md](./extensions/firebase/doc/zh/index.md)

### 第三方声明

各 Firebase SDK 及 Gradle 插件的许可证信息，请参见
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

### 许可证

MIT — 详见 [LICENSE](./LICENSE)。

### 商标声明

本项目为独立的社区维护封装库，**与 Cocos、Google、Apple 均无关联，未获得其
认可或赞助**。"Cocos Creator"、"AdMob"、"Firebase"、"Google Play" 与
"App Store" 均为其各自所有者的商标。
