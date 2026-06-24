/**
 * Unified simulator session state and payload contract.
 * Full-device: entry_point, device defaults, contacts, and per-app slices.
 * Supports all apps (email, messages, internet, phone, home) in a single shell.
 * Channel (sms, browser, etc.) is the nav/API contract; sms = messages app, browser = internet app.
 */

import type {
    BrowserFormField,
    EmailTemplateContent,
    PhoneSimulatorContent,
    SimulatorApp,
    SimulatorEntryPoint,
    SimulatorMainMenuItem,
    SmsThreadContent,
} from './portableSimulator';

/** Channel id for shell nav and API (maps to app: sms→messages, browser→internet). */
export type SimulatorChannel = 'contacts' | 'email' | 'sms' | 'browser' | 'phone' | 'home';

/** Screen ids per app. Apps with secondary nav: phone, email. */
export type PhoneScreenId =
    | 'history'
    | 'contacts'
    | 'add_contact'
    | 'dial'
    | 'incoming_call'
    | 'voicemail'
    | 'directory';
export type EmailScreenId = 'list' | 'detail' | 'compose' | 'outbox' | 'trash';
export type MessagesScreenId = 'threads' | 'thread_detail' | 'new_thread';
/** Page id (e.g. 'landing', 'login', 'result') or any id from payload pages. */
export type HomeScreenId = 'home' | 'store' | 'settings';

/** Default screen per app (list/root context for Cancel). */
export const DEFAULT_PHONE_SCREEN: PhoneScreenId = 'history';
export const DEFAULT_EMAIL_SCREEN: EmailScreenId = 'list';
export const DEFAULT_MESSAGES_SCREEN: MessagesScreenId = 'threads';
export const DEFAULT_INTERNET_SCREEN = 'landing';
/** Layout identifier for internet (browser) pages (from data). */
export const DEFAULT_HOME_SCREEN: HomeScreenId = 'home';

/** Per-app view state (preserved when switching apps). */
export interface PhoneAppViewState {
    screen: PhoneScreenId;
    /** Stack for Back; top = previous screen. */
    stack: PhoneScreenId[];
    chosenIndex: number | null;
}

export interface EmailAppViewState {
    screen: EmailScreenId;
    stack: EmailScreenId[];
    selectedMessageId: string | null;
}

export interface MessagesAppViewState {
    screen: MessagesScreenId;
    stack: MessagesScreenId[];
    visibleCount: number;
}

/** Max browser history stack size (simulator-focused; avoid unbounded growth). */
export const BROWSER_HISTORY_MAX = 20;

export interface InternetAppViewState {
    screen: string;
    /** Page ids for Back navigation; top = previous page. */
    stack: string[];
}

export interface HomeAppViewState {
    screen: HomeScreenId;
}

/** Home dashboard widget (from full-device home.widgets). */
export interface SimulatorHomeWidget {
    id: string;
    type?: string;
    label: string;
}

/** Store app entry (from full-device home.store.featured_apps). */
export interface SimulatorHomeStoreApp {
    id: string;
    name: string;
}

/** Settings section (from full-device home.settings.sections). */
export interface SimulatorHomeSettingsSection {
    id: string;
    title: string;
}

/** Home app payload slice (optional). */
export interface SimulatorHomePayload {
    widgets: SimulatorHomeWidget[];
    featuredApps: SimulatorHomeStoreApp[];
    settingsSections: SimulatorHomeSettingsSection[];
}

/** Single inbox row (from template messages or derived). */
export interface SimulatorInboxRow {
    id: string;
    subject: string;
    from: string;
    /** Optional sender display name (e.g. "Security Team"); from is typically the address. */
    from_display_name?: string;
    /** Optional preview/snippet for list. */
    snippet?: string;
    /** Optional date/time for list (e.g. "10:15 AM", "Yesterday"). */
    date_at?: string;
    /** When true, show unread indicator. */
    unread?: boolean;
    /** Index into template messages or run message id */
    messageIndex?: number;
}

/** Email payload slice for the unified template. */
export interface SimulatorEmailPayload {
    inbox: SimulatorInboxRow[];
    /** Outbox messages (sent); when absent, list view may show inbox for outbox tab. */
    outbox?: SimulatorInboxRow[];
    /** Trash messages; when absent, list view may show empty for trash tab. */
    trash?: SimulatorInboxRow[];
    /** Selected message content; undefined = list view */
    selectedMessage: EmailTemplateContent | null;
    selectedMessageId: string | null;
}

/** One row in the messages thread list (summary only). */
export interface SimulatorThreadListRow {
    id: string;
    preview: string;
    senderName?: string;
    senderNumber?: string;
    timestamp?: string;
    unread?: boolean;
}

/** SMS payload slice. */
export interface SimulatorSmsPayload {
    thread: SmsThreadContent;
    /** Number of messages revealed (delayed reveal). */
    visibleMessageCount: number;
    /** Optional full thread list for Messages list view; when present, list shows these instead of a single row from thread. */
    threads?: SimulatorThreadListRow[];
}

/** Single browser page (from full-device or legacy). */
export interface SimulatorBrowserPage {
    id: string;
    url: string;
    title: string;
    layout: string;
    /** Optional body text / content. */
    content?: string;
    /** Optional buttons (e.g. "Log in", "Download"). targetPageId navigates to that page when clicked. */
    buttons?: Array<{ label: string; href?: string; targetPageId?: string }>;
    /** Form fields when layout is login or has form. */
    formFields?: BrowserFormField[];
    /** Optional page id to navigate to after form submit (e.g. "result", "warning"). When absent, defaults to "result". */
    submitTargetPageId?: string | null;
    logoUrl?: string | null;
    /** Optional full-width warning banner (e.g. content/download page family). */
    warningBanner?: string | null;
    /** When true, show a wireframe-style media player placeholder (content/download family). */
    showMediaPlaceholder?: boolean;
}

/** Browser payload slice: page-based. */
export interface SimulatorBrowserPayload {
    /** Ordered pages; at least one. Current page resolved by view.internet.screen (page id). */
    pages: SimulatorBrowserPage[];
    /** Default page id when opening Internet (first page or entry_point). */
    defaultPageId: string;
}

/** Call history entry direction/type for display and behavior. */
export type CallHistoryEntryKind = 'incoming' | 'outgoing' | 'missed' | 'voicemail';

/** Single call history row (from full-device or derived). */
export interface SimulatorCallHistoryEntry {
    id: string;
    number: string;
    name?: string;
    /** Typed kind for rendering and flows. Default derived from direction/label when absent. */
    kind?: CallHistoryEntryKind;
    /** Optional human-readable timestamp (e.g. "Today 10:15 AM"). */
    timestamp?: string;
    /** Legacy/override label; prefer kind for logic. */
    label?: string;
}

/** Phone payload slice. */
export interface SimulatorPhonePayload {
    content: PhoneSimulatorContent;
    /** Index of chosen option; null = not yet chosen */
    chosenIndex: number | null;
    /** Optional call history for History tab. */
    callHistory?: SimulatorCallHistoryEntry[];
    /** Optional voicemail transcript for Voicemail view. */
    voicemailTranscript?: string | null;
    /** Optional voicemail caller/timestamp for Voicemail detail header. */
    voicemailCallerName?: string | null;
    voicemailTimestamp?: string | null;
}

/**
 * Simulator interaction actions: every interactive element dispatches one of these.
 * Reducer and event mapper consume by action.type.
 * Canonical taxonomy (types + categories + validation): see utils/simulatorActionTaxonomy.ts.
 */
export type SimulatorAction =
    | { type: 'navigate_screen'; app: SimulatorApp; screen: string }
    | { type: 'open_app'; app: SimulatorApp }
    | { type: 'open_contact'; contactId: string }
    | { type: 'open_thread'; threadId: string }
    | { type: 'open_email'; messageId: string }
    | { type: 'open_page'; pageId: string }
    | { type: 'submit_form'; submitMetadata?: Record<string, boolean> }
    | { type: 'answer_call'; choiceIndex?: number }
    | { type: 'ignore_call' }
    | { type: 'search_contacts'; query?: string }
    | { type: 'click_link'; href?: string; linkIndex?: number; pageId?: string }
    | { type: 'open_attachment'; attachmentIndex?: number }
    | { type: 'download_attachment'; attachmentIndex?: number }
    | { type: 'report' }
    | { type: 'check_contact' }
    | { type: 'check_contacts' }
    | { type: 'send_reply'; replyText?: string }
    | { type: 'dial_phone'; dialedNumber?: string }
    | { type: 'open_voicemail' }
    | { type: 'open_store' }
    | { type: 'open_settings' }
    | { type: 'download_click'; downloadTarget?: string }
    | { type: 'switch_channel'; channel: SimulatorChannel }
    | { type: 'view_directory_entry'; entryId: string };

/** Single contact for list/detail and search (from full-device payload). */
export interface SimulatorSessionContact {
    id: string;
    displayName: string;
    number?: string;
    email?: string;
}

/**
 * Official directory / trusted source entry (e.g. bank number, helpdesk, corporate portal).
 * Used for verification workflows: user can look up known-good info and call or open link.
 */
export interface SimulatorDirectoryEntry {
    id: string;
    label: string;
    /** Optional link to contacts list (use for "Call" when present). */
    contact_id?: string | null;
    /** Shown and used for "Call" when contact_id is not set. */
    number?: string | null;
    /** Optional URL (e.g. corporate portal); shown as text or link. */
    url?: string | null;
    /** Short description (e.g. "Use this number to verify account requests"). */
    description?: string | null;
}

/** Device defaults for session (from full-device payload). */
export interface SimulatorSessionDevice {
    mainMenuItems: SimulatorMainMenuItem[];
    secondaryDefaults: Partial<Record<SimulatorApp, string>>;
}

/** Unified simulator template payload (injected from library row / API). Stable shape: all keys set. */
export interface SimulatorTemplatePayload {
    templateId: number | null;
    templateKey: string;
    name: string;
    channel: SimulatorChannel;
    topicTags: Array<{ key: string; name: string }>;
    runId: number | null;
    attemptId: number | null;
    /** From full-device entry_point when present; else derived from channel. */
    entryPoint: SimulatorEntryPoint | null;
    /** From full-device device when present. */
    device: SimulatorSessionDevice | null;
    email: SimulatorEmailPayload | null;
    sms: SimulatorSmsPayload | null;
    browser: SimulatorBrowserPayload | null;
    phone: SimulatorPhonePayload | null;
    contacts: SimulatorSessionContact[] | null;
    /** Official directory / trusted sources (e.g. bank, helpdesk); shown in Phone app Directory screen. */
    directory: SimulatorDirectoryEntry[] | null;
    home: SimulatorHomePayload | null;
}

/** Mutable view state: active app + per-app local state (stacks for Back, screen for each app). */
export interface SimulatorViewState {
    /** Which main app is visible (Phone, Email, Internet, Messages, Home). */
    activeApp: SimulatorApp;
    /**
     * When true, shell shows primary menu (Phone, Email, Internet, Messages, Home).
     * When false and activeApp is phone or email, shell shows app secondary menu (e.g. History, Contacts, Dial, Back).
     * Messages, Internet, and Home always show primary menu.
     */
    showPrimaryMenu: boolean;
    /** Per-app state; preserved when switching apps. */
    phone: PhoneAppViewState;
    email: EmailAppViewState;
    messages: MessagesAppViewState;
    internet: InternetAppViewState;
    home: HomeAppViewState;
    contactsPanelOpen: boolean;
    /** Contacts search query; preserved when switching apps so returning to Contacts restores it. */
    contactsSearchQuery: string;
    actionHistory: SimulatorAction[];
}

/** Derive shell nav channel from active app (messages→sms, internet→browser, phone→contacts). */
export function viewStateToActiveChannel(app: SimulatorApp): SimulatorChannel {
    switch (app) {
        case 'phone':
            return 'contacts';
        case 'messages':
            return 'sms';
        case 'internet':
            return 'browser';
        case 'email':
        case 'home':
            return app;
        default:
            return 'email';
    }
}

/** Map shell nav channel to app (sms→messages, browser→internet). */
export function channelToApp(channel: SimulatorChannel): SimulatorApp {
    switch (channel) {
        case 'contacts':
        case 'phone':
            return 'phone';
        case 'sms':
            return 'messages';
        case 'browser':
            return 'internet';
        case 'email':
        case 'home':
            return channel;
        default:
            return 'email';
    }
}

/** Current screen id for the active app (for rendering, keyboard shortcuts, metadata). */
export function getCurrentScreenForApp(view: SimulatorViewState): string {
    switch (view.activeApp) {
        case 'email':
            return view.email.screen;
        case 'messages':
            return view.messages.screen;
        case 'internet':
            return view.internet.screen;
        case 'phone':
            return view.phone.screen;
        case 'home':
            return view.home.screen;
        default:
            return '';
    }
}

/** Full session state: payload (immutable) + view (mutable). */
export interface SimulatorSessionState {
    payload: SimulatorTemplatePayload;
    view: SimulatorViewState;
}

export type { EmailTemplateLink, SmsThreadMessage, SimulatorApp } from './portableSimulator';
