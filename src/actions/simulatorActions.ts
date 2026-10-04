import { SimulatorActionType } from '../utils/telemetry/simulatorActionTaxonomy.js';
/**
 * Declarative action factories: build typed SimulatorAction from targets.
 * Use these in views so action shape is consistent and type-safe.
 */
import type { SimulatorAction, SimulatorChannel } from '../types/session.js';
import type { SimulatorApp } from '@signalsafe/simulator-core/simulatorApp';

export const SimulatorActions = {
    navigateScreen: (app: SimulatorApp, screen: string): SimulatorAction => ({
        type: SimulatorActionType.NavigateScreen,
        app,
        screen,
    }),
    openApp: (app: SimulatorApp): SimulatorAction => ({ type: SimulatorActionType.OpenApp, app }),
    openContact: (contactId: string): SimulatorAction => ({
        type: SimulatorActionType.OpenContact,
        contactId,
    }),
    openThread: (threadId: string): SimulatorAction => ({
        type: SimulatorActionType.OpenThread,
        threadId,
    }),
    openEmail: (messageId: string): SimulatorAction => ({
        type: SimulatorActionType.OpenEmail,
        messageId,
    }),
    openPage: (pageId: string): SimulatorAction => ({ type: SimulatorActionType.OpenPage, pageId }),
    submitForm: (submitMetadata?: Record<string, boolean>): SimulatorAction => ({
        type: SimulatorActionType.SubmitForm,
        submitMetadata,
    }),
    answerCall: (choiceIndex?: number): SimulatorAction => ({
        type: SimulatorActionType.AnswerCall,
        choiceIndex,
    }),
    ignoreCall: (): SimulatorAction => ({ type: SimulatorActionType.IgnoreCall }),
    searchContacts: (query?: string): SimulatorAction => ({
        type: SimulatorActionType.SearchContacts,
        query,
    }),
    clickLink: (opts: { href?: string; linkIndex?: number; pageId?: string }): SimulatorAction => ({
        type: SimulatorActionType.ClickLink,
        ...opts,
    }),
    openAttachment: (attachmentIndex?: number): SimulatorAction => ({
        type: SimulatorActionType.OpenAttachment,
        attachmentIndex,
    }),
    downloadAttachment: (attachmentIndex?: number): SimulatorAction => ({
        type: SimulatorActionType.DownloadAttachment,
        attachmentIndex,
    }),
    report: (): SimulatorAction => ({ type: 'report' }),
    checkContact: (): SimulatorAction => ({ type: SimulatorActionType.CheckContact }),
    checkContacts: (): SimulatorAction => ({ type: SimulatorActionType.CheckContacts }),
    sendReply: (replyText?: string): SimulatorAction => ({
        type: SimulatorActionType.SendReply,
        replyText,
    }),
    dialPhone: (dialedNumber?: string): SimulatorAction => ({
        type: SimulatorActionType.DialPhone,
        dialedNumber,
    }),
    openVoicemail: (): SimulatorAction => ({ type: SimulatorActionType.OpenVoicemail }),
    openStore: (): SimulatorAction => ({ type: SimulatorActionType.OpenStore }),
    openSettings: (): SimulatorAction => ({ type: SimulatorActionType.OpenSettings }),
    downloadClick: (downloadTarget?: string): SimulatorAction => ({
        type: SimulatorActionType.DownloadClick,
        downloadTarget,
    }),
    switchChannel: (channel: SimulatorChannel): SimulatorAction => ({
        type: SimulatorActionType.SwitchChannel,
        channel,
    }),
    viewDirectoryEntry: (entryId: string): SimulatorAction => ({
        type: SimulatorActionType.ViewDirectoryEntry,
        entryId,
    }),
} as const;
