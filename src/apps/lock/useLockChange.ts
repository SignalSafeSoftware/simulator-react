import { useRef, useState } from 'react';
import { useLatestRequest } from '../../hooks/useLatestRequest.js';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import type { DeviceMetadata } from '@signalsafe/simulator-core/apps/deviceData';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export function useLockChange(store: DeviceStore) {
    const { checkLock, createLock } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const latest = useLatestRequest();
    const saving = useRef(false);
    function clearFields() {
        setCurrent('');
        setPassword('');
        setConfirm('');
    }
    async function change(data: DeviceMetadata, remove: boolean, isLatest: () => boolean) {
        if (!(await checkLock(current, data.lock))) throw new Error(t('app.lock.currentIncorrect'));
        if (!remove && password !== confirm) throw new Error(t('app.lock.mismatch'));
        const lock = remove ? null : await createLock(password);
        return isLatest() && (await store.save({ ...data, lock })) && isLatest();
    }
    async function apply(remove: boolean) {
        const data = store.data;
        if (!data || store.busy || saving.current) return;
        saving.current = true;
        const isLatest = latest.begin();
        setBusy(true);
        setMessage('');
        try {
            if (await change(data, remove, isLatest)) {
                clearFields();
                setMessage(remove ? t('app.lock.removed') : t('app.lock.saved'));
            }
        } catch (reason) {
            if (isLatest())
                setMessage(reason instanceof Error ? reason.message : t('app.lock.changeFailed'));
        } finally {
            saving.current = false;
            if (isLatest()) setBusy(false);
        }
    }
    return {
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
    };
}
