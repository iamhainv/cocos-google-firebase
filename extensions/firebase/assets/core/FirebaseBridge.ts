/**
 * FirebaseBridge — the JS↔native message bridge for the Firebase extension.
 *
 * Built on `JsbBridgeWrapper` (the event-named, MULTI-listener bridge) — NOT the raw
 * `native.bridge` (single `onNative` slot) that GoogleAdMob owns. This is what lets
 * Firebase coexist with AdMob without either clobbering the other: each Firebase method
 * is its own event name, dispatched independently.
 *
 * Protocol: `send(method, payload)` serialises `payload` to JSON and dispatches the event
 * named `method` to native; `on(method, cb)` registers a listener that parses the JSON the
 * native side emits for that event. Fire-and-forget methods (logEvent, crashlytics log)
 * just `send`; request→response methods (RC fetch, Auth sign-in, FCM token) `send` a request
 * and `on` a paired response event; push methods (FCM onMessage) `on` only.
 */
import { native, log } from 'cc';
import { NATIVE } from 'cc/env';

const TAG = '[FirebaseBridge]';

type JsonHandler = (data: any) => void;

class FirebaseBridge {
    /** The JsbBridgeWrapper instance (native only). Cast — not in the generated d.ts. */
    private get wrapper(): any {
        return NATIVE ? (native as any).jsbBridgeWrapper : null;
    }

    /** Send a method + payload to native (fire-and-forget). */
    send(method: string, payload: Record<string, unknown> = {}): void {
        const arg = JSON.stringify(payload);
        if (this.wrapper) {
            this.wrapper.dispatchEventToNative(method, arg);
        } else {
            log(`${TAG} (no native) send ${method} ${arg}`);
        }
    }

    /** Register a handler for an inbound event named `method` (native→JS). Multi-listener. */
    on(method: string, handler: JsonHandler): void {
        if (!this.wrapper) return;
        this.wrapper.addNativeEventListener(method, (arg: string) => {
            let data: any = {};
            try { data = arg ? JSON.parse(arg) : {}; } catch { data = { raw: arg }; }
            handler(data);
        });
    }

    /**
     * One-shot request→response: fire `reqMethod`, resolve on the first `resMethod` event.
     * Resolves EXACTLY once — whichever comes first, the native reply or `timeoutMs` — and
     * always removes the listener + clears the timer. A native side that never replies (FCM
     * token before APNs is ready, an error, app backgrounded mid-request) therefore can't
     * hang the Promise or leak the listener. Times out to `null`.
     */
    request(reqMethod: string, resMethod: string, payload: Record<string, unknown> = {}, timeoutMs = 15000): Promise<any> {
        return new Promise((resolve) => {
            if (!this.wrapper) { resolve(null); return; }
            let done = false;
            let timer: ReturnType<typeof setTimeout> | null = null;
            const once = (arg: string): void => {
                if (done) return;
                done = true;
                if (timer !== null) clearTimeout(timer);
                this.wrapper.removeNativeEventListener(resMethod, once);
                let data: any = {};
                try { data = arg ? JSON.parse(arg) : {}; } catch { data = { raw: arg }; }
                resolve(data);
            };
            this.wrapper.addNativeEventListener(resMethod, once);
            timer = setTimeout(() => {
                if (done) return;
                done = true;
                this.wrapper.removeNativeEventListener(resMethod, once);
                log(`${TAG} request '${reqMethod}' timed out`);
                resolve(null);
            }, timeoutMs);
            this.wrapper.dispatchEventToNative(reqMethod, JSON.stringify(payload));
        });
    }
}

export const firebaseBridge = new FirebaseBridge();
