import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import {
    formatRegionalDateTime,
    type RegionalPreferences,
} from '../apps/settings/regionalFormats.js';
import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';

type DateTimeFormatter = (date: Date) => string;
interface RegionalPresentation {
    preferences: RegionalPreferences;
    formatDateTime?: DateTimeFormatter;
}
const Context = createContext<RegionalPresentation | null>(null);

/** Hosts supply saved preferences; the package owns display formatting, never persistence. */
export function SimulatorRegionalPresentationProvider({
    value,
    formatDateTime,
    children,
}: Readonly<{
    value: RegionalPreferences;
    formatDateTime?: DateTimeFormatter;
    children: ReactNode;
}>) {
    const presentation = useMemo(
        () => ({ preferences: value, formatDateTime }),
        [value, formatDateTime],
    );
    return <Context.Provider value={presentation}>{children}</Context.Provider>;
}

/** Explicit regional preferences win; the existing locale supplies the standalone fallback. */
export function useRegionalCountry(): string {
    const presentation = useContext(Context);
    const { locale } = useSimulatorLocale();
    return presentation?.preferences.country ?? new Intl.Locale(locale).region ?? 'US';
}

// Only timezone-qualified instants are machine timestamps. Authored labels and local calendar
// strings remain verbatim, and calendar validation rejects dates normalized by Date (e.g. Feb 30).
const ISO_INSTANT =
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
function timestampDate(value: string): Date | null {
    if (!ISO_INSTANT.test(value)) return null;
    const date = new Date(value);
    const calendarDate = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    return calendarDate.toISOString().slice(0, 10) === value.slice(0, 10) ? date : null;
}

/** Shared date presentation used by history and portable device apps. */
export function useRegionalDateTimeFormatter(): DateTimeFormatter {
    const presentation = useContext(Context);
    const locale = useSimulatorLocale();
    return useCallback(
        (date: Date) => {
            if (presentation?.formatDateTime) return presentation.formatDateTime(date);
            if (presentation) return formatRegionalDateTime(date, presentation.preferences);
            return locale.date(date, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
            });
        },
        [presentation, locale],
    );
}

/** Formats valid ISO instants only; human-authored and already formatted timestamps are preserved. */
export function useTimestampFormatter(): (value: string) => string {
    const formatDate = useRegionalDateTimeFormatter();
    return useCallback(
        (value: string) => {
            const date = timestampDate(value);
            return date ? formatDate(date) : value;
        },
        [formatDate],
    );
}
