import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

/** Heading under a call's details: either who the calls were with, or how many came from the number. */
export default function PhoneHistorySummaryTitle(
    props: Readonly<{ caller: string } | { count: number }>,
) {
    const { t, number, locale } = useSimulatorLocale();
    if ('caller' in props) return <h3>{t('calls.with', { caller: props.caller })}</h3>;
    const form = new Intl.PluralRules(locale).select(props.count) === 'one' ? 'one' : 'other';
    return <h3>{t(`calls.fromNumber.${form}`, { count: number(props.count) })}</h3>;
}
