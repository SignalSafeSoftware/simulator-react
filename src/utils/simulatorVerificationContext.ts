/**
 * Verification context for contacts panel (name/number hints per active app).
 */

import type { SimulatorSessionState } from '../types/session.js';

export type SimulatorVerificationContext = { name?: string; number?: string } | null;

function getMessagesVerificationContext(payload: SimulatorSessionState['payload']): SimulatorVerificationContext {
    const thread = payload.sms?.thread;
    if (thread == null) {
        return null;
    }
    if (thread.sender_display_name || thread.sender_number) {
        return { name: thread.sender_display_name, number: thread.sender_number };
    }
    return null;
}

function getPhoneVerificationContext(payload: SimulatorSessionState['payload']): SimulatorVerificationContext {
    const content = payload.phone?.content;
    if (content == null) {
        return null;
    }
    return {
        name: content.caller_name,
        number: content.phone_number,
    };
}

function getEmailVerificationContext(payload: SimulatorSessionState['payload']): SimulatorVerificationContext {
    if (payload.email?.selectedMessageId && payload.email.inbox?.length) {
        const selectedId = payload.email.selectedMessageId;
        const row = payload.email.inbox.find((item) => item.id === selectedId);
        if (row?.from) {
            return { name: row.from };
        }
    }

    const sender = payload.email?.selectedMessage?.from;
    if (typeof sender === 'string' && sender !== '') {
        return { name: sender };
    }

    return null;
}

export function getVerificationContextForApp(
    activeApp: SimulatorSessionState['view']['activeApp'],
    payload: SimulatorSessionState['payload']
): SimulatorVerificationContext {
    switch (activeApp) {
        case 'messages':
            return getMessagesVerificationContext(payload);
        case 'phone':
            return getPhoneVerificationContext(payload);
        case 'email':
            return getEmailVerificationContext(payload);
        default:
            return null;
    }
}
