/** Firebase Crashlytics client (fire-and-forget over the bridge). */
import { firebaseBridge } from '../core/FirebaseBridge';

export class Crashlytics {
    /** Breadcrumb log line attached to the next crash report. */
    static log(message: string): void {
        firebaseBridge.send('crashlytics.log', { message });
    }
    /** Custom key/value attached to crash reports. */
    static setKey(key: string, value: string | number | boolean): void {
        firebaseBridge.send('crashlytics.setKey', { key, value });
    }
    /** Record a non-fatal error. */
    static recordError(message: string, domain = 'js'): void {
        firebaseBridge.send('crashlytics.recordError', { message, domain });
    }
    static setUserId(id: string): void {
        firebaseBridge.send('crashlytics.setUserId', { id });
    }
    static setEnabled(enabled: boolean): void {
        firebaseBridge.send('crashlytics.setEnabled', { enabled });
    }
    /** DEBUG ONLY — force a native crash to verify Crashlytics reporting. */
    static testCrash(): void {
        firebaseBridge.send('crashlytics.testCrash', {});
    }
}
