import {
    SIM_INPUT,
    SIM_VISUALLY_HIDDEN,
    SimulatorButtonTone,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import { SIM_APP_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import { DevicePage } from '../shared/DevicePage.js';
import { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
export function LockScreen({ store, onUnlock }: { store: DeviceStore; onUnlock: () => void }) {
    const { checkLock } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    return (
        <DevicePage title={t('app.lock.title')}>
            <LockKeyhole size={48} aria-hidden="true" />
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
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>
                <button
                    type="submit"
                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                    disabled={busy}
                >
                    {t('app.lock.unlock')}
                </button>
            </form>
            {error && <p role="alert">{error}</p>}
            <p>{t('app.lock.recovery')}</p>
        </DevicePage>
    );
}
export function LockSettings({ store, onLock }: { store: DeviceStore; onLock: () => void }) {
    const { checkLock, createLock } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const generation = useRef(0);
    const saving = useRef(false);
    useEffect(
        () => () => {
            generation.current += 1;
        },
        [],
    );
    function clearFields() {
        setCurrent('');
        setPassword('');
        setConfirm('');
    }
    async function apply(remove: boolean) {
        if (!store.data || store.busy || saving.current) return;
        saving.current = true;
        const request = ++generation.current;
        setBusy(true);
        setMessage('');
        try {
            if (!(await checkLock(current, store.data.lock)))
                throw new Error(t('app.lock.currentIncorrect'));
            if (!remove && password !== confirm) throw new Error(t('app.lock.mismatch'));
            const lock = remove ? null : await createLock(password);
            if (request !== generation.current) return;
            if (await store.save({ ...store.data, lock })) {
                if (request !== generation.current) return;
                clearFields();
                setMessage(remove ? t('app.lock.removed') : t('app.lock.saved'));
            }
        } catch (reason) {
            if (request !== generation.current) return;
            setMessage(reason instanceof Error ? reason.message : t('app.lock.changeFailed'));
        } finally {
            saving.current = false;
            if (request === generation.current) setBusy(false);
        }
    }
    return (
        <section className={SIM_APP_PAGE_CONTENT}>
            <h3>{t('app.lock.password')}</h3>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void apply(false);
                }}
            >
                <fieldset disabled={busy || store.busy}>
                    <legend className={SIM_VISUALLY_HIDDEN}>{t('app.lock.settings')}</legend>
                    {store.data?.lock && (
                        <label>
                            {t('app.lock.current')}
                            <input
                                className={SIM_INPUT}
                                type="password"
                                autoComplete="current-password"
                                value={current}
                                onChange={(event) => setCurrent(event.target.value)}
                            />
                        </label>
                    )}
                    <label>
                        {t('app.lock.new')}
                        <input
                            className={SIM_INPUT}
                            type="password"
                            autoComplete="new-password"
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
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                        />
                    </label>
                    <div className="prototype-actions">
                        <button
                            type="submit"
                            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                            disabled={busy || store.busy}
                        >
                            {t('app.lock.save')}
                        </button>
                        <button
                            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                            type="button"
                            disabled={busy || store.busy}
                            onClick={() => {
                                clearFields();
                                setMessage('');
                            }}
                        >
                            {t('action.cancel')}
                        </button>
                        {store.data?.lock && (
                            <>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    disabled={busy || store.busy}
                                    onClick={() => void apply(true)}
                                >
                                    {t('app.lock.remove')}
                                </button>
                                <button
                                    className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                                    type="button"
                                    disabled={busy || store.busy}
                                    onClick={onLock}
                                >
                                    {t('app.lock.now')}
                                </button>
                            </>
                        )}
                    </div>
                </fieldset>
            </form>
            {busy && <output>{t('app.lock.saving')}</output>}
            {message && <output>{message}</output>}
            <p>{t('app.lock.settingsNotice')}</p>
        </section>
    );
}
