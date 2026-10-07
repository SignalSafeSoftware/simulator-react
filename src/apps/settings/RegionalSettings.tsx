import { useEffect, useRef, useState } from 'react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import {
    SIM_INPUT,
    SimulatorButtonTone,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import {
    RegionalDateFormat,
    RegionalTimeFormat,
    formatRegionalCurrency,
    formatRegionalDateTime,
    isRegionalPreferences,
    regionalLanguages,
    type RegionalPreferences,
} from './regionalFormats.js';

export interface RegionalCountryOption {
    value: string;
    label: string;
}

export interface RegionalSettingsProps {
    value: RegionalPreferences;
    countries: readonly RegionalCountryOption[];
    onSave: (value: RegionalPreferences) => void | Promise<void>;
    savedMessage?: string;
}

const PREVIEW_DATE = new Date('2026-11-23T18:45:00Z');
const PREVIEW_AMOUNT = 1234.56;
const currencies = Intl.supportedValuesOf('currency');
const timeZones = ['UTC', ...Intl.supportedValuesOf('timeZone')];

export default function RegionalSettings({
    value,
    countries,
    onSave,
    savedMessage,
}: Readonly<RegionalSettingsProps>) {
    const { t } = useSimulatorLocale();
    const [settings, setSettings] = useState(value);
    const [saved, setSaved] = useState(false);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const saving = useRef(false);
    useEffect(() => setSettings(value), [value]);
    const valid = isRegionalPreferences(settings);
    const update = (field: keyof RegionalPreferences, nextValue: string) => {
        const next = { ...settings, [field]: nextValue };
        if (isRegionalPreferences(next)) {
            setSettings(next);
            setSaved(false);
            setFailed(false);
        }
    };
    return (
        <form
            className='simulator-settings-section simulator-regional-settings'
            aria-label={t('settings.regional.label')}
            aria-busy={busy}
            onSubmit={async (event) => {
                event.preventDefault();
                if (saving.current || !valid) return;
                saving.current = true;
                setBusy(true);
                setSaved(false);
                setFailed(false);
                try {
                    await onSave(settings);
                    setSaved(true);
                } catch {
                    setFailed(true);
                } finally {
                    saving.current = false;
                    setBusy(false);
                }
            }}
        >
            <h3>{t('settings.regional.heading')}</h3>
            <label>
                {t('settings.regional.country')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.country}
                    onChange={(event) => update('country', event.target.value)}
                >
                    {!countries.some((country) => country.value === settings.country) && (
                        <option value={settings.country}>{settings.country}</option>
                    )}
                    {countries.map((country) => (
                        <option key={country.value} value={country.value}>
                            {country.label}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                {t('settings.regional.language')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.language}
                    onChange={(event) => update('language', event.target.value)}
                >
                    {Object.entries(regionalLanguages).map(([code, name]) => (
                        <option key={code} value={code}>
                            {name}
                        </option>
                    ))}
                </select>
            </label>
            <p>{t('settings.regional.languageHint')}</p>
            <label>
                {t('settings.regional.currency')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.currency}
                    onChange={(event) => update('currency', event.target.value)}
                >
                    {[...new Set([settings.currency, ...currencies])].map((currency) => (
                        <option key={currency}>{currency}</option>
                    ))}
                </select>
            </label>
            <label>
                {t('settings.regional.dateFormat')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.dateFormat}
                    onChange={(event) => update('dateFormat', event.target.value)}
                >
                    <option value={RegionalDateFormat.Locale}>
                        {t('settings.regional.dateLocale')}
                    </option>
                    <option value={RegionalDateFormat.MonthDayYear}>MM/DD/YYYY</option>
                    <option value={RegionalDateFormat.DayMonthYear}>DD/MM/YYYY</option>
                    <option value={RegionalDateFormat.YearMonthDay}>YYYY-MM-DD</option>
                </select>
            </label>
            <label>
                {t('settings.regional.timeFormat')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.timeFormat}
                    onChange={(event) => update('timeFormat', event.target.value)}
                >
                    <option value={RegionalTimeFormat.TwelveHour}>
                        {t('settings.regional.time12')}
                    </option>
                    <option value={RegionalTimeFormat.TwentyFourHour}>
                        {t('settings.regional.time24')}
                    </option>
                </select>
            </label>
            <label>
                {t('settings.regional.timeZone')}
                <select
                    className={SIM_INPUT}
                    disabled={busy}
                    value={settings.timeZone}
                    onChange={(event) => update('timeZone', event.target.value)}
                >
                    {[...new Set([settings.timeZone, ...timeZones])].map((zone) => (
                        <option key={zone}>{zone}</option>
                    ))}
                </select>
            </label>
            {valid ? (
                <p>
                    {t('settings.regional.preview', {
                        date: formatRegionalDateTime(PREVIEW_DATE, settings),
                        currency: formatRegionalCurrency(PREVIEW_AMOUNT, settings),
                    })}
                </p>
            ) : (
                <p role='alert'>{t('settings.regional.invalid')}</p>
            )}
            <button
                className={simBtnToneClass(SimulatorButtonTone.Primary)}
                type='submit'
                disabled={busy || !valid}
            >
                {t(busy ? 'settings.regional.saving' : 'settings.regional.save')}
            </button>
            {saved && <output>{savedMessage ?? t('settings.regional.saved')}</output>}
            {failed && <p role='alert'>{t('settings.regional.failed')}</p>}
        </form>
    );
}
