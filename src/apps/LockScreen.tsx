import { DevicePage } from './DevicePage.js';
import { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import type { DeviceStore } from '@signalsafe/simulator-core';
import { useSimulatorAppsHost } from './host.js';
export function LockScreen({ store, onUnlock }: { store: DeviceStore; onUnlock: () => void }) {
    const { checkLock } = useSimulatorAppsHost();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    return (
        <DevicePage title="Device locked">
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
                        } else setError('Incorrect screen password.');
                    } catch {
                        setError('Unlock is unavailable. Try again.');
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                <label>
                    Screen password
                    <input
                        className="simulator-input"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                </label>
                <button className="simulator-btn simulator-btn--neutral-outline" disabled={busy}>
                    Unlock
                </button>
            </form>
            {error && <p role="alert">{error}</p>}
            <p>
                This locks the simulated device. To recover a forgotten password, clear the
                simulated records using your host application's recovery controls. Keep a simulator
                backup first.
            </p>
        </DevicePage>
    );
}
export function LockSettings({ store, onLock }: { store: DeviceStore; onLock: () => void }) {
    const { checkLock, createLock } = useSimulatorAppsHost();
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
    async function apply(remove: boolean) {
        if (!store.data || store.busy || saving.current) return;
        saving.current = true;
        const request = ++generation.current;
        setBusy(true);
        setMessage('');
        try {
            if (!(await checkLock(current, store.data.lock)))
                throw new Error('Incorrect current screen password.');
            if (!remove && password !== confirm) throw new Error('The new passwords do not match.');
            const lock = remove ? null : await createLock(password);
            if (request !== generation.current) return;
            if (await store.save({ ...store.data, lock })) {
                if (request !== generation.current) return;
                setCurrent('');
                setPassword('');
                setConfirm('');
                setMessage(remove ? 'Screen password removed.' : 'Screen password saved.');
            }
        } catch (reason) {
            if (request !== generation.current) return;
            setMessage(reason instanceof Error ? reason.message : 'Password could not be changed.');
        } finally {
            saving.current = false;
            if (request === generation.current) setBusy(false);
        }
    }
    return (
        <section className="prototype-page">
            <h3>Screen password</h3>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    void apply(false);
                }}
            >
                <fieldset disabled={busy || store.busy}>
                    <legend className="simulator-visually-hidden">Screen password settings</legend>
                    {store.data?.lock && (
                        <label>
                            Current password
                            <input
                                className="simulator-input"
                                type="password"
                                autoComplete="current-password"
                                value={current}
                                onChange={(event) => setCurrent(event.target.value)}
                            />
                        </label>
                    )}
                    <label>
                        New password
                        <input
                            className="simulator-input"
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
                        Confirm password
                        <input
                            className="simulator-input"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                        />
                    </label>
                    <div className="prototype-actions">
                        <button
                            className="simulator-btn simulator-btn--neutral-outline"
                            disabled={busy || store.busy}
                        >
                            Save screen password
                        </button>
                        <button
                            className="simulator-btn simulator-btn--neutral-outline"
                            type="button"
                            disabled={busy || store.busy}
                            onClick={() => {
                                setCurrent('');
                                setPassword('');
                                setConfirm('');
                                setMessage('');
                            }}
                        >
                            Cancel
                        </button>
                        {store.data?.lock && (
                            <>
                                <button
                                    className="simulator-btn simulator-btn--neutral-outline"
                                    type="button"
                                    disabled={busy || store.busy}
                                    onClick={() => void apply(true)}
                                >
                                    Remove password
                                </button>
                                <button
                                    className="simulator-btn simulator-btn--neutral-outline"
                                    type="button"
                                    disabled={busy || store.busy}
                                    onClick={onLock}
                                >
                                    Lock now
                                </button>
                            </>
                        )}
                    </div>
                </fieldset>
            </form>
            {busy && <output>Saving screen password…</output>}
            {message && <output>{message}</output>}
            <p>
                Saving or changing the password locks the device immediately. It locks again on
                reload. This is a simulated screen lock, not application authentication.
            </p>
        </section>
    );
}
