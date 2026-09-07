/** Firebase Analytics client (fire-and-forget over the bridge). */
import { firebaseBridge } from '../core/FirebaseBridge';

export class Analytics {
    /** Log a custom event. `params` values should be string|number (Firebase constraint). */
    static logEvent(name: string, params: Record<string, string | number> = {}): void {
        firebaseBridge.send('analytics.logEvent', { name, params });
    }
    static setUserProperty(key: string, value: string): void {
        firebaseBridge.send('analytics.setUserProperty', { key, value });
    }
    static setUserId(id: string | null): void {
        firebaseBridge.send('analytics.setUserId', { id });
    }
    /** Master opt-out (GDPR/consent). */
    static setEnabled(enabled: boolean): void {
        firebaseBridge.send('analytics.setEnabled', { enabled });
    }
}
