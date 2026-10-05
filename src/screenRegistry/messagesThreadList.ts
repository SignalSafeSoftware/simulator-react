import type { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
import type { ThreadListRow } from '../views/messages/MessagesThreadListView.js';
import type { SimulatorRenderContext } from './types.js';

type SimulatorTranslator = Pick<ReturnType<typeof useSimulatorLocale>, 't'>;

/** Thread rows for the Messages list: the authored threads, else one row derived from the open thread. */
export function buildMessagesThreadList(
    payload: SimulatorRenderContext['state']['payload'],
    locale: SimulatorTranslator,
): ThreadListRow[] {
    const sms = payload.sms;
    if (sms?.threads != null && sms.threads.length > 0) {
        return sms.threads;
    }
    const thread = sms?.thread;
    if (thread == null) return [];
    const first = thread.messages?.find((m: { text?: string }) => m?.text);
    const preview = getThreadPreview(first?.text, locale);
    return [
        {
            id: '0',
            preview,
            senderName: thread.sender_display_name,
            senderNumber: thread.sender_number,
            timestamp: thread.last_at,
            unread: thread.unread,
        },
    ];
}

function getThreadPreview(text: string | undefined, locale: SimulatorTranslator): string {
    if (typeof text !== 'string') {
        return locale.t('messages.newMessage');
    }
    if (text.length > 60) {
        return `${text.slice(0, 60)}…`;
    }
    return text;
}
