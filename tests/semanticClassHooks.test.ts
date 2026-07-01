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
    SIM_EMAIL_MESSAGE_DETAIL_BODY,
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
    SIM_PHONE_CONTACT_ROW_AVATAR,
    SIM_PHONE_CONTACT_ROW_MAIN,
    SIM_PHONE_CONTACT_ROW_NAME,
    SIM_PHONE_CONTACT_ROW_NUMBER,
    SIM_PHONE_DIALER,
    SIM_PHONE_DIALER_BACKSPACE,
    SIM_PHONE_DIALER_CALL_BUTTON,
    SIM_PHONE_DIALER_NUMBER,
    SIM_PHONE_HISTORY_INCOMING_ROW,
    SIM_CALL_STATUS_BADGE_INCOMING,
    SIM_MESSAGES_BUBBLE,
    SIM_MESSAGES_BUBBLE_THEM,
    SIM_MESSAGES_MESSAGE_TIMELINE,
    SIM_ERROR,
    SIM_ERROR_DIAGNOSTICS,
    SIM_UNSUPPORTED,
    SIM_PHONE_INCOMING_CALL_ACTIONS,
    SIM_PHONE_INCOMING_CALL_AVATAR,
    SIM_PHONE_INCOMING_CALL_CALLER_NAME,
    SIM_PHONE_INCOMING_CALL_HISTORY,
    SIM_PHONE_INCOMING_CALL_NUMBER,
    SIM_PHONE_INCOMING_CALL_SCENE,
    SIM_RUNTIME,
    SIM_RUNTIME_APP_ROOT,
    SIM_RUNTIME_DIAGNOSTICS_BAND,
    SIM_RUNTIME_SCREEN,
} from '../src/ui/semanticSimulatorClasses.js';
import { SIM_BTN_SCREEN_BACK } from '../src/ui/simulatorClasses.js';
import PhoneIncomingScene from '../src/views/PhoneIncomingScene';
import { SimulatorDetailBackBar } from '../src/components/SimulatorDetail';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import UnsupportedScreenFallback from '../src/UnsupportedScreenFallback';

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
        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_RUNTIME_SCREEN)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_CHANNEL)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_CHANNEL_PHONE)).toBeTruthy();
    });

    it('renders runtime app root without diagnostics band when developer tools are disabled', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_RUNTIME_DIAGNOSTICS_BAND)).toBeUndefined();
    });

    it('renders diagnostics band when developer tools are enabled', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, {
                    state,
                    dispatch,
                    developerTools: { enabled: true },
                }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_RUNTIME_DIAGNOSTICS_BAND)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toBeTruthy();
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
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toBeTruthy();
    });

    it('renders contact row avatar class in ContactsView', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: [{ id: 'c1', displayName: 'Alex', number: '555' }],
                    onBack: vi.fn(),
                    phoneLocalNavItems: [{ id: 'contacts', label: 'Contacts' }],
                    onPhoneNavSelect: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_AVATAR)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NUMBER)).toBeTruthy();
    });

    it('renders compact contact row main/name/number classes without phone local nav', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(ContactsView, {
                    contacts: [{ id: 'c1', displayName: 'Alice Chen', number: '+1 555-0100' }],
                    onBack: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NUMBER)).toBeTruthy();
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
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_DETAIL_BODY)).toBeTruthy();
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

    it('renders incoming call scene semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneIncomingScene, {
                    content: {
                        transcript: 'Incoming call.',
                        choices: [],
                        caller_name: 'Alex',
                        phone_number: '+15550000000',
                    },
                    onAnswer: vi.fn(),
                    onIgnore: vi.fn(),
                }),
            );
        });

        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_SCENE)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_AVATAR)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_CALLER_NAME)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_NUMBER)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_ACTIONS)).toBeTruthy();
    });

    it('renders screen-back class on SimulatorDetailBackBar', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorDetailBackBar, {
                    onBack: vi.fn(),
                    title: 'Detail',
                    ariaLabel: 'Back to list',
                }),
            );
        });

        const backButton = renderer!.root.findByProps({ 'aria-label': 'Back to list' });
        expect(classNames(backButton)).toContain(SIM_BTN_SCREEN_BACK);
    });

    it('renders contact row avatar in PhoneSimulatorView contacts screen', async () => {
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
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_AVATAR)).toBeTruthy();
    });

    it('renders history incoming row and status badge classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        caller_name: 'Alex',
                        phone_number: '+15550000000',
                    },
                    hasVoicemail: false,
                    onSelectIncoming: vi.fn(),
                    onSelectVoicemail: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_HISTORY_INCOMING_ROW)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_CALL_STATUS_BADGE_INCOMING)).toBeTruthy();
    });

    it('renders dialer number and backspace semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneDialView, { onDial: vi.fn() }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_NUMBER)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_BACKSPACE)).toBeTruthy();
    });

    it('renders messages timeline and bubble semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            sender_display_name: 'Alex',
                            messages: [{ from: 'them', text: 'Hello' }],
                        },
                    },
                    visibleCount: 1,
                    onAction: vi.fn(),
                    onRevealNext: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_MESSAGES_MESSAGE_TIMELINE)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_MESSAGES_BUBBLE)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_MESSAGES_BUBBLE_THEM)).toBeTruthy();
    });

    it('renders error and unsupported semantic classes', async () => {
        function Boom(): JSX.Element {
            throw new Error('boom');
        }

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(
                    SimulatorErrorBoundary,
                    { showDiagnostics: true },
                    React.createElement(Boom),
                ),
            );
        });
        expect(findWithClass(renderer!.root, SIM_ERROR)).toBeTruthy();
        expect(findWithClass(renderer!.root, SIM_ERROR_DIAGNOSTICS)).toBeTruthy();

        await act(async () => {
            renderer!.update(
                React.createElement(UnsupportedScreenFallback, {
                    app: 'phone',
                    screen: 'unknown',
                    showDiagnostics: true,
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_UNSUPPORTED)).toBeTruthy();
    });
});
