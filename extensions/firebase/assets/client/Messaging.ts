/** Firebase Cloud Messaging (FCM) client. */
import { firebaseBridge } from '../core/FirebaseBridge';

export class Messaging {
    /** Ask the OS for notification permission (iOS / Android 13+). Resolves granted. */
    static async requestPermission(): Promise<boolean> {
        const res = await firebaseBridge.request('messaging.requestPermission', 'messaging.permissionResult', {});
        return !!(res && res.granted);
    }
    /** Current FCM registration token (null if unavailable). */
    static async getToken(): Promise<string | null> {
        const res = await firebaseBridge.request('messaging.getToken', 'messaging.tokenResult', {});
        return res && res.token ? String(res.token) : null;
    }
    /** Foreground message received: `{ data, title, body }`. */
    static onMessage(cb: (msg: { data?: Record<string, string>; title?: string; body?: string }) => void): void {
        firebaseBridge.on('messaging.onMessage', cb);
    }
    /** Token refreshed: `{ token }`. */
    static onTokenRefresh(cb: (msg: { token: string }) => void): void {
        firebaseBridge.on('messaging.onTokenRefresh', cb);
    }
    static subscribeTopic(topic: string): void {
        firebaseBridge.send('messaging.subscribe', { topic });
    }
    static unsubscribeTopic(topic: string): void {
        firebaseBridge.send('messaging.unsubscribe', { topic });
    }
}
