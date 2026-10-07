import { useEffect, useMemo, useState } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { currentTimeMs } from '../../utils/browser/browserEnvironment.js';

const CLOCK_REFRESH_MS = 1000;

export interface HomeClockOptions {
    locale?: string;
    timeZone?: string;
    hour12?: boolean;
}

/** Shared live Home clock; hosts supply regional preferences, not presentation. */
export default function HomeClock(options: Readonly<HomeClockOptions>) {
    const regional = useSimulatorLocale();
    const locale = options.locale ?? regional.locale;
    const timeZone = options.timeZone ?? regional.timeZone;
    const { hour12 } = options;
    const [now, setNow] = useState(currentTimeMs);
    useEffect(() => {
        const timer = setInterval(() => setNow(currentTimeMs()), CLOCK_REFRESH_MS);
        return () => clearInterval(timer);
    }, []);
    const dateFormat = useMemo(
        () => new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone }),
        [locale, timeZone],
    );
    const timeFormat = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12,
                timeZone,
            }),
        [locale, timeZone, hour12],
    );
    return (
        <time className='prototype-home-clock' dateTime={new Date(now).toISOString()}>
            <span>{dateFormat.format(now)}</span>
            <strong>{timeFormat.format(now)}</strong>
        </time>
    );
}
