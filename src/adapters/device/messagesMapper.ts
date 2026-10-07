import {
    MessageSender,
    type SimulatorSmsPayload,
    type SimulatorThreadListRow,
} from '../../types/session.js';
import type { SimulatorDevicePayload } from '@signalsafe/simulator-core/devicePayload';
import { optionalString, stringOr } from './mapperValues.js';

/** Map messages (SMS) app section to session sms payload. */
export function mapMessages(
    messages: SimulatorDevicePayload['messages'],
): SimulatorSmsPayload | null {
    if (messages == null) return null;
    const threadDetail = messages.thread_detail;
    const rawThreads = messages.threads;
    const threads: SimulatorThreadListRow[] = Array.isArray(rawThreads)
        ? rawThreads
              .filter((t) => t != null && typeof t === 'object')
              .map((r) => ({
                  id: stringOr(r.id),
                  preview: stringOr(r.snippet),
                  senderName: optionalString(r.contact_name),
                  senderNumber: optionalString(r.contact_number),
                  timestamp: optionalString(r.last_at),
                  unread: r.unread === true,
              }))
        : [];

    const fromRole = (m: { from?: string }) =>
        m.from === MessageSender.Me ? MessageSender.Me : MessageSender.Them;
    return {
        thread: {
            id: optionalString(threadDetail?.id),
            messages: (threadDetail?.messages ?? []).map((m) => ({
                ...(m.id === undefined ? {} : { id: m.id }),
                from: fromRole(m),
                text: stringOr(m.text),
                delay_seconds: m.delay_seconds,
                timestamp: optionalString(m.timestamp),
                attachment:
                    m.attachment != null &&
                    typeof m.attachment === 'object' &&
                    typeof m.attachment.label === 'string'
                        ? {
                              label: m.attachment.label,
                              url: optionalString(m.attachment.url),
                          }
                        : undefined,
            })),
            sender_display_name: optionalString(threadDetail?.sender_display_name),
            sender_number: optionalString(threadDetail?.sender_number),
            last_at: optionalString(threadDetail?.last_at),
            unread: threadDetail?.unread === true,
        },
        visibleMessageCount: 0,
        threads: threads.length > 0 ? threads : undefined,
    };
}
