/**
 * Simulator session snapshot for QA and debugging. Captures current app/screen,
 * local view state, relevant ids, and recent action history. Lightweight and
 * serializable; no full payload bodies. Dev/admin use only.
 */

import type { SimulatorSessionState, SimulatorAction } from '../types/session';
import { getScreenMetadata } from './screenMetadata';

/** Serializable snapshot of current simulator session for export/debug. */
export interface SimulatorSnapshot {
    /** When the snapshot was captured (ISO string). */
    capturedAt: string;
    /** Template/run identity. */
    template: {
        templateKey: string;
        templateId: number | null;
        runId: number | null;
        attemptId: number | null;
        name: string;
        channel: string;
        entryPoint: { app: string; screen: string } | null;
    };
    /** Current screen context (from screen metadata). */
    screen: {
        app: string;
        screen: string;
        label: string;
    };
    /** Per-app view state summary (screens, stacks, selected ids). */
    view: {
        activeApp: string;
        email: { screen: string; selectedMessageId: string | null; stackLength: number };
        messages: { screen: string; visibleCount: number; stackLength: number };
        internet: { screen: string; stackLength: number };
        phone: { screen: string; stackLength: number; chosenIndex: number | null };
        home: { screen: string };
        contactsPanelOpen: boolean;
        contactsSearchQuery: string;
    };
    /** Last N actions (oldest first). */
    actionHistory: SerializedSimulatorAction[];
    /** Payload counts/ids only (no bodies). */
    payloadSummary: {
        inboxCount: number;
        threadMessageCount: number;
        pageIds: string[];
        contactCount: number;
    };
}

/** Minimal serializable action for snapshot (safe to JSON.stringify). */
export interface SerializedSimulatorAction {
    type: string;
    app?: string;
    screen?: string;
    messageId?: string;
    threadId?: string;
    pageId?: string;
    contactId?: string;
    entryId?: string;
    query?: string;
    choiceIndex?: number;
    linkIndex?: number;
    attachmentIndex?: number;
    replyText?: string;
    dialedNumber?: string;
    downloadTarget?: string;
    channel?: string;
}

const DEFAULT_MAX_ACTIONS = 50;

type ActionRecord = Record<string, unknown>;

function copyTruthyStringFields(
    target: SerializedSimulatorAction,
    source: ActionRecord,
    keys: Array<
        'app' |
        'screen' |
        'messageId' |
        'threadId' |
        'pageId' |
        'contactId' |
        'entryId' |
        'channel'
    >
): void {
    keys.forEach((key) => {
        const value = source[key];
        if (typeof value === 'string' && value) {
            target[key] = value;
        }
    });
}

function copyNullableStringField(
    target: SerializedSimulatorAction,
    source: ActionRecord,
    key: 'query' | 'replyText' | 'dialedNumber' | 'downloadTarget'
): void {
    const value = source[key];
    if (typeof value === 'string') {
        target[key] = value;
    }
}

function copyNullableNumberField(
    target: SerializedSimulatorAction,
    source: ActionRecord,
    key: 'choiceIndex' | 'linkIndex' | 'attachmentIndex'
): void {
    const value = source[key];
    if (typeof value === 'number') {
        target[key] = value;
    }
}

function serializeAction(a: SimulatorAction): SerializedSimulatorAction {
    const base: SerializedSimulatorAction = { type: a.type };
    const source = a as ActionRecord;
    copyTruthyStringFields(base, source, [
        'app',
        'screen',
        'messageId',
        'threadId',
        'pageId',
        'contactId',
        'entryId',
        'channel',
    ]);
    copyNullableStringField(base, source, 'query');
    copyNullableStringField(base, source, 'replyText');
    copyNullableStringField(base, source, 'dialedNumber');
    copyNullableStringField(base, source, 'downloadTarget');
    copyNullableNumberField(base, source, 'choiceIndex');
    copyNullableNumberField(base, source, 'linkIndex');
    copyNullableNumberField(base, source, 'attachmentIndex');
    return base;
}

/**
 * Capture a serializable snapshot of the current simulator session.
 * Safe to call anytime; no side effects. Use for QA/debug export only.
 */
export function captureSimulatorSnapshot(
    state: SimulatorSessionState,
    options?: { maxActions?: number }
): SimulatorSnapshot {
    const { payload, view } = state;
    const maxActions = options?.maxActions ?? DEFAULT_MAX_ACTIONS;
    const meta = getScreenMetadata(view, payload);

    const actionHistory = view.actionHistory
        .slice(-maxActions)
        .map(serializeAction);

    const inboxCount = payload.email?.inbox?.length ?? 0;
    const threadMessageCount = payload.sms?.thread?.messages?.length ?? 0;
    const pageIds = payload.browser?.pages?.map((p) => p.id).filter(Boolean) ?? [];
    const contactCount = payload.contacts?.length ?? 0;

    return {
        capturedAt: new Date().toISOString(),
        template: {
            templateKey: payload.templateKey,
            templateId: payload.templateId,
            runId: payload.runId,
            attemptId: payload.attemptId,
            name: payload.name,
            channel: payload.channel,
            entryPoint: payload.entryPoint
                ? { app: payload.entryPoint.app, screen: payload.entryPoint.screen ?? '' }
                : null,
        },
        screen: {
            app: meta.app,
            screen: meta.screen,
            label: meta.label,
        },
        view: {
            activeApp: view.activeApp,
            email: {
                screen: view.email.screen,
                selectedMessageId: view.email.selectedMessageId,
                stackLength: view.email.stack.length,
            },
            messages: {
                screen: view.messages.screen,
                visibleCount: view.messages.visibleCount,
                stackLength: view.messages.stack.length,
            },
            internet: {
                screen: view.internet.screen,
                stackLength: view.internet.stack.length,
            },
            phone: {
                screen: view.phone.screen,
                stackLength: view.phone.stack.length,
                chosenIndex: view.phone.chosenIndex,
            },
            home: { screen: view.home.screen },
            contactsPanelOpen: view.contactsPanelOpen,
            contactsSearchQuery: view.contactsSearchQuery,
        },
        actionHistory,
        payloadSummary: {
            inboxCount,
            threadMessageCount,
            pageIds,
            contactCount,
        },
    };
}

/**
 * Serialize snapshot to JSON string (for clipboard or download).
 */
export function snapshotToJson(snapshot: SimulatorSnapshot, pretty = true): string {
    return JSON.stringify(snapshot, null, pretty ? 2 : undefined);
}
