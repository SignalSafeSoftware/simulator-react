/**
 * React/session-specific simulator types and API template detail shapes.
 *
 * Canonical full-device payload types live in `@signalsafe/simulator-core` and are
 * re-exported here for backward-compatible public imports.
 */
import type { SimulatorDevicePayload, SmsThreadMessage } from '@signalsafe/simulator-core';

export type {
    BrowserFormField,
    SimulatorApp,
    SimulatorContact,
    SimulatorDevice,
    SimulatorDevicePayload,
    SimulatorDirectoryEntry,
    SimulatorEmailApp,
    SimulatorEmailMessageDetail,
    SimulatorEmailMessageRow,
    SimulatorEntryPoint,
    SimulatorHomeApp,
    SimulatorInternetApp,
    SimulatorInternetForm,
    SimulatorInternetPage,
    SimulatorMainMenuItem,
    SimulatorMessagesApp,
    SimulatorPageButton,
    SimulatorPhoneApp,
    SimulatorPhoneIncomingCall,
    SimulatorSmsThreadDetail,
    SimulatorSmsThreadSummary,
    SmsMessageAttachment,
    SmsThreadMessage,
} from '@signalsafe/simulator-core';

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

export interface SmsThreadContent {
    messages: SmsThreadMessage[];
    links?: EmailTemplateLink[];
    sender_display_name?: string;
    sender_number?: string;
    last_at?: string;
    unread?: boolean;
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
