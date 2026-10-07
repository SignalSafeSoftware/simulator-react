/** Formatting preferences are presentation data; hosts own persistence and defaults. */
export const RegionalDateFormat = Object.freeze({
    Locale: 'locale',
    MonthDayYear: 'mdy',
    DayMonthYear: 'dmy',
    YearMonthDay: 'ymd',
} as const);
export type RegionalDateFormat = (typeof RegionalDateFormat)[keyof typeof RegionalDateFormat];

export const RegionalTimeFormat = Object.freeze({
    TwelveHour: '12',
    TwentyFourHour: '24',
} as const);
export type RegionalTimeFormat = (typeof RegionalTimeFormat)[keyof typeof RegionalTimeFormat];

export const regionalLanguages = Object.freeze({
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ja: '日本語',
    zh: '中文',
    ar: 'العربية',
});

export interface RegionalPreferences {
    country: string;
    language: keyof typeof regionalLanguages;
    currency: string;
    dateFormat: RegionalDateFormat;
    timeFormat: RegionalTimeFormat;
    timeZone: string;
}

/** Validate saved preferences before invoking Intl or accepting a form update. */
export function isRegionalPreferences(value: unknown): value is RegionalPreferences {
    if (typeof value !== 'object' || value === null) return false;
    if (
        !('country' in value) ||
        typeof value.country !== 'string' ||
        !/^[A-Z]{2}$/.test(value.country)
    )
        return false;
    if (
        !('language' in value) ||
        typeof value.language !== 'string' ||
        !Object.hasOwn(regionalLanguages, value.language)
    )
        return false;
    if (
        !('currency' in value) ||
        typeof value.currency !== 'string' ||
        !/^[A-Z]{3}$/.test(value.currency)
    )
        return false;
    if (
        !('dateFormat' in value) ||
        !Object.values(RegionalDateFormat).some((format) => format === value.dateFormat)
    )
        return false;
    if (
        !('timeFormat' in value) ||
        !Object.values(RegionalTimeFormat).some((format) => format === value.timeFormat)
    )
        return false;
    if (!('timeZone' in value) || typeof value.timeZone !== 'string') return false;
    try {
        new Intl.DateTimeFormat(`${value.language}-${value.country}`, { timeZone: value.timeZone });
        return true;
    } catch {
        return false;
    }
}

export function regionalLocale(settings: RegionalPreferences): string {
    return `${settings.language}-${settings.country}`;
}

export function formatRegionalDate(value: Date, settings: RegionalPreferences): string {
    if (settings.dateFormat === RegionalDateFormat.Locale) {
        return new Intl.DateTimeFormat(regionalLocale(settings), {
            timeZone: settings.timeZone,
        }).format(value);
    }
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(value);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value ?? '';
    const month = part('month');
    const day = part('day');
    const year = part('year');
    switch (settings.dateFormat) {
        case RegionalDateFormat.MonthDayYear:
            return `${month}/${day}/${year}`;
        case RegionalDateFormat.DayMonthYear:
            return `${day}/${month}/${year}`;
        case RegionalDateFormat.YearMonthDay:
            return `${year}-${month}-${day}`;
    }
}

export function formatRegionalDateTime(value: Date, settings: RegionalPreferences): string {
    const time = new Intl.DateTimeFormat(regionalLocale(settings), {
        timeZone: settings.timeZone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: settings.timeFormat === RegionalTimeFormat.TwelveHour ? 'h12' : 'h23',
    }).format(value);
    return `${formatRegionalDate(value, settings)}, ${time}`;
}

export function formatRegionalCurrency(value: number, settings: RegionalPreferences): string {
    return new Intl.NumberFormat(regionalLocale(settings), {
        style: 'currency',
        currency: settings.currency,
    }).format(value);
}
