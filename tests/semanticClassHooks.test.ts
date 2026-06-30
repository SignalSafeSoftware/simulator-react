import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { minimalPhoneWorld } from './support/fixtureWorlds';
import { TestRenderer, act } from './reactTestRenderer';
import ContactsView from '../src/views/ContactsView';
import EmailInboxList from '../src/views/EmailInboxList';
import EmailMessageDetail from '../src/views/EmailMessageDetail';
import MessagesThreadListView from '../src/views/MessagesThreadListView';
import PhoneDialView from '../src/views/PhoneDialView';
import PhoneHistoryList from '../src/views/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/PhoneSimulatorView';
import SmsSimulatorView from '../src/views/SmsSimulatorView';
import {
    SIM_CHANNEL,
    SIM_CHANNEL_EMAIL,
    SIM_CHANNEL_MESSAGES,
    SIM_CHANNEL_PHONE,
    SIM_EMAIL_INBOX,
    SIM_EMAIL_MESSAGE_DETAIL,
    SIM_EMAIL_MESSAGE_ROW,
    SIM_EMAIL_STATUS_BADGE,
    SIM_MESSAGES,
    SIM_MESSAGES_THREAD_DETAIL,
    SIM_MESSAGES_THREAD_LIST,
    SIM_MESSAGES_THREAD_ROW,
    SIM_PHONE,
    SIM_PHONE_CONTACT_DETAIL,
    SIM_PHONE_CONTACT_LIST,
    SIM_PHONE_CONTACT_ROW,
    SIM_PHONE_DIALER,
    SIM_PHONE_DIALER_CALL_BUTTON,
    SIM_PHONE_INCOMING_CALL_HISTORY,
    SIM_RUNTIME,
    SIM_RUNTIME_SCREEN,
} from '../src/ui/semanticSimulatorClasses.js';

vi.mock('../src/shell/PhoneSimulatorShell', () => ({
    default: ({ children }: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'simulator-shell' }, children),
}));

vi.mock('../src/SimulatorDeveloperToolsPanel', () => ({
    default: () => null,
}));

import SimulatorWithSession from '../src/SimulatorWithSession';

function classNames(node: { props?: { className?: unknown } }): string[] {
    const value = node.props?.className;
    return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}

function hasSemanticClass(node: { props?: { className?: unknown } }, token: string): boolean {
    return classNames(node).includes(token);
}

function findWithClass(
    root: TestRenderer.ReactTestInstance,
    token: string,
): TestRenderer.ReactTestInstance | undefined {
    const nodes = root.findAll(
        (node) => hasSemanticClass(node, token),
        { deep: true },
    );
    return nodes[0];
}

describe('semantic simulator class hooks', () => {
    let renderer: TestRenderer.ReactTestRenderer | null = null;

    afterEach(() => {
        renderer?.unmount();
        renderer = null;
    });

    it('renders runtime and channel classes on SimulatorWithSession', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_RUNTIME)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_RUNTIME_SCREEN)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_CHANNEL)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_CHANNEL_PHONE)).toBeTruthy();
    });

    it('renders email channel modifier when email app is active', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState({
            ...minimalPhoneWorld(),
            channel: 'email',
            entryPoint: { app: 'email', screen: 'list' },
            email: {
                inbox: [{ id: 'm1', subject: 'Hi', from: 'a@b.c', unread: false }],
                outbox: [],
                trash: [],
            },
        });
        state.view.activeApp = 'email';
        state.view.email.screen = 'list';

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_CHANNEL_EMAIL)).toBeTruthy();
    });

    it('renders phone semantic classes on phone views', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: null,
                        callHistory: [],
                    },
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'history',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_HISTORY)).toBeTruthy();

        await act(async () => {
            renderer!.update(
                React.createElement(PhoneDialView, { onDial: vi.fn() }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_CALL_BUTTON)).toBeTruthy();
    });

    it('renders phone contact list and row classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: { content: null, callHistory: [] },
                    contacts: [{ id: 'c1', displayName: 'Alex', number: '555' }],
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'contacts',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_LIST)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW)).toBeTruthy();
    });

    it('renders contact detail class in ContactsView', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: [{ id: 'c1', displayName: 'Alex', number: '555' }],
                    onBack: vi.fn(),
                    initialSelectedContactId: 'c1',
                    phoneLocalNavItems: [{ id: 'contacts', label: 'Contacts' }],
                    onPhoneNavSelect: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toBeTruthy();
    });

    it('renders email semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(EmailInboxList, {
                    inbox: [
                        {
                            id: 'm1',
                            subject: 'Subject',
                            from: 'sender@example.test',
                            from_display_name: 'Sender',
                            unread: true,
                        },
                    ],
                    selectedMessageId: null,
                    onSelectMessage: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_EMAIL_INBOX)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_ROW)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_EMAIL_STATUS_BADGE)).toBeTruthy();

        await act(async () => {
            renderer!.update(
                React.createElement(EmailMessageDetail, {
                    message: {
                        subject: 'Subject',
                        from: 'sender@example.test',
                        body: 'Body',
                    },
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_DETAIL)).toBeTruthy();
    });

    it('renders messages semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(MessagesThreadListView, {
                    threads: [{ id: 't1', preview: 'Hello', senderName: 'Alex' }],
                    onSelectThread: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_MESSAGES)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_LIST)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_ROW)).toBeTruthy();

        await act(async () => {
            renderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            sender_display_name: 'Alex',
                            messages: [{ from: 'them', text: 'Hi' }],
                        },
                    },
                    visibleCount: 1,
                    onAction: vi.fn(),
                    onRevealNext: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_DETAIL)).toBeTruthy();
    });

    it('renders incoming call history wrapper on PhoneHistoryList', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [],
                    incomingCallContent: {
                        caller_name: 'Alex',
                        phone_number: '555',
                    },
                    hasVoicemail: false,
                    onSelectIncoming: vi.fn(),
                    onSelectVoicemail: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_HISTORY)).toBeTruthy();
    });

    it('renders messages channel modifier when messages app is active', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState({
            ...minimalPhoneWorld(),
            channel: 'sms',
            entryPoint: { app: 'messages', screen: 'threads' },
            sms: {
                threads: [{ id: 't1', preview: 'Hi', senderName: 'Alex' }],
            },
        });
        state.view.activeApp = 'messages';
        state.view.messages.screen = 'threads';

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_CHANNEL_MESSAGES)).toBeTruthy();
    });
});
