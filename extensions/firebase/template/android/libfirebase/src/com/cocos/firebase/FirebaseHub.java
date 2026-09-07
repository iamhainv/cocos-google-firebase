// FirebaseHub.java — Android native bridge for the Firebase extension.
// Implemented: Analytics, Crashlytics, Remote Config.
// NOT implemented: Cloud Messaging and Auth (the JS clients in assets/client/Messaging.ts
// and assets/client/Auth.ts exist, but no "messaging.*"/"auth.*" event is registered here
// yet — calls will time out; see the README).
// Bridge: com.cocos.lib.JsbBridgeWrapper (multi-listener, event-named) so Firebase coexists
// with AdMob's raw bridge. FirebaseApp.initializeApp is automatic via the google-services
// ContentProvider; FirebaseHub.start(this) is inserted into AppActivity.onCreate by the build hook.
package com.cocos.firebase;

import android.content.Context;
import android.os.Bundle;
import com.cocos.lib.JsbBridgeWrapper;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.google.firebase.remoteconfig.FirebaseRemoteConfig;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigSettings;
import com.google.firebase.remoteconfig.FirebaseRemoteConfigValue;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public final class FirebaseHub {
    private static FirebaseAnalytics sAnalytics;

    /** Called from AppActivity.onCreate (build-hook insert). */
    public static void start(Context ctx) {
        sAnalytics = FirebaseAnalytics.getInstance(ctx.getApplicationContext());
        JsbBridgeWrapper w = JsbBridgeWrapper.getInstance();

        // ── Analytics ───────────────────────────────────────────────────────
        w.addScriptEventListener("analytics.logEvent", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                sAnalytics.logEvent(m.optString("name"), jsonToBundle(m.optJSONObject("params")));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("analytics.setUserProperty", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                sAnalytics.setUserProperty(m.optString("key"), m.optString("value"));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("analytics.setUserId", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                sAnalytics.setUserId(m.isNull("id") ? null : m.optString("id"));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("analytics.setEnabled", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                sAnalytics.setAnalyticsCollectionEnabled(m.optBoolean("enabled", true));
            } catch (Exception ignored) {}
        });

        // ── Crashlytics ─────────────────────────────────────────────────────
        w.addScriptEventListener("crashlytics.log", arg -> {
            try { FirebaseCrashlytics.getInstance().log(new JSONObject(arg).optString("message")); } catch (Exception ignored) {}
        });
        w.addScriptEventListener("crashlytics.setKey", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                FirebaseCrashlytics.getInstance().setCustomKey(m.optString("key"), m.optString("value"));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("crashlytics.recordError", arg -> {
            try {
                JSONObject m = new JSONObject(arg);
                FirebaseCrashlytics.getInstance().recordException(
                    new RuntimeException("[" + m.optString("domain", "js") + "] " + m.optString("message")));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("crashlytics.setUserId", arg -> {
            try { FirebaseCrashlytics.getInstance().setUserId(new JSONObject(arg).optString("id")); } catch (Exception ignored) {}
        });
        w.addScriptEventListener("crashlytics.setEnabled", arg -> {
            try {
                FirebaseCrashlytics.getInstance().setCrashlyticsCollectionEnabled(new JSONObject(arg).optBoolean("enabled", true));
            } catch (Exception ignored) {}
        });
        w.addScriptEventListener("crashlytics.testCrash", arg -> { throw new RuntimeException("Firebase test crash"); });

        // ── Remote Config ───────────────────────────────────────────────────
        // Seed native defaults so a fetch failure still activates sane values.
        w.addScriptEventListener("remoteConfig.setDefaults", arg -> {
            try {
                JSONObject d = new JSONObject(arg).optJSONObject("defaults");
                if (d != null) {
                    HashMap<String, Object> defs = new HashMap<>();
                    for (Iterator<String> it = d.keys(); it.hasNext(); ) { String k = it.next(); defs.put(k, d.optString(k)); }
                    FirebaseRemoteConfig.getInstance().setDefaultsAsync(defs);
                }
            } catch (Exception ignored) {}
        });
        // fetchAndActivate → dispatch { success, values:{key:string} } back to JS. The JS side
        // merges `values` into its cache; getString/Number/Bool then read synchronously.
        w.addScriptEventListener("remoteConfig.fetch", arg -> {
            try {
                long minInterval = 3600;
                try { minInterval = new JSONObject(arg).optLong("minIntervalSec", 3600); } catch (Exception ignored) {}
                final FirebaseRemoteConfig rc = FirebaseRemoteConfig.getInstance();
                FirebaseRemoteConfigSettings settings = new FirebaseRemoteConfigSettings.Builder()
                    .setMinimumFetchIntervalInSeconds(minInterval)
                    .setFetchTimeoutInSeconds(15)
                    .build();
                rc.setConfigSettingsAsync(settings).addOnCompleteListener(s ->
                    rc.fetchAndActivate().addOnCompleteListener(t -> {
                        JSONObject out = new JSONObject();
                        try {
                            out.put("success", t.isSuccessful());
                            JSONObject values = new JSONObject();
                            for (Map.Entry<String, FirebaseRemoteConfigValue> e : rc.getAll().entrySet()) {
                                values.put(e.getKey(), e.getValue().asString());
                            }
                            out.put("values", values);
                        } catch (Exception ignored) {}
                        w.dispatchEventToScript("remoteConfig.fetchResult", out.toString());
                    }));
            } catch (Exception e) {
                try {
                    JSONObject out = new JSONObject(); out.put("success", false);
                    w.dispatchEventToScript("remoteConfig.fetchResult", out.toString());
                } catch (Exception ignored) {}
            }
        });
    }

    /** JSON params → Analytics Bundle (string / long / double). */
    private static Bundle jsonToBundle(JSONObject o) {
        Bundle b = new Bundle();
        if (o == null) return b;
        for (Iterator<String> it = o.keys(); it.hasNext(); ) {
            String k = it.next();
            Object v = o.opt(k);
            if (v instanceof Number) {
                double d = ((Number) v).doubleValue();
                if (d == Math.rint(d)) b.putLong(k, (long) d); else b.putDouble(k, d);
            } else if (v != null) {
                b.putString(k, String.valueOf(v));
            }
        }
        return b;
    }

    private FirebaseHub() {}
}
