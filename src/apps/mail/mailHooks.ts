import { useRef, useState } from 'react';
import type { DeviceStore } from '@signalsafe/simulator-core/apps/store';
import { mailSchema, type Mail } from '@signalsafe/simulator-core/apps/contracts';
import { newMail, replyMail } from '@signalsafe/simulator-core/apps/mail';
import type { SimulatorEmailService } from '@signalsafe/simulator-core/apps/emailService';
import { useSimulatorAppsHost } from '../shared/SimulatorAppsHost.js';
import { useDraftBaseline } from '../shared/useDraftBaseline.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { MailFolder, ReplyKind } from './mailShared.js';

const MAX_ATTACHMENTS = 20;

export function useMailPersist(store: DeviceStore) {
    const { t } = useSimulatorLocale();
    const [error, setError] = useState('');
    async function persist(next: Mail, edited = false): Promise<boolean> {
        const parsed = mailSchema.safeParse({
            ...next,
            updatedAt: edited ? new Date().toISOString() : next.updatedAt,
        });
        if (!parsed.success) {
            setError(t('app.mail.limits'));
            return false;
        }
        return store.put('mail', parsed.data);
    }
    return { error, setError, persist };
}

export function useMailNav(onBack: () => void) {
    const [source, setSource] = useState<string | null>(null);
    const [folder, setFolder] = useState<MailFolder | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    function closeTo(next: MailFolder) {
        setSource(null);
        setSelected(null);
        setFolder(next);
    }
    function openFolder(next: MailFolder) {
        setFolder(next);
        setQuery('');
    }
    function back() {
        if (source) setSource(null);
        else if (selected) setSelected(null);
        else if (folder) {
            setFolder(null);
            setQuery('');
        } else onBack();
    }
    return {
        source,
        setSource,
        folder,
        selected,
        setSelected,
        query,
        setQuery,
        closeTo,
        openFolder,
        back,
    };
}

export function useMailDraft({
    identity,
    storeBusy,
    emailService,
    setError,
    persist,
    onSaved,
}: Readonly<{
    identity: string;
    storeBusy: boolean;
    emailService: SimulatorEmailService;
    setError: (message: string) => void;
    persist: (next: Mail, edited?: boolean) => Promise<boolean>;
    onSaved: (folder: MailFolder) => void;
}>) {
    const { readAsset } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const [draft, setDraft] = useState<Mail | null>(null);
    const { setBaseline, confirmDiscard } = useDraftBaseline(draft);
    const formRef = useRef<HTMLFormElement>(null);
    const [reading, setReading] = useState(false);
    const [sending, setSending] = useState(false);
    const busy = storeBusy || reading || sending;

    function edit(next: Mail) {
        setBaseline(next);
        setDraft(next);
        setError('');
    }
    function compose(source?: Mail, kind: ReplyKind = 'reply') {
        setError('');
        edit(source ? replyMail(source, identity, kind) : newMail(identity));
    }
    function leave() {
        if (confirmDiscard(t('app.mail.discardConfirm'))) setDraft(null);
    }
    async function commit(next: Mail, edited: boolean) {
        if (!(await persist(next, edited))) return;
        setDraft(null);
        onSaved(next.folder);
    }
    async function send(current: Mail) {
        if (busy) return;
        setSending(true);
        setError('');
        try {
            await commit(await emailService.send(current), false);
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t('app.mail.sendFailed'));
        } finally {
            setSending(false);
        }
    }
    async function attach(current: Mail, file: File) {
        if (current.attachments.length >= MAX_ATTACHMENTS) {
            setError(t('app.mail.attachmentLimit'));
            return;
        }
        setReading(true);
        try {
            const asset = await readAsset(file);
            setDraft((previous) =>
                previous?.id === current.id
                    ? { ...previous, attachments: [...previous.attachments, asset] }
                    : previous,
            );
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : t('app.mail.attachmentFailed'));
        } finally {
            setReading(false);
        }
    }
    return {
        draft,
        setDraft,
        busy,
        formRef,
        edit,
        compose,
        leave,
        send,
        attach,
        save: (current: Mail) => commit(current, true),
    };
}
