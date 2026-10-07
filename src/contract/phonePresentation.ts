import { createContext, useCallback, useContext } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useRegionalCountry } from './regionalPresentation.js';

/** Display-only formatting. Never use its result for dialing, matching or persistence. */
export type PhoneNumberFormatter = (original: string) => string;

/** Preserve explicit country codes, unknown addresses and extensions; never infer a dialable number. */
export function formatPhoneNumber(value: string, country = 'US'): string {
    if (value.trim().startsWith('+')) {
        const parsed = parsePhoneNumberFromString(value, { extract: false });
        if (!parsed?.isPossible() || parsed.ext) return value;
        return parsed.country === country ? parsed.formatNational() : parsed.formatInternational();
    }
    const match =
        /^(?:(\+?1)[ .-]?)?(?:\(([2-9]\d{2})\)|([2-9]\d{2}))[ .-]?([2-9]\d{2})[ .-]?(\d{4})$/.exec(
            value.trim(),
        );
    if (!match) return value;
    const [, , parenthesizedArea, area, exchange, subscriber] = match;
    return `(${parenthesizedArea ?? area}) ${exchange}-${subscriber}`;
}

/** A host-supplied formatter overrides regional defaults, including through nested regional providers. */
export const PhoneNumberFormatContext = createContext<PhoneNumberFormatter | null>(null);
export function usePhoneNumberFormatter(): PhoneNumberFormatter {
    const override = useContext(PhoneNumberFormatContext);
    const country = useRegionalCountry();
    const format = useCallback((value: string) => formatPhoneNumber(value, country), [country]);
    return override ?? format;
}
