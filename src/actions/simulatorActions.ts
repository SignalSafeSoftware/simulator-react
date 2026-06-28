/**
 * Declarative action factories: build typed SimulatorAction from targets.
 * Use these in views so action shape is consistent and type-safe.
 */
import type { SimulatorAction, SimulatorChannel } from '../types/session.js';
import type { SimulatorApp } from '../types/portableSimulator.js';

export const SimulatorActions = {
    navigateScreen: (app: SimulatorApp, screen: string): SimulatorAction => ({
        type: 'navigate_screen',
        app,
        screen,
    }),
    openApp: (app: SimulatorApp): SimulatorAction => ({ type: 'open_app', app }),
    openContact: (contactId: string): SimulatorAction => ({ type: 'open_contact', contactId }),
    openThread: (threadId: string): SimulatorAction => ({ type: 'open_thread', threadId }),
    openEmail: (messageId: string): SimulatorAction => ({ type: 'open_email', messageId }),
    openPage: (pageId: string): SimulatorAction => ({ type: 'open_page', pageId }),
    submitForm: (submitMetadata?: Record<string, boolean>): SimulatorAction => ({
        type: 'submit_form',
        submitMetadata,
    }),
    answerCall: (choiceIndex?: number): SimulatorAction => ({ type: 'answer_call', choiceIndex }),
    ignoreCall: (): SimulatorAction => ({ type: 'ignore_call' }),
    searchContacts: (query?: string): SimulatorAction => ({ type: 'search_contacts', query }),
    clickLink: (opts: { href?: string; linkIndex?: number; pageId?: string }): SimulatorAction => ({
        type: 'click_link',
        ...opts,
    }),
    openAttachment: (attachmentIndex?: number): SimulatorAction => ({
        type: 'open_attachment',
        attachmentIndex,
    }),
    downloadAttachment: (attachmentIndex?: number): SimulatorAction => ({
        type: 'download_attachment',
        attachmentIndex,
    }),
    report: (): SimulatorAction => ({ type: 'report' }),
    checkContact: (): SimulatorAction => ({ type: 'check_contact' }),
    checkContacts: (): SimulatorAction => ({ type: 'check_contacts' }),
    sendReply: (replyText?: string): SimulatorAction => ({ type: 'send_reply', replyText }),
    dialPhone: (dialedNumber?: string): SimulatorAction => ({ type: 'dial_phone', dialedNumber }),
    openVoicemail: (): SimulatorAction => ({ type: 'open_voicemail' }),
    openStore: (): SimulatorAction => ({ type: 'open_store' }),
    openSettings: (): SimulatorAction => ({ type: 'open_settings' }),
    downloadClick: (downloadTarget?: string): SimulatorAction => ({
        type: 'download_click',
        downloadTarget,
    }),
    switchChannel: (channel: SimulatorChannel): SimulatorAction => ({ type: 'switch_channel', channel }),
    viewDirectoryEntry: (entryId: string): SimulatorAction => ({ type: 'view_directory_entry', entryId }),
} as const;
