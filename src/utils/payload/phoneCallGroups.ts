import { normalizePhoneForMatch } from './contactNormalization.js';
interface CallIdentity {
    id: string;
    number?: string;
    timestamp?: string;
}
const time = (call: CallIdentity): number => {
    const parsed = Date.parse(call.timestamp ?? '');
    return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};
/** Stable newest-first order; undated calls follow dated calls without inventing dates. */
export function newestPhoneCalls<T extends CallIdentity>(calls: readonly T[]): T[] {
    return [...calls].sort((a, b) => time(b) - time(a) || 0);
}
/** Match complete numbers, ignoring display punctuation. Unknown numbers stay isolated. */
export function phoneCallGroups<T extends CallIdentity>(calls: readonly T[]): T[][] {
    const groups = new Map<string, T[]>();
    for (const call of newestPhoneCalls(calls)) {
        const number = normalizePhoneForMatch(call.number ?? '');
        const key = number ? `number:${number}` : `record:${call.id}`;
        const group = groups.get(key);
        if (group) group.push(call);
        else groups.set(key, [call]);
    }
    return [...groups.values()];
}
