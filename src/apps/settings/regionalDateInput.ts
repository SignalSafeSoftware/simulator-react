const HOUR_MS = 3_600_000;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
const UTC_OFFSET = /^[+-]((0\d|1[0-3]):[0-5]\d|14:00)$/;

/** HTML date-time inputs need ASCII calendar fields, independent of display locale. */
export function regionalDateInput(value: number, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '';
    const milliseconds = String(new Date(value).getUTCMilliseconds()).padStart(3, '0');
    return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}.${milliseconds}`;
}

/** Reject invalid dates and nonexistent/ambiguous wall times; never infer a missing zone. */
export function parseRegionalDateInput(value: string, timeZone: string): number {
    if (!LOCAL_DATE_TIME.test(value) || !timeZone) return NaN;
    const wallTime = Date.parse(`${value}Z`);
    if (!Number.isFinite(wallTime)) return NaN;
    const normalized = new Date(wallTime).toISOString().slice(0, -1);
    // Date.parse normalizes invalid days; those are not valid calendar input.
    if (!normalized.startsWith(value)) return NaN;
    if (UTC_OFFSET.test(timeZone)) return Date.parse(`${value}${timeZone}`);
    if (/^[+-]/.test(timeZone)) return NaN;
    const candidates = new Set<number>();
    try {
        // Sample both sides of any nearby transition, including non-hour offsets.
        for (let hours = -36; hours <= 36; hours += 6) {
            const sample = wallTime + hours * HOUR_MS;
            const offset = Date.parse(`${regionalDateInput(sample, timeZone)}Z`) - sample;
            const instant = wallTime - offset;
            if (regionalDateInput(instant, timeZone) === normalized) candidates.add(instant);
        }
    } catch {
        // A partially edited or unsupported zone is invalid, not a browser-zone fallback.
        return NaN;
    }
    return candidates.size === 1 ? Math.min(...candidates) : NaN;
}
