import {
    BrowserLayout,
    CallHistoryEntryKind,
    DEFAULT_INTERNET_SCREEN,
    MessageSender,
    SimulatorChannel,
    type SimulatorInboxRow,
    type SimulatorEmailPayload,
    type SimulatorSmsPayload,
    type SimulatorThreadListRow,
    type SimulatorBrowserPayload,
    type SimulatorBrowserPage,
    type SimulatorPhonePayload,
    type SimulatorCallHistoryEntry,
    type SimulatorSessionDevice,
    type SimulatorSessionContact,
    type SimulatorDirectoryEntry,
    type SimulatorHomePayload,
    type SimulatorHomeWidget,
    type SimulatorHomeStoreApp,
    type SimulatorHomeSettingsSection,
} from '../types/session.js';
import { englishLocale } from '../i18n/englishLocale.js';
/**
 * Maps full-device payload (simulator) sections to unified session slice types.
 * Small helpers per app/domain; strict types, no any.
 */

import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../constants.js';
import { FieldInputType, getFieldInputType } from '../utils/payload/browserFieldType.js';
import { AttachmentBehavior, type EmailTemplateContent } from '../types/template.js';
import { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';
import type {
    SimulatorContact,
    SimulatorDevicePayload,
    SimulatorEmailMessageRow,
    SimulatorEmailMessageDetail,
} from '@signalsafe/simulator-core/devicePayload';

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
        case SimulatorApp.Messages:
            return SimulatorChannel.Sms;
        case SimulatorApp.Internet:
            return SimulatorChannel.Browser;
        case SimulatorApp.Phone:
        case SimulatorApp.Email:
        case SimulatorApp.Home:
            return app;
        default:
            return SimulatorChannel.Email;
    }
}

/** Map device section to session device (main menu + secondary defaults). */
export function mapDevice(device: SimulatorDevicePayload['device']): SimulatorSessionDevice | null {
    if (device == null) {
        return null;
    }
    const mainMenuItems = (Array.isArray(device.main_menu_items) ? device.main_menu_items : [])
        .filter(
            (item): item is NonNullable<typeof item> =>
                item != null && typeof item === 'object' && typeof item.id === 'string',
        )
        .map((item) => ({
            ...item,
            id: stringOr(item.id),
            label: stringOr((item as { label?: unknown }).label, stringOr(item.id)),
            app: typeof item.app === 'string' ? item.app : undefined,
        }));
    if (mainMenuItems.length === 0 && Object.keys(device.secondary_defaults ?? {}).length === 0)
        return null;
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
    const id = optionalString(o.id);
    const label = optionalString(o.label);
    if (id == null || label == null) {
        return null;
    }
    return {
        id,
        label,
        contact_id: nullableString(o.contact_id),
        number: nullableString(o.number),
        url: nullableString(o.url),
        description: nullableString(o.description),
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
export function mapContacts(
    contacts: SimulatorDevicePayload['contacts'],
): SimulatorSessionContact[] {
    if (contacts == null || !Array.isArray(contacts)) {
        return [];
    }
    return contacts
        .filter(
            (c): c is SimulatorContact =>
                c != null && typeof c === 'object' && typeof c.display_name === 'string',
        )
        .map((c, index) => ({
            id: typeof c.id === 'string' ? c.id : `c-${index}`,
            displayName: c.display_name,
            phoneNumbers: c.phone_numbers,
            emailAddresses: c.email_addresses,
            number: typeof c.number === 'string' ? c.number : undefined,
            email: typeof c.email === 'string' ? c.email : undefined,
        }));
}

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

/** Map device history entry direction to CallHistoryEntryKind. */
function mapHistoryKind(direction: string | undefined): CallHistoryEntryKind {
    const d = (direction ?? '').toLowerCase();
    if (d === CallHistoryEntryKind.Missed || d === CallHistoryEntryKind.Voicemail) return d;
    if (d === 'out') return CallHistoryEntryKind.Outgoing;
    return CallHistoryEntryKind.Incoming;
}

/** Map phone app section to session phone payload (incoming_call, history, voicemail). */
export function mapPhone(phone: SimulatorDevicePayload['phone']): SimulatorPhonePayload | null {
    if (phone == null) return null;
    if (Object.hasOwn(phone, 'voicemail_transcript')) {
        throw new Error(
            'Removed simulator field phone.voicemail_transcript; migrate it to phone.voicemail.transcript.',
        );
    }
    const incoming = phone.incoming_call;
    const transcript = stringOr(incoming?.transcript);
    const rawHistory = phone.history;
    const callHistory: SimulatorCallHistoryEntry[] = Array.isArray(rawHistory)
        ? rawHistory.map((h, i) => ({
              id: typeof h.id === 'string' ? h.id : `call-${i}`,
              number: stringOr(h.number),
              name: optionalString(h.name),
              kind: mapHistoryKind(h.direction),
              timestamp: optionalString(h.timestamp),
          }))
        : [];
    const voicemailSection = phone.voicemail;
    const voicemailTranscript = voicemailSection?.transcript;
    const voicemailStr = nullableString(voicemailTranscript);
    if (incoming == null && callHistory.length === 0 && !voicemailStr) return null;
    const voicemailCallerName = optionalString(voicemailSection?.caller_name);
    const voicemailTimestamp = optionalString(voicemailSection?.timestamp);
    return {
        content:
            incoming == null
                ? null
                : {
                      transcript:
                          transcript || englishLocale.t('copy.fullDeviceToSession.incoming.call'),
                      choices: [],
                      phone_number: optionalString(incoming?.phone_number),
                      caller_name: optionalString(incoming?.caller_name),
                      caller_title: optionalString(incoming?.caller_title),
                      avatar_url: optionalString(incoming?.avatar_url),
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

function mapFormFields(
    fields: Array<{ name?: string; type?: string; label?: string }> | undefined,
): NonNullable<SimulatorBrowserPage['formFields']> {
    if (fields == null || fields.length === 0) {
        return [
            { name: 'username', type: FieldInputType.Text, label: 'Username' },
            { name: 'password', type: FieldInputType.Password, label: 'Password' },
        ];
    }
    return fields.map((f) => ({
        name: stringOr(f.name, 'field'),
        type: getFieldInputType(f.type),
        label: stringOr(f.label, 'Field'),
    }));
}

/** Map internet app section to session internet (browser) payload (page-based). */
export function mapInternet(
    internet: SimulatorDevicePayload['internet'],
): SimulatorBrowserPayload | null {
    if (internet == null) return null;
    const rawPages = internet.pages ?? [];
    const forms = internet.forms ?? [];
    if (rawPages.length === 0) return null;

    const pages: SimulatorBrowserPage[] = rawPages.map((p) => {
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
            layout: stringOr(p.layout, BrowserLayout.Content),
            content,
            buttons: p.buttons?.map((button) => {
                if (Object.hasOwn(button, 'targetPageId')) {
                    throw new Error(
                        'Removed simulator button field targetPageId; migrate it to target_page_id.',
                    );
                }
                return {
                    label: stringOr(button.label),
                    href: optionalString(button.href),
                    targetPageId: optionalString(button.target_page_id),
                };
            }),
            logoUrl: p.logo_url,
            warningBanner: p.warning_banner,
            showMediaPlaceholder: p.show_media_placeholder,
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
            content: englishLocale.t('copy.fullDeviceToSession.simulation.complete'),
        });
    }

    return {
        pages,
        defaultPageId: pages[0]?.id ?? DEFAULT_INTERNET_SCREEN,
    };
}

/** Map home app section to session home payload. */
export function mapHome(home: SimulatorDevicePayload['home']): SimulatorHomePayload | null {
    if (home == null || typeof home !== 'object') return null;
    const homeScreen = (home as { home?: { widgets?: unknown[] } }).home;
    const widgets: SimulatorHomeWidget[] = Array.isArray(homeScreen?.widgets)
        ? (homeScreen.widgets as Array<{ id?: string; type?: string; label?: string }>).map(
              (w, i) => ({
                  id: typeof w.id === 'string' ? w.id : `w-${i}`,
                  type: typeof w.type === 'string' ? w.type : undefined,
                  label: typeof w.label === 'string' ? w.label : 'Widget',
              }),
          )
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
