import { createPayload } from './support/createPayload.js';
import type { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import { minimalPhoneWorld } from './support/fixtureWorlds';
import { TestRenderer, act } from './reactTestRenderer';
import ContactsView from '../src/views/contacts/ContactsView';
import EmailInboxList from '../src/views/email/EmailInboxList';
import EmailMessageDetail from '../src/views/email/EmailMessageDetail';
import MessagesThreadListView from '../src/views/messages/MessagesThreadListView';
import HomeSimulatorView from '../src/views/home/HomeSimulatorView';
import PhoneDialView from '../src/views/phone/PhoneDialView';
import PhoneHistoryList from '../src/views/phone/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import SmsSimulatorView from '../src/views/messages/SmsSimulatorView';
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
    SIM_PHONE_INCOMING_CALL_HISTORY,
    SIM_PHONE_INCOMING_CALL_SCENE,
    SIM_RUNTIME,
    SIM_RUNTIME_APP_ROOT,
    SIM_RUNTIME_DIAGNOSTICS_BAND,
    SIM_RUNTIME_SCREEN,
    SIM_EMAIL_COMPOSE_ACTION,
    SIM_MESSAGES_COMPOSE_ACTION,
    SIM_SCREEN_HEADER_ROW,
    SIM_HOME_SETTINGS_BACK_BAR,
    SIM_HOME_SETTINGS_HEADER,
} from '../src/ui/styles/semanticSimulatorClasses.js';
import { SIM_BTN_SCREEN_BACK } from '../src/ui/styles/simulatorClasses.js';
import PhoneIncomingScene from '../src/views/phone/PhoneIncomingScene';
import { SimulatorDetailBackBar } from '../src/ui/layout/SimulatorDetail.js';
import SimulatorErrorBoundary from '../src/SimulatorErrorBoundary';
import UnsupportedScreenFallback from '../src/UnsupportedScreenFallback';
vi.mock('../src/shell/PhoneSimulatorShell.js', () => ({
    default: ({ children }: { children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'simulator-shell' }, children),
}));
vi.mock('../src/developer-tools/SimulatorDeveloperToolsPanel.js', () => ({
    default: () => null,
}));
import SimulatorWithSession from '../src/SimulatorWithSession';
function classNames(node: {
    props?: {
        className?: unknown;
    };
}): string[] {
    const value = node.props?.className;
    return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}
function hasSemanticClass(
    node: {
        props?: {
            className?: unknown;
        };
    },
    token: string,
): boolean {
    return classNames(node).includes(token);
}
function findWithClass(root: ReactTestInstance, token: string): ReactTestInstance | undefined {
    const nodes = root.findAll((node) => hasSemanticClass(node, token), { deep: true });
    return nodes[0];
}
describe('semantic simulator class hooks', () => {
    let renderer: ReactTestRenderer | null = null;
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
        expect(findWithClass(renderer!.root, SIM_RUNTIME)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_RUNTIME_SCREEN)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_CHANNEL)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_CHANNEL_PHONE)).toHaveProperty('props');
    });
    it('renders runtime app root without diagnostics band when developer tools are disabled', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(minimalPhoneWorld());
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_RUNTIME_DIAGNOSTICS_BAND)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_RUNTIME_APP_ROOT)).toHaveProperty('props');
    });
    it('renders email channel modifier when email app is active', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(
            createPayload({
                ...minimalPhoneWorld(),
                channel: 'email',
                entryPoint: { app: 'email', screen: 'list' },
                email: {
                    selectedMessage: null,
                    selectedMessageId: null,
                    inbox: [{ id: 'm1', subject: 'Hi', from: 'a@b.c', unread: false }],
                    outbox: [],
                    trash: [],
                },
            }),
        );
        state.view.activeApp = 'email';
        state.view.email.screen = 'list';
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_CHANNEL_EMAIL)).toHaveProperty('props');
    });
    it('renders phone semantic classes on phone views', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: null,
                        chosenIndex: null,
                        callHistory: [],
                    },
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'history',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_HISTORY)).toHaveProperty(
            'props',
        );
        await act(async () => {
            renderer!.update(React.createElement(PhoneDialView, { onDial: vi.fn() }));
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_CALL_BUTTON)).toHaveProperty('props');
    });
    it('renders phone contact list and row classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: { content: null, chosenIndex: null, callHistory: [] },
                    contacts: [{ id: 'c1', displayName: 'Alex', number: '555' }],
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'contacts',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_LIST)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_AVATAR)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NUMBER)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_MAIN)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NAME)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_NUMBER)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_DETAIL)).toHaveProperty('props');
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
                    onCompose: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_EMAIL_INBOX)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_ROW)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_EMAIL_STATUS_BADGE)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_SCREEN_HEADER_ROW)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_EMAIL_COMPOSE_ACTION)?.props['aria-label']).toBe(
            'Compose email',
        );
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
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_DETAIL)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_EMAIL_MESSAGE_DETAIL_BODY)).toHaveProperty(
            'props',
        );
    });
    it('renders messages semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(MessagesThreadListView, {
                    threads: [{ id: 't1', preview: 'Hello', senderName: 'Alex' }],
                    onSelectThread: vi.fn(),
                    onCompose: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_MESSAGES)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_LIST)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_ROW)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_SCREEN_HEADER_ROW)).toHaveProperty('props');
        expect(
            findWithClass(renderer!.root, SIM_MESSAGES_COMPOSE_ACTION)?.props['aria-label'],
        ).toBe('New thread');
        await act(async () => {
            renderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        visibleMessageCount: 0,
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
        expect(findWithClass(renderer!.root, SIM_MESSAGES_THREAD_DETAIL)).toHaveProperty('props');
    });
    it('renders explicit Home Settings chrome hooks without changing the back button name', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(HomeSimulatorView, {
                    payload: { widgets: [], featuredApps: [], settingsSections: [] },
                    homeCapabilities: { store: false, settings: true },
                    screen: 'settings',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                    onBack: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_HOME_SETTINGS_BACK_BAR)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_HOME_SETTINGS_HEADER)).toHaveProperty('props');
        expect(renderer!.root.findByProps({ 'aria-label': 'Back to Home' })).toHaveProperty(
            'props',
        );
    });
    it('renders incoming call history wrapper on PhoneHistoryList', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        caller_name: 'Alex',
                        phone_number: '555',
                    },
                    hasVoicemail: false,
                    onSelectIncoming: vi.fn(),
                    onSelectVoicemail: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_HISTORY)).toHaveProperty(
            'props',
        );
    });
    it('renders messages channel modifier when messages app is active', async () => {
        const dispatch = vi.fn();
        const state = getInitialSessionState(
            createPayload({
                ...minimalPhoneWorld(),
                channel: 'sms',
                entryPoint: { app: 'messages', screen: 'threads' },
                sms: {
                    thread: { messages: [] },
                    visibleMessageCount: 0,
                    threads: [{ id: 't1', preview: 'Hi', senderName: 'Alex' }],
                },
            }),
        );
        state.view.activeApp = 'messages';
        state.view.messages.screen = 'threads';
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorWithSession, { state, dispatch }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_CHANNEL_MESSAGES)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_PHONE_INCOMING_CALL_SCENE)).toHaveProperty(
            'props',
        );
        expect(findWithClass(renderer!.root, 'simulator-caller-avatar')).toHaveProperty('props');
        expect(findWithClass(renderer!.root, 'simulator-screen__header')).toHaveProperty('props');
        expect(findWithClass(renderer!.root, 'simulator-call-number')).toHaveProperty('props');
        expect(findWithClass(renderer!.root, 'simulator-call-actions')).toHaveProperty('props');
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
                    payload: { content: null, chosenIndex: null, callHistory: [] },
                    contacts: [{ id: 'c1', displayName: 'Alex', number: '555' }],
                    phoneCapabilities: { dial: true, voicemail: false, directory: false },
                    screen: 'contacts',
                    onNavigate: vi.fn(),
                    onAction: vi.fn(),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_CONTACT_ROW_AVATAR)).toHaveProperty('props');
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
        expect(findWithClass(renderer!.root, SIM_PHONE_HISTORY_INCOMING_ROW)).toHaveProperty(
            'props',
        );
        expect(findWithClass(renderer!.root, SIM_CALL_STATUS_BADGE_INCOMING)).toHaveProperty(
            'props',
        );
    });
    it('renders dialer number and backspace semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(React.createElement(PhoneDialView, { onDial: vi.fn() }));
        });
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_NUMBER)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_PHONE_DIALER_BACKSPACE)).toHaveProperty('props');
    });
    it('renders messages timeline and bubble semantic classes', async () => {
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        visibleMessageCount: 0,
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
        expect(findWithClass(renderer!.root, SIM_MESSAGES_MESSAGE_TIMELINE)).toHaveProperty(
            'props',
        );
        expect(findWithClass(renderer!.root, SIM_MESSAGES_BUBBLE)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_MESSAGES_BUBBLE_THEM)).toHaveProperty('props');
    });
    it('renders error and unsupported semantic classes', async () => {
        function Boom(): JSX.Element {
            throw new Error('boom');
        }
        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SimulatorErrorBoundary, {
                    showDiagnostics: true,
                    children: React.createElement(Boom),
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_ERROR)).toHaveProperty('props');
        expect(findWithClass(renderer!.root, SIM_ERROR_DIAGNOSTICS)).toHaveProperty('props');
        await act(async () => {
            renderer!.update(
                React.createElement(UnsupportedScreenFallback, {
                    app: 'phone',
                    screen: 'unknown',
                    showDiagnostics: true,
                }),
            );
        });
        expect(findWithClass(renderer!.root, SIM_UNSUPPORTED)).toHaveProperty('props');
    });
});
