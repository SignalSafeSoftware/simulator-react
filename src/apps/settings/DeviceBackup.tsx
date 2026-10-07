import { useEffect, useRef, useState } from 'react';
import {
    emptySimulatorStore,
    MAX_BACKUP_BYTES,
    simulatorStoreSchema,
    type SimulatorStore,
} from '@signalsafe/simulator-core/apps/contracts';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { SIM_BTN_OUTLINE, SIM_INPUT } from '../../ui/styles/simulatorClasses.js';
import { downloadJsonFile } from '../../utils/browser/browserEnvironment.js';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { parseBackup } from './parseBackup.js';

/** The host owns persistence; this section owns validated preview, confirmation and export. */
export default function DeviceBackup({ store }: Readonly<{ store: DeviceStore }>) {
    const { t } = useSimulatorLocale();
    const { confirm } = useSimulatorAppsHost();
    const [preview, setPreview] = useState<SimulatorStore | null>(null);
    const [message, setMessage] = useState('');
    const [reading, setReading] = useState(false);
    const [working, setWorking] = useState(false);
    const [identity, setIdentity] = useState(
        store.data?.identity ?? emptySimulatorStore().identity,
    );
    const readGeneration = useRef(0);
    const active = useRef(true);
    const inFlight = useRef(false);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
            readGeneration.current += 1;
        };
    }, []);
    const disabled = store.busy || working || !store.data;
    const cancelPreview = () => {
        readGeneration.current += 1;
        setReading(false);
        setPreview(null);
        setMessage('');
    };
    async function run(work: () => Promise<void>) {
        if (inFlight.current || store.busy || !store.data) return;
        inFlight.current = true;
        setWorking(true);
        setMessage('');
        try {
            await work();
        } catch {
            if (active.current) setMessage(t('app.backup.operationFailed'));
        } finally {
            inFlight.current = false;
            if (active.current) setWorking(false);
        }
    }
    return (
        <section className='simulator-settings-section' aria-label={t('app.backup.title')}>
            <h3>{t('app.backup.title')}</h3>
            <p>{t('app.backup.notice')}</p>
            <label>
                {t('app.backup.identity')}
                <input
                    className={SIM_INPUT}
                    type='email'
                    disabled={disabled}
                    value={identity}
                    onChange={(event) => setIdentity(event.target.value)}
                />
            </label>
            <button
                className={SIM_BTN_OUTLINE}
                type='button'
                disabled={disabled}
                onClick={() =>
                    void run(async () => {
                        if (!simulatorStoreSchema.shape.identity.safeParse(identity).success) {
                            setMessage(t('app.backup.identityInvalid'));
                            return;
                        }
                        if (
                            store.data &&
                            (await store.save({ ...store.data, identity })) &&
                            active.current
                        )
                            setMessage(t('app.backup.identitySaved'));
                    })
                }
            >
                {t('app.backup.saveIdentity')}
            </button>
            <button
                className={SIM_BTN_OUTLINE}
                type='button'
                disabled={disabled}
                onClick={() =>
                    void run(async () => {
                        const backup = await store.exportBackup();
                        if (active.current)
                            downloadJsonFile(
                                JSON.stringify({ ...backup, lock: null }),
                                'simulator-backup.json',
                            );
                    })
                }
            >
                {t('app.backup.download')}
            </button>
            <label>
                {t('app.backup.preview')}
                <input
                    className={SIM_INPUT}
                    type='file'
                    disabled={disabled}
                    accept='application/json,.json'
                    onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        const generation = ++readGeneration.current;
                        setPreview(null);
                        setMessage('');
                        setReading(Boolean(file));
                        if (!file) return;
                        try {
                            if (file.size > MAX_BACKUP_BYTES) {
                                setMessage(t('app.backup.invalid'));
                                return;
                            }
                            const contents = await file.text();
                            if (generation !== readGeneration.current) return;
                            setPreview(parseBackup(contents));
                        } catch {
                            if (generation === readGeneration.current)
                                setMessage(t('app.backup.invalid'));
                        } finally {
                            if (generation === readGeneration.current) setReading(false);
                        }
                    }}
                />
            </label>
            {reading && (
                <div className='simulator-settings-section__group'>
                    <output>{t('app.backup.reading')}</output>
                    <button className={SIM_BTN_OUTLINE} type='button' onClick={cancelPreview}>
                        {t('app.backup.cancelPreview')}
                    </button>
                </div>
            )}
            {preview && (
                <div className='simulator-settings-section__group'>
                    <p>
                        {t('app.backup.summary', {
                            secrets: preview.secrets.length,
                            photos: preview.photos.length,
                            messages: preview.mail.length,
                        })}
                    </p>
                    <button
                        className={SIM_BTN_OUTLINE}
                        type='button'
                        disabled={disabled}
                        onClick={() =>
                            void run(async () => {
                                if (
                                    store.data &&
                                    confirm(t('app.backup.restoreConfirm')) &&
                                    (await store.restore({ ...preview, lock: store.data.lock })) &&
                                    active.current
                                ) {
                                    setIdentity(preview.identity);
                                    setPreview(null);
                                }
                            })
                        }
                    >
                        {t('app.backup.restore')}
                    </button>
                    <button
                        className={SIM_BTN_OUTLINE}
                        type='button'
                        disabled={disabled}
                        onClick={cancelPreview}
                    >
                        {t('app.backup.cancelRestore')}
                    </button>
                </div>
            )}
            <button
                className={SIM_BTN_OUTLINE}
                type='button'
                disabled={disabled || reading}
                onClick={() =>
                    void run(async () => {
                        if (
                            store.data &&
                            confirm(t('app.backup.resetConfirm')) &&
                            (await store.restore({
                                ...emptySimulatorStore(),
                                lock: store.data.lock,
                            })) &&
                            active.current
                        ) {
                            setPreview(null);
                            setIdentity(emptySimulatorStore().identity);
                            setMessage(t('app.backup.resetDone'));
                        }
                    })
                }
            >
                {t('app.backup.reset')}
            </button>
            {message && <output>{message}</output>}
        </section>
    );
}
