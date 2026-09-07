// FirebaseHub.mm — iOS native bridge for the Firebase extension.
// Implemented: Analytics, Crashlytics, Remote Config, Cloud Messaging.
// NOT implemented: Auth (the JS client in assets/client/Auth.ts exists, but no
// "auth.*" event is registered here yet — calls will time out; see the README).
//
// Bridge: uses the engine's ObjC JsbBridgeWrapper (event-named, MULTI-listener) so Firebase
// coexists with AdMob's raw native.bridge WITHOUT clobbering it. [FIRApp configure] runs in
// AppDelegate.mm (build-hook insert), BEFORE any analytics call; listeners register at +load.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>
#import <FirebaseCore/FirebaseCore.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>
#import <FirebaseCrashlytics/FirebaseCrashlytics.h>
#import <FirebaseMessaging/FirebaseMessaging.h>
#import <FirebaseRemoteConfig/FirebaseRemoteConfig.h>
#import "platform/apple/JsbBridgeWrapper.h"
#import "FirebaseHub.h"

static NSDictionary *FBParse(NSString *json) {
    if (json.length == 0) return @{};
    NSData *d = [json dataUsingEncoding:NSUTF8StringEncoding];
    id obj = d ? [NSJSONSerialization JSONObjectWithData:d options:0 error:nil] : nil;
    return [obj isKindOfClass:[NSDictionary class]] ? obj : @{};
}

/** Serialise a dict to JSON and emit it to JS on the named event. ALWAYS marshals to the
 *  main thread: FCM/APNs/permission callbacks fire on background threads, and touching the
 *  JS script engine off the main thread (especially around app background/pause) crashes with
 *  EXC_BAD_ACCESS. */
static void FBEmit(NSString *event, NSDictionary *payload) {
    NSData *d = [NSJSONSerialization dataWithJSONObject:payload options:0 error:nil];
    NSString *json = d ? [[NSString alloc] initWithData:d encoding:NSUTF8StringEncoding] : @"{}";
    dispatch_async(dispatch_get_main_queue(), ^{
        [[JsbBridgeWrapper sharedInstance] dispatchEventToScript:event arg:json];
    });
}

// FCM token refresh delegate — keep FirebaseHub.h plain (no Firebase imports) by declaring
// the protocol conformance here.
@interface FirebaseHub () <FIRMessagingDelegate>
@end

@implementation FirebaseHub

+ (instancetype)shared {
    static FirebaseHub *s = nil;
    static dispatch_once_t once;
    dispatch_once(&once, ^{ s = [[FirebaseHub alloc] init]; });
    return s;
}

+ (void)configure {
    [FIRApp configure];
    [FIRMessaging messaging].delegate = [FirebaseHub shared];   // FCM token refresh
}

// FIRMessagingDelegate — fires when the FCM registration token is (re)issued.
- (void)messaging:(FIRMessaging *)messaging didReceiveRegistrationToken:(NSString *)fcmToken {
    FBEmit(@"messaging.onTokenRefresh", @{@"token": fcmToken ?: @""});
}

+ (void)load {
    // JsbBridgeWrapper is MRC and calls [listener release] on every block passed to
    // addScriptEventListener: (engine source JsbBridgeWrapper.mm:58-69).  Inline
    // block literals are +0 from ARC's perspective, so the engine's release
    // over-frees them → dangling blocks → EXC_BAD_ACCESS on the next triggerEvent.
    // Fix: keep a strong static container that retains each block so it survives
    // the engine's release.  Listener bodies are unchanged.
    static NSMutableArray *sFBListeners = nil;
    if (!sFBListeners) sFBListeners = [[NSMutableArray alloc] init];

    // Helper macro: retain the block in sFBListeners, then register it.
#define FB_REGISTER(event, block) \
    do { \
        OnScriptEventListener _l = (block); \
        [sFBListeners addObject:_l]; \
        [w addScriptEventListener:(event) listener:_l]; \
    } while (0)

    JsbBridgeWrapper *w = [JsbBridgeWrapper sharedInstance];

    // ── Analytics ───────────────────────────────────────────────────────────
    FB_REGISTER(@"analytics.logEvent", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        NSString *name = m[@"name"];
        NSDictionary *params = [m[@"params"] isKindOfClass:[NSDictionary class]] ? m[@"params"] : @{};
        if (name.length) [FIRAnalytics logEventWithName:name parameters:params];
    });
    FB_REGISTER(@"analytics.setUserProperty", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        [FIRAnalytics setUserPropertyString:m[@"value"] forName:m[@"key"]];
    });
    FB_REGISTER(@"analytics.setUserId", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        id idv = m[@"id"];
        [FIRAnalytics setUserID:(idv == [NSNull null] ? nil : idv)];
    });
    FB_REGISTER(@"analytics.setEnabled", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        [FIRAnalytics setAnalyticsCollectionEnabled:[m[@"enabled"] boolValue]];
    });

    // ── Crashlytics ─────────────────────────────────────────────────────────
    FB_REGISTER(@"crashlytics.log", ^(NSString *arg) {
        [[FIRCrashlytics crashlytics] log:FBParse(arg)[@"message"]];
    });
    FB_REGISTER(@"crashlytics.setKey", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        [[FIRCrashlytics crashlytics] setCustomValue:m[@"value"] forKey:m[@"key"]];
    });
    FB_REGISTER(@"crashlytics.recordError", ^(NSString *arg) {
        NSDictionary *m = FBParse(arg);
        NSError *e = [NSError errorWithDomain:(m[@"domain"] ?: @"js") code:0
                                     userInfo:@{NSLocalizedDescriptionKey: (m[@"message"] ?: @"")}];
        [[FIRCrashlytics crashlytics] recordError:e];
    });
    FB_REGISTER(@"crashlytics.setUserId", ^(NSString *arg) {
        [[FIRCrashlytics crashlytics] setUserID:FBParse(arg)[@"id"]];
    });
    FB_REGISTER(@"crashlytics.setEnabled", ^(NSString *arg) {
        [[FIRCrashlytics crashlytics] setCrashlyticsCollectionEnabled:[FBParse(arg)[@"enabled"] boolValue]];
    });
    FB_REGISTER(@"crashlytics.testCrash", ^(NSString *arg) {
        volatile int *p = NULL; *p = 42;  // intentional null-deref crash (Crashlytics verify)
    });

    // ── Cloud Messaging (FCM) ─────────────────────────────────────────────────
    // Ask the OS for notification permission, then register for remote notifications.
    // FirebaseAppDelegateProxyEnabled=YES (Info.plist) auto-forwards the APNs token to FCM.
    FB_REGISTER(@"messaging.requestPermission", ^(NSString *arg) {
        UNAuthorizationOptions opts = UNAuthorizationOptionAlert | UNAuthorizationOptionBadge | UNAuthorizationOptionSound;
        [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:opts
            completionHandler:^(BOOL granted, NSError *_Nullable error) {
                if (granted) {
                    dispatch_async(dispatch_get_main_queue(), ^{
                        [[UIApplication sharedApplication] registerForRemoteNotifications];
                    });
                }
                FBEmit(@"messaging.permissionResult", @{@"granted": @(granted)});
            }];
    });
    FB_REGISTER(@"messaging.getToken", ^(NSString *arg) {
        [[FIRMessaging messaging] tokenWithCompletion:^(NSString *_Nullable token, NSError *_Nullable error) {
            FBEmit(@"messaging.tokenResult", @{@"token": token ?: @""});
        }];
    });
    FB_REGISTER(@"messaging.subscribe", ^(NSString *arg) {
        NSString *topic = FBParse(arg)[@"topic"];
        if (topic.length) [[FIRMessaging messaging] subscribeToTopic:topic];
    });
    FB_REGISTER(@"messaging.unsubscribe", ^(NSString *arg) {
        NSString *topic = FBParse(arg)[@"topic"];
        if (topic.length) [[FIRMessaging messaging] unsubscribeFromTopic:topic];
    });

    // ── Remote Config ─────────────────────────────────────────────────────────
    // Seed native defaults so a failed fetch still activates sane values.
    FB_REGISTER(@"remoteConfig.setDefaults", ^(NSString *arg) {
        NSDictionary *d = FBParse(arg)[@"defaults"];
        if ([d isKindOfClass:[NSDictionary class]]) [[FIRRemoteConfig remoteConfig] setDefaults:d];
    });
    // fetchAndActivate → emit { success, values:{key:string} } back to JS (mirrors Android /
    // the RemoteConfig.ts contract; the JS side merges `values` into its synchronous cache).
    FB_REGISTER(@"remoteConfig.fetch", ^(NSString *arg) {
        FIRRemoteConfig *rc = [FIRRemoteConfig remoteConfig];
        NSNumber *mi = FBParse(arg)[@"minIntervalSec"];
        FIRRemoteConfigSettings *st = [[FIRRemoteConfigSettings alloc] init];
        st.minimumFetchInterval = mi ? [mi doubleValue] : 3600;
        st.fetchTimeout = 15;
        [rc setConfigSettings:st];
        [rc fetchAndActivateWithCompletionHandler:^(FIRRemoteConfigFetchAndActivateStatus status, NSError *error) {
            NSMutableDictionary *values = [NSMutableDictionary dictionary];
            NSMutableSet *keys = [NSMutableSet set];
            [keys addObjectsFromArray:[rc allKeysFromSource:FIRRemoteConfigSourceRemote]];
            [keys addObjectsFromArray:[rc allKeysFromSource:FIRRemoteConfigSourceDefault]];
            for (NSString *k in keys) { NSString *v = [rc configValueForKey:k].stringValue; values[k] = v ?: @""; }
            FBEmit(@"remoteConfig.fetchResult",
                   @{@"success": @(status != FIRRemoteConfigFetchAndActivateStatusError), @"values": values});
        }];
    });

#undef FB_REGISTER
}

@end
