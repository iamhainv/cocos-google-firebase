/**
 * Firebase Remote Config client. `fetchActivate()` pulls the whole active config into a JS
 * cache (native returns the full key→value map), so `getString/Number/Bool` are synchronous
 * reads afterwards — the game can call them anywhere without awaiting.
 */
import { firebaseBridge } from '../core/FirebaseBridge';

export class RemoteConfig {
    private static _cache: Record<string, string> = {};

    /** Seed local defaults (used until the first fetch lands). */
    static setDefaults(defaults: Record<string, string | number | boolean>): void {
        const m: Record<string, string> = {};
        for (const k in defaults) m[k] = String(defaults[k]);
        RemoteConfig._cache = Object.assign({}, m, RemoteConfig._cache);
        firebaseBridge.send('remoteConfig.setDefaults', { defaults: m });
    }

    /** Fetch + activate; resolves true on success. Populates the local cache from native. */
    static async fetchActivate(minIntervalSec = 3600): Promise<boolean> {
        const res = await firebaseBridge.request('remoteConfig.fetch', 'remoteConfig.fetchResult', { minIntervalSec });
        if (res && res.values && typeof res.values === 'object') {
            RemoteConfig._cache = Object.assign({}, RemoteConfig._cache, res.values);
        }
        return !!(res && res.success);
    }

    static getString(key: string, dflt = ''): string {
        const v = RemoteConfig._cache[key];
        return v === undefined ? dflt : v;
    }
    static getNumber(key: string, dflt = 0): number {
        const v = Number(RemoteConfig._cache[key]);
        return Number.isFinite(v) ? v : dflt;
    }
    static getBool(key: string, dflt = false): boolean {
        const v = RemoteConfig._cache[key];
        if (v === undefined) return dflt;
        return v === 'true' || v === '1';
    }
}
