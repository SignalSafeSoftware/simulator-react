import type { SimulatorEmailPayload, SimulatorInboxRow } from '../../types/session.js';
import { AttachmentBehavior, type EmailTemplateContent } from '../../types/template.js';
import type {
    SimulatorDevicePayload,
    SimulatorEmailMessageDetail,
    SimulatorEmailMessageRow,
} from '@signalsafe/simulator-core/devicePayload';
import { optionalString, stringOr } from './mapperValues.js';

function mapAttachmentBehavior(raw: string | undefined): AttachmentBehavior | undefined {
    if (
        raw === AttachmentBehavior.Download ||
        raw === AttachmentBehavior.Open ||
        raw === AttachmentBehavior.MacroPrompt
    )
        return raw;
    return undefined;
}

function mapEmailLinks(raw: unknown): EmailTemplateContent['links'] {
    if (!Array.isArray(raw)) {
        return undefined;
    }
    const links = raw
        .filter((link): link is Record<string, unknown> => link != null && typeof link === 'object')
        .map((link) => ({
            href: stringOr(link.href),
            text: stringOr(link.text),
            ...(typeof link.title === 'string' ? { title: link.title } : {}),
        }))
        .filter((link) => link.href !== '' || link.text !== '');
    return links.length > 0 ? links : undefined;
}

/** Convert email message detail to EmailTemplateContent (session shape). */
function emailDetailToContent(detail: SimulatorEmailMessageDetail): EmailTemplateContent {
    const d = detail;
    const fromAddr = stringOr(d.from, stringOr(d.from_addr));
    return {
        subject: stringOr(detail.subject),
        from: fromAddr,
        body: stringOr(detail.body),
        from_display_name: optionalString(d.from_display_name),
        to: optionalString(d.to),
        cc: optionalString(d.cc),
        date_at: optionalString(d.date_at),
        unread: d.unread,
        bcc: optionalString(detail.bcc),
        reply_to: optionalString(detail.reply_to),
        return_path: optionalString(detail.return_path),
        links: mapEmailLinks(detail.links),
        attachment_name: optionalString(detail.attachment_name),
        attachment_type: optionalString(detail.attachment_type),
        attachment_behavior: mapAttachmentBehavior(optionalString(detail.attachment_behavior)),
    };
}

function toInboxRow(
    row: {
        id?: string;
        subject?: string;
        from?: string;
        from_addr?: string;
        from_display_name?: string;
        snippet?: string;
        date_at?: string;
        unread?: boolean;
    },
    rowFrom: (r: { from?: string; from_addr?: string }) => string,
): SimulatorInboxRow {
    return {
        id: stringOr(row.id),
        subject: stringOr(row.subject),
        from: rowFrom(row),
        from_display_name: optionalString(row.from_display_name),
        snippet: optionalString(row.snippet),
        date_at: optionalString(row.date_at),
        unread: row.unread === true,
        messageIndex: undefined,
    };
}

function getSelectedMessageId(
    detail: { id?: string } | null,
    allRows: SimulatorInboxRow[],
    inbox: SimulatorInboxRow[],
): string | null {
    if (detail != null) {
        return detail.id ?? null;
    }
    return allRows[0]?.id ?? inbox[0]?.id ?? null;
}

/** Map email app section to session email payload. */
export function mapEmail(email: SimulatorDevicePayload['email']): SimulatorEmailPayload | null {
    if (email == null) return null;
    const messages: SimulatorEmailMessageRow[] = email.messages ?? [];
    const detail = email.detail ?? null;
    const rowFrom = (row: { from?: string; from_addr?: string }) =>
        stringOr(row.from, stringOr(row.from_addr));
    const withFolder = messages.map((row) => ({
        row: toInboxRow(row, rowFrom),
        folder_id: typeof row.folder_id === 'string' ? row.folder_id.toLowerCase() : 'inbox',
    }));
    const inFolder = (folder: string): SimulatorInboxRow[] =>
        withFolder.filter((x) => x.folder_id === folder).map((x) => x.row);
    const inbox = inFolder('inbox');
    const outbox = inFolder('outbox');
    const trash = inFolder('trash');
    if (inbox.length === 0 && detail != null) {
        const detailSnippet = detail.snippet;
        inbox.push({
            id: stringOr(detail.id, '0'),
            subject: stringOr(detail.subject),
            from: stringOr(detail.from, stringOr(detail.from_addr)),
            from_display_name: optionalString(detail.from_display_name),
            snippet: typeof detailSnippet === 'string' ? detailSnippet : undefined,
            date_at: optionalString(detail.date_at),
            unread: detail.unread,
        });
    }
    const selectedMessage = detail == null ? null : emailDetailToContent(detail);
    const allRows = [...inbox, ...outbox, ...trash];
    const selectedMessageId = getSelectedMessageId(detail, allRows, inbox);
    return {
        inbox,
        outbox: outbox.length > 0 ? outbox : undefined,
        trash: trash.length > 0 ? trash : undefined,
        selectedMessage,
        selectedMessageId,
    };
}
