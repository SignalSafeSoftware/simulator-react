/**
 * Portable simulator contract types owned by @signalsafe/simulator-react.
 *
 * These are the minimal host-facing shapes the package consumes directly for
 * adapters, fixtures, and shared UI. Keeping them package-local removes the
 * previous dependency on monorepo-only @shared / @workspace-types aliases.
 */

export type SimulatorApp = 'phone' | 'email' | 'messages' | 'internet' | 'home';

export interface SimulatorEntryPoint {
    app: SimulatorApp;
    screen: string;
}

export interface SimulatorMainMenuItem {
    id: string;
    label: string;
    app?: SimulatorApp;
}

export interface SimulatorDevice {
    main_menu_items?: SimulatorMainMenuItem[];
    secondary_defaults?: Partial<Record<SimulatorApp, string>>;
}

export interface SimulatorContact {
    id: string;
    display_name: string;
    number?: string;
    email?: string;
}

export interface EmailTemplateLink {
    href: string;
    text: string;
    title?: string;
}

export type AttachmentBehavior = 'download' | 'open' | 'macro_prompt';

export interface EmailTemplateContent {
    subject: string;
    from: string;
    body: string;
    from_display_name?: string;
    to?: string;
    cc?: string;
    date_at?: string;
    unread?: boolean;
    reply_to?: string;
    return_path?: string;
    links?: EmailTemplateLink[];
    attachment_name?: string;
    attachment_type?: string;
    attachment_behavior?: AttachmentBehavior;
}

export interface SimulatorEmailMessageRow {
    id: string;
    folder_id: string;
    subject: string;
    from: string;
    from_addr?: string;
    from_display_name?: string;
    snippet?: string;
    date_at?: string;
    unread?: boolean;
}

export interface SimulatorEmailMessageDetail {
    id: string;
    subject: string;
    from: string;
    from_addr?: string;
    from_display_name?: string;
    to?: string;
    cc?: string;
    date_at?: string;
    unread?: boolean;
    body: string;
    reply_to?: string;
    return_path?: string;
    links?: EmailTemplateLink[];
    attachment_name?: string;
    attachment_type?: string;
    attachment_behavior?: string;
    snippet?: string;
}

export interface SmsMessageAttachment {
    label: string;
    url?: string;
}

export interface SmsThreadMessage {
    from: 'them' | 'me';
    text: string;
    delay_seconds?: number;
    timestamp?: string;
    attachment?: SmsMessageAttachment;
}

export interface SmsThreadContent {
    messages: SmsThreadMessage[];
    links?: EmailTemplateLink[];
    sender_display_name?: string;
    sender_number?: string;
    last_at?: string;
    unread?: boolean;
}

export interface SimulatorSmsThreadSummary {
    id: string;
    contact_name?: string;
    contact_number?: string;
    snippet?: string;
    last_at?: string;
    unread?: boolean;
}

export interface SimulatorSmsThreadDetail {
    id?: string;
    messages: SmsThreadMessage[];
    sender_display_name?: string;
    sender_number?: string;
    last_at?: string;
    unread?: boolean;
}

export interface BrowserFormField {
    name: string;
    type: 'text' | 'password' | 'email';
    label: string;
}

export interface SimulatorPageButton {
    label?: string;
    href?: string;
    targetPageId?: string;
    target_page_id?: string;
}

export interface SimulatorInternetPage {
    id: string;
    url: string;
    title: string;
    layout?: string;
    content?: string;
    buttons?: SimulatorPageButton[];
    submit_target_page_id?: string | null;
    logo_url?: string | null;
    warning_banner?: string | null;
    show_media_placeholder?: boolean;
}

export interface SimulatorInternetForm {
    id: string;
    page_id?: string;
    fields: BrowserFormField[];
}

export interface SimulatorInternetApp {
    pages?: SimulatorInternetPage[];
    forms?: SimulatorInternetForm[];
}

export interface PhoneSimulatorChoice {
    label: string;
    correct: boolean;
}

export interface PhoneSimulatorContent {
    phone_number?: string;
    caller_name?: string;
    caller_title?: string;
    urgency?: string;
    avatar_url?: string;
    transcript: string;
    final_question?: string;
    choices: PhoneSimulatorChoice[];
}

export interface SimulatorPhoneIncomingCall {
    phone_number?: string;
    caller_name?: string;
    caller_title?: string;
    transcript?: string;
    avatar_url?: string;
}

export interface SimulatorPhoneApp {
    history?: Array<{
        id: string;
        number?: string;
        name?: string;
        direction?: 'in' | 'out' | 'missed' | 'voicemail';
        timestamp?: string;
    }>;
    contacts?: string[];
    dial?: {
        digits?: string;
    };
    incoming_call?: SimulatorPhoneIncomingCall | null;
    voicemail?: {
        transcript?: string;
        caller_name?: string;
        timestamp?: string;
    };
    voicemail_transcript?: string;
}

export interface SimulatorHomeApp {
    home?: {
        widgets?: Array<{ id: string; type?: string; label?: string }>;
    };
    store?: {
        featured_apps?: Array<{ id: string; name: string }>;
    };
    settings?: {
        sections?: Array<{ id: string; title: string }>;
    };
}

export interface SimulatorMessagesApp {
    threads?: SimulatorSmsThreadSummary[];
    thread_detail?: SimulatorSmsThreadDetail | null;
}

export interface SimulatorEmailApp {
    messages?: SimulatorEmailMessageRow[];
    detail?: SimulatorEmailMessageDetail | null;
}

export interface SimulatorDevicePayload {
    device?: SimulatorDevice;
    entry_point?: SimulatorEntryPoint;
    contacts?: SimulatorContact[];
    phone?: SimulatorPhoneApp;
    email?: SimulatorEmailApp;
    messages?: SimulatorMessagesApp;
    internet?: SimulatorInternetApp;
    home?: SimulatorHomeApp;
    directory?: Array<{
        id: string;
        label: string;
        contact_id?: string | null;
        number?: string | null;
        url?: string | null;
        description?: string | null;
    }>;
}

export interface SimulatorTopicMinimal {
    key: string;
    name: string;
}

export interface SimulatorTemplateListItem {
    id: number;
    channel: string;
    key: string;
    name: string;
    is_master: boolean;
    is_active: boolean;
    company: number | null;
    topics?: SimulatorTopicMinimal[];
    created_on: string;
    updated_on: string;
}

export interface SimulatorBrowserTemplateDetail {
    domain_display: string;
    page_layout: string;
    logo_url: string | null;
    form_fields: unknown[];
}

export interface SimulatorTemplateDetail extends SimulatorTemplateListItem {
    description: string;
    content_json: Record<string, unknown>;
    simulator_json?: SimulatorDevicePayload | null;
    simulator: SimulatorDevicePayload;
    thread_id: string | null;
    reply_to_message: number | null;
    attachment_name: string;
    attachment_type: string;
    attachment_behavior: string;
    messages: unknown[];
    browser_template?: SimulatorBrowserTemplateDetail | null;
}
