import {
    SIM_INPUT,
    SIM_VISUALLY_HIDDEN,
    SIM_BTN_OUTLINE,
} from '../../ui/styles/simulatorClasses.js';
import { FieldInputType } from '../../utils/payload/browserFieldType.js';
import { SIM_APP_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import { DevicePage } from '../shared/DevicePage.js';
import { useState } from 'react';
import { useLockChange } from './useLockChange.js';
import {} from '../../hooks/useLatestRequest.js';
import { LockKeyhole } from 'lucide-react';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import type {} from '@signalsafe/simulator-core/apps/deviceData';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
export function LockScreen({
    store,
    onUnlock,
}: Readonly<{ store: DeviceStore; onUnlock: () => void }>) {
    const { checkLock } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    return (
        <DevicePage title={t('app.lock.title')}>
            <LockKeyhole size={48} aria-hidden='true' />
            <form
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (!store.data || busy) return;
                    setBusy(true);
                    try {
                        if (await checkLock(password, store.data.lock)) {
                            setPassword('');
                            onUnlock();
                        } else setError(t('app.lock.incorrect'));
                    } catch {
                        setError(t('app.lock.unavailable'));
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                <label>
                    {t('app.lock.password')}
                    <input
                        className={SIM_INPUT}
                        type={FieldInputType.Password}
                        autoComplete='current-password'
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>
                <button type='submit' className={SIM_BTN_OUTLINE} disabled={busy}>
                    {t('app.lock.unlock')}
                </button>
            </form>
            {error && <p role='alert'>{error}</p>}
            <p>{t('app.lock.recovery')}</p>
        </DevicePage>
    );
}
function LockSettingsActions({
    disabled,
    hasLock,
    onCancel,
    onRemove,
    onLock,
}: Readonly<{
    disabled: boolean;
    hasLock: boolean;
    onCancel: () => void;
    onRemove: () => void;
    onLock: () => void;
}>) {
    const { t } = useSimulatorLocale();
    const tone = SIM_BTN_OUTLINE;
    return (
        <div className='prototype-actions'>
            <button type='submit' className={tone} disabled={disabled}>
                {t('app.lock.save')}
            </button>
            <button className={tone} type='button' disabled={disabled} onClick={onCancel}>
                {t('action.cancel')}
            </button>
            {hasLock && (
                <>
                    <button className={tone} type='button' disabled={disabled} onClick={onRemove}>
                        {t('app.lock.remove')}
                    </button>
                    <button className={tone} type='button' disabled={disabled} onClick={onLock}>
                        {t('app.lock.now')}
                    </button>
                </>
            )}
        </div>
    );
}
export function LockSettings({
    store,
    onLock,
}: Readonly<{ store: DeviceStore; onLock: () => void }>) {
    const { t } = useSimulatorLocale();
    const {
        current,
        setCurrent,
        password,
        setPassword,
        confirm,
        setConfirm,
        message,
        setMessage,
        busy,
        apply,
        clearFields,
    } = useLockChange(store);
    const disabled = busy || store.busy;
    return (
        <section className={SIM_APP_PAGE_CONTENT}>
            <h3>{t('app.lock.password')}</h3>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void apply(false);
                }}
            >
                <fieldset disabled={disabled}>
                    <legend className={SIM_VISUALLY_HIDDEN}>{t('app.lock.settings')}</legend>
                    {store.data?.lock && (
                        <label>
                            {t('app.lock.current')}
                            <input
                                className={SIM_INPUT}
                                type={FieldInputType.Password}
                                autoComplete='current-password'
                                value={current}
                                onChange={(event) => setCurrent(event.target.value)}
                            />
                        </label>
                    )}
                    <label>
                        {t('app.lock.new')}
                        <input
                            className={SIM_INPUT}
                            type={FieldInputType.Password}
                            autoComplete='new-password'
                            minLength={4}
                            maxLength={128}
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>
                    <label>
                        {t('app.lock.confirm')}
                        <input
                            className={SIM_INPUT}
                            type={FieldInputType.Password}
                            autoComplete='new-password'
                            required
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                        />
                    </label>
                    <LockSettingsActions
                        disabled={disabled}
                        hasLock={Boolean(store.data?.lock)}
                        onCancel={() => {
                            clearFields();
                            setMessage('');
                        }}
                        onRemove={() => void apply(true)}
                        onLock={onLock}
                    />
                </fieldset>
            </form>
            {busy && <output>{t('app.lock.saving')}</output>}
            {message && <output>{message}</output>}
            <p>{t('app.lock.settingsNotice')}</p>
        </section>
    );
}
