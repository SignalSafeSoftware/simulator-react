/**
 * Maps full-device payload (simulator) sections to unified session slice types.
 * Small helpers per app/domain; strict types, no any.
 */

import type {
    SimulatorChannel,
    SimulatorInboxRow,
    SimulatorEmailPayload,
    SimulatorSmsPayload,
    SimulatorThreadListRow,
    SimulatorBrowserPayload,
    SimulatorBrowserPage,
    SimulatorPhonePayload,
    SimulatorCallHistoryEntry,
    CallHistoryEntryKind,
    SimulatorSessionDevice,
    SimulatorSessionContact,
    SimulatorDirectoryEntry,
    SimulatorHomePayload,
    SimulatorHomeWidget,
    SimulatorHomeStoreApp,
    SimulatorHomeSettingsSection,
} from '../types/session';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../constants';
import type {
    AttachmentBehavior,
    EmailTemplateContent,
    SimulatorApp,
    SimulatorContact,
    SimulatorDevicePayload,
    SimulatorEmailMessageRow,
    SimulatorEmailMessageDetail,
} from '../types/portableSimulator';

function stringOr(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function nullableString(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

/** Map backend app id to shell channel (messages→sms, internet→browser). */
export function appToChannel(app: SimulatorApp): SimulatorChannel {
    switch (app) {
        case 'messages':
            return 'sms';
        case 'internet':
            return 'browser';
        case 'phone':
        case 'email':
        case 'home':
            return app;
        default:
            return 'email';
    }
}

/** Map device section to session device (main menu + secondary defaults). */
export function mapDevice(device: SimulatorDevicePayload['device']): SimulatorSessionDevice | null {
    if (device == null || !Array.isArray(device.main_menu_items)) {
        return null;
    }
    const mainMenuItems = device.main_menu_items.filter(
        (item): item is NonNullable<typeof item> => item != null && typeof item === 'object' && typeof item.id === 'string'
    ).map((item) => ({
        ...item,
        id: stringOr(item.id),
        label: stringOr((item as { label?: unknown }).label, stringOr(item.id)),
        app: typeof item.app === 'string' ? item.app : undefined,
    }));
    if (mainMenuItems.length === 0) {
        return null;
    }
    return {
        mainMenuItems,
        secondaryDefaults: device.secondary_defaults ?? {},
    };
}

/** Map directory (official/trusted sources) to session directory entries. */
function mapDirectoryEntry(raw: unknown): SimulatorDirectoryEntry | null {
    if (raw == null || typeof raw !== 'object') {
        return null;
    }
    const o = raw as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : undefined;
    const label = typeof o.label === 'string' ? o.label : undefined;
    if (id == null || label == null) {
        return null;
    }
    return {
        id,
        label,
        contact_id: typeof o.contact_id === 'string' ? o.contact_id : null,
        number: typeof o.number === 'string' ? o.number : null,
        url: typeof o.url === 'string' ? o.url : null,
        description: typeof o.description === 'string' ? o.description : null,
    };
}

export function mapDirectory(directory: unknown): SimulatorDirectoryEntry[] | null {
    if (directory == null || !Array.isArray(directory)) return null;
    const out: SimulatorDirectoryEntry[] = [];
    for (const raw of directory) {
        const entry = mapDirectoryEntry(raw);
        if (entry != null) {
            out.push(entry);
        }
    }
    return out.length > 0 ? out : null;
}

/** Map contacts array to session contacts (id, displayName, number, email). */
export function mapContacts(contacts: SimulatorDevicePayload['contacts']): SimulatorSessionContact[] {
    if (contacts == null || !Array.isArray(contacts)) {
        return [];
    }
    return contacts
        .filter((c): c is SimulatorContact => c != null && typeof c === 'object' && typeof c.display_name === 'string')
        .map((c, index) => ({
            id: typeof c.id === 'string' ? c.id : `c-${index}`,
            displayName: c.display_name,
            number: typeof c.number === 'string' ? c.number : undefined,
            email: typeof c.email === 'string' ? c.email : undefined,
        }));
}

function mapAttachmentBehavior(raw: string | undefined): AttachmentBehavior | undefined {
    if (raw === 'download' || raw === 'open' || raw === 'macro_prompt') return raw;
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
    const d = detail as SimulatorEmailMessageDetail & { from_addr?: string; from_display_name?: string; to?: string; cc?: string; date_at?: string; unread?: boolean };
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
        reply_to: optionalString(detail.reply_to),
        return_path: optionalString(detail.return_path),
        links: mapEmailLinks(detail.links),
        attachment_name: optionalString(detail.attachment_name),
        attachment_type: optionalString(detail.attachment_type),
        attachment_behavior: mapAttachmentBehavior(optionalString(detail.attachment_behavior)),
    };
}

function toInboxRow(
    row: { id?: string; subject?: string; from?: string; from_addr?: string; from_display_name?: string; snippet?: string; date_at?: string; unread?: boolean },
    rowFrom: (r: { from?: string; from_addr?: string }) => string
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

function getSelectedMessage(
    detail: (SimulatorEmailMessageDetail & {
        from_addr?: string;
        from_display_name?: string;
        to?: string;
        cc?: string;
        date_at?: string;
        unread?: boolean;
    }) | null
): EmailTemplateContent | null {
    if (detail == null) {
        return null;
    }
    return emailDetailToContent(detail);
}

function getSelectedMessageId(
    detail: { id?: string } | null,
    allRows: SimulatorInboxRow[],
    inbox: SimulatorInboxRow[]
): string | null {
    if (detail != null) {
        return detail.id ?? null;
    }
    return allRows[0]?.id ?? inbox[0]?.id ?? null;
}

function getBrowserFieldType(fieldType: string | undefined): 'text' | 'password' | 'email' {
    if (fieldType === 'password') {
        return 'password';
    }
    if (fieldType === 'email') {
        return 'email';
    }
    return 'text';
}

/** Map email app section to session email payload. */
export function mapEmail(email: SimulatorDevicePayload['email']): SimulatorEmailPayload | null {
    if (email == null) return null;
    const messages: SimulatorEmailMessageRow[] = email.messages ?? [];
    const detail = email.detail as (SimulatorEmailMessageDetail & { from_addr?: string; from_display_name?: string; to?: string; cc?: string; date_at?: string; unread?: boolean }) | null;
    const rowFrom = (row: { from?: string; from_addr?: string }) => stringOr(row.from, stringOr(row.from_addr));
    const withFolder = messages.map((row) => {
        const r = row as { id?: string; subject?: string; from?: string; from_addr?: string; from_display_name?: string; snippet?: string; date_at?: string; unread?: boolean; folder_id?: string };
        return { row: toInboxRow(r, rowFrom), folder_id: typeof r.folder_id === 'string' ? r.folder_id.toLowerCase() : 'inbox' };
    });
    const inbox: SimulatorInboxRow[] = withFolder.filter((x) => x.folder_id === 'inbox').map((x) => x.row);
    const outbox: SimulatorInboxRow[] = withFolder.filter((x) => x.folder_id === 'outbox').map((x) => x.row);
    const trash: SimulatorInboxRow[] = withFolder.filter((x) => x.folder_id === 'trash').map((x) => x.row);
    if (inbox.length === 0 && detail != null) {
        const detailSnippet = (detail as { snippet?: string }).snippet;
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
    const selectedMessage = getSelectedMessage(detail);
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

/** Map messages (SMS) app section to session sms payload. */
export function mapMessages(messages: SimulatorDevicePayload['messages']): SimulatorSmsPayload | null {
    if (messages == null) return null;
    const threadDetail = messages.thread_detail as {
        messages?: Array<{ from?: string; text?: string; delay_seconds?: number; timestamp?: string; attachment?: { label?: string; url?: string } }>;
        sender_display_name?: string;
        sender_number?: string;
        last_at?: string;
        unread?: boolean;
    } | null;
    if (threadDetail == null || !Array.isArray(threadDetail.messages)) {
        return null;
    }
    const rawThreads = messages.threads;
    const threads: SimulatorThreadListRow[] = Array.isArray(rawThreads)
        ? rawThreads
              .filter((t) => t != null && typeof t === 'object')
              .map((t) => {
                  const r = t as unknown as Record<string, unknown>;
                  return {
                      id: stringOr(r.id),
                      preview: stringOr(r.snippet),
                      senderName: optionalString(r.contact_name),
                      senderNumber: optionalString(r.contact_number),
                      timestamp: optionalString(r.last_at),
                      unread: r.unread === true,
                  };
              })
        : [];

    const fromRole = (m: { from?: string }) => (m.from === 'me' ? 'me' : 'them');
    return {
        thread: {
            messages: threadDetail.messages.map((m) => ({
                from: fromRole(m),
                text: stringOr(m.text),
                delay_seconds: m.delay_seconds,
                timestamp: optionalString(m.timestamp),
                attachment:
                    m.attachment != null && typeof m.attachment === 'object' && typeof m.attachment.label === 'string'
                        ? {
                              label: m.attachment.label,
                              url: optionalString(m.attachment.url),
                          }
                        : undefined,
            })),
            sender_display_name: optionalString(threadDetail.sender_display_name),
            sender_number: optionalString(threadDetail.sender_number),
            last_at: optionalString(threadDetail.last_at),
            unread: threadDetail.unread === true,
        },
        visibleMessageCount: 0,
        threads: threads.length > 0 ? threads : undefined,
    };
}

/** Map device history entry direction to CallHistoryEntryKind. */
function mapHistoryKind(direction: string | undefined): CallHistoryEntryKind {
    const d = (direction ?? '').toLowerCase();
    if (d === 'missed' || d === 'voicemail') return d;
    if (d === 'out') return 'outgoing';
    return 'incoming';
}

/** Map phone app section to session phone payload (incoming_call, history, voicemail). */
export function mapPhone(phone: SimulatorDevicePayload['phone']): SimulatorPhonePayload | null {
    if (phone == null) return null;
    const incoming = phone.incoming_call;
    if (incoming == null) return null;
    const transcript = stringOr(incoming.transcript);
    const rawHistory = (phone as { history?: Array<{ id?: string; number?: string; name?: string; direction?: string; timestamp?: string }> }).history;
    const callHistory: SimulatorCallHistoryEntry[] = Array.isArray(rawHistory)
        ? rawHistory.map((h, i) => ({
              id: typeof h.id === 'string' ? h.id : `call-${i}`,
              number: stringOr(h.number),
              name: optionalString(h.name),
              kind: mapHistoryKind(h.direction),
              timestamp: optionalString(h.timestamp),
          }))
        : [];
    const voicemailSection = (phone as { voicemail?: { transcript?: string; caller_name?: string; timestamp?: string } }).voicemail;
    const voicemailTranscript =
        voicemailSection?.transcript ?? (phone as { voicemail_transcript?: string }).voicemail_transcript;
    const voicemailStr = nullableString(voicemailTranscript);
    const voicemailCallerName = optionalString(voicemailSection?.caller_name);
    const voicemailTimestamp = optionalString(voicemailSection?.timestamp);
    return {
        content: {
            transcript: transcript || 'Incoming call.',
            choices: [],
            phone_number: optionalString(incoming.phone_number),
            caller_name: optionalString(incoming.caller_name),
            caller_title: optionalString(incoming.caller_title),
            avatar_url: optionalString(incoming.avatar_url),
        },
        chosenIndex: null,
        callHistory: callHistory.length > 0 ? callHistory : undefined,
        voicemailTranscript: voicemailStr != null && voicemailStr !== '' ? voicemailStr : undefined,
        voicemailCallerName: voicemailCallerName ?? undefined,
        voicemailTimestamp: voicemailTimestamp ?? undefined,
    };
}

function normalizePageUrl(url: string | undefined): string {
    const u = stringOr(url, 'page');
    return u.startsWith('http') ? u : `https://${u}/`;
}

function mapFormFields(fields: Array<{ name?: string; type?: string; label?: string }> | undefined): NonNullable<SimulatorBrowserPage['formFields']> {
    if (fields == null || fields.length === 0) {
        return [
            { name: 'username', type: 'text', label: 'Username' },
            { name: 'password', type: 'password', label: 'Password' },
        ];
    }
    return fields.map((f) => ({
        name: stringOr(f.name, 'field'),
        type: getBrowserFieldType(f.type),
        label: stringOr(f.label, 'Field'),
    }));
}

/** Map internet app section to session internet (browser) payload (page-based). */
export function mapInternet(internet: SimulatorDevicePayload['internet']): SimulatorBrowserPayload | null {
    if (internet == null) return null;
    const rawPages = internet.pages ?? [];
    const forms = internet.forms ?? [];
    if (rawPages.length === 0) return null;

    const pages: SimulatorBrowserPage[] = rawPages.map((p: { id?: string; url?: string; title?: string; layout?: string; content?: string; submit_target_page_id?: string | null }) => {
        const pageId = stringOr(p.id, 'page');
        const form = forms.find((f: { page_id?: string }) => f.page_id === pageId) ?? forms[0];
        const rawFields = form?.fields ?? [];
        const formFields = mapFormFields(rawFields);
        const submitTargetPageId =
            typeof p.submit_target_page_id === 'string' && p.submit_target_page_id !== ''
                ? p.submit_target_page_id
                : undefined;
        const content = typeof p.content === 'string' && p.content !== '' ? p.content : undefined;
        return {
            id: pageId,
            url: normalizePageUrl(p.url),
            title: stringOr(p.title, 'Page'),
            layout: stringOr(p.layout, 'content'),
            content,
            formFields: formFields.length > 0 ? formFields : undefined,
            submitTargetPageId: submitTargetPageId ?? undefined,
        };
    });

    const firstUrl = pages[0]?.url ?? 'https://page/';
    if (!pages.some((p) => p.id === DEFAULT_BROWSER_SUBMIT_TARGET)) {
        pages.push({
            id: DEFAULT_BROWSER_SUBMIT_TARGET,
            url: firstUrl + DEFAULT_BROWSER_SUBMIT_TARGET,
            title: 'Result',
            layout: DEFAULT_BROWSER_SUBMIT_TARGET,
            content: 'Simulation complete.',
        });
    }

    return {
        pages,
        defaultPageId: pages[0]?.id ?? 'landing',
    };
}

/** Map home app section to session home payload. */
export function mapHome(home: SimulatorDevicePayload['home']): SimulatorHomePayload | null {
    if (home == null || typeof home !== 'object') return null;
    const homeScreen = (home as { home?: { widgets?: unknown[] } }).home;
    const widgets: SimulatorHomeWidget[] = Array.isArray(homeScreen?.widgets)
        ? (homeScreen.widgets as Array<{ id?: string; type?: string; label?: string }>).map((w, i) => ({
              id: typeof w.id === 'string' ? w.id : `w-${i}`,
              type: typeof w.type === 'string' ? w.type : undefined,
              label: typeof w.label === 'string' ? w.label : 'Widget',
          }))
        : [];
    const store = (home as { store?: { featured_apps?: unknown[] } }).store;
    const featuredApps: SimulatorHomeStoreApp[] = Array.isArray(store?.featured_apps)
        ? (store.featured_apps as Array<{ id?: string; name?: string }>).map((a, i) => ({
              id: typeof a.id === 'string' ? a.id : `app-${i}`,
              name: typeof a.name === 'string' ? a.name : 'App',
          }))
        : [];
    const settings = (home as { settings?: { sections?: unknown[] } }).settings;
    const settingsSections: SimulatorHomeSettingsSection[] = Array.isArray(settings?.sections)
        ? (settings.sections as Array<{ id?: string; title?: string }>).map((s, i) => ({
              id: typeof s.id === 'string' ? s.id : `s-${i}`,
              title: typeof s.title === 'string' ? s.title : 'Section',
          }))
        : [];
    return { widgets, featuredApps, settingsSections };
}
