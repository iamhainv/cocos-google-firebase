// FirebaseHub.h — PLAIN ObjC header (no Firebase framework imports) so the executable
// (AppDelegate.mm) can call into Firebase without needing the Firebase framework search
// path. Mirrors AdMob's AdServiceHub.h pattern. The .mm (compiled in the `firebase` lib,
// which has the xcframework -F) does the actual [FIRApp configure] + bridge wiring.
#import <Foundation/Foundation.h>

@interface FirebaseHub : NSObject
/** Call from AppDelegate didFinishLaunching — runs [FIRApp configure]. */
+ (void)configure;
@end
