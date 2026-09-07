/** Firebase Auth client (anonymous + optional provider linking). */
import { firebaseBridge } from '../core/FirebaseBridge';

export class Auth {
    private static _uid: string | null = null;

    /** Sign in anonymously; resolves the uid (null on failure). Caches uid. */
    static async signInAnonymous(): Promise<string | null> {
        const res = await firebaseBridge.request('auth.signInAnonymous', 'auth.signInResult', {});
        Auth._uid = res && res.uid ? String(res.uid) : null;
        return Auth._uid;
    }
    /** Last known uid (cached; also updated by the auth-state listener). */
    static currentUid(): string | null {
        return Auth._uid;
    }
    static signOut(): void {
        Auth._uid = null;
        firebaseBridge.send('auth.signOut', {});
    }
    /** Auth state changes: `{ uid }` (uid empty when signed out). */
    static onStateChanged(cb: (uid: string | null) => void): void {
        firebaseBridge.on('auth.stateChanged', (d: { uid?: string }) => {
            Auth._uid = d && d.uid ? String(d.uid) : null;
            cb(Auth._uid);
        });
    }
    // Provider linking (linkGoogle / linkApple) is not implemented yet — would follow the
    // same request('auth.linkGoogle', 'auth.linkResult', ...) shape as signInAnonymous above.
}
