import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SimulatorDeveloperToolsPanel from '../src/SimulatorDeveloperToolsPanel';
import SimulatorAuthorPreviewReport from '../src/components/SimulatorAuthorPreviewReport';
import PhoneDialView from '../src/views/PhoneDialView';
import PhoneHistoryList from '../src/views/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/PhoneSimulatorView';
import PhoneVoicemailView from '../src/views/PhoneVoicemailView';
import SmsSimulatorView from '../src/views/SmsSimulatorView';

import { TestRenderer, act } from './reactTestRenderer';

function flattenText(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
    if (node == null) {
        return '';
    }
    if (Array.isArray(node)) {
        return node.map((child) => flattenText(child)).join('');
    }
    return (node.children ?? [])
        .map((child) => (typeof child === 'string' ? child : flattenText(child)))
        .join('');
}

afterEach(() => {
    vi.useRealTimers();
});

describe('phone and panel coverage', () => {
    it('covers phone simulator screens, dialer, and history list interactions', async () => {
        const onDial = vi.fn();
        let dialRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            dialRenderer = TestRenderer.create(React.createElement(PhoneDialView, { onDial }));
        });
        await act(async () => {
            dialRenderer!.root.findByProps({ 'aria-label': 'Digit 1' }).props.onClick();
            dialRenderer!.root.findByProps({ 'aria-label': 'Digit 2 ABC' }).props.onClick();
            dialRenderer!.root.findByProps({ 'aria-label': 'Digit 3 DEF' }).props.onClick();
            dialRenderer!.root.findByProps({ 'aria-label': 'Digit 0 +' }).props.onClick();
            dialRenderer!.root.findByProps({ 'aria-label': 'Backspace' }).props.onClick();
        });
        await act(async () => {
            dialRenderer!.root.findByProps({ 'aria-label': 'Call' }).props.onClick();
        });
        expect(onDial).toHaveBeenCalledWith('123');

        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        const onSelectEntry = vi.fn();
        let historyRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            historyRenderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        { id: 'call-1', number: '+15550000001', name: 'Alice', kind: 'incoming', timestamp: 'Today' },
                        { id: 'call-2', number: '+15550000002', label: 'Missed call', timestamp: 'Yesterday' },
                        { id: 'call-3', number: '+15550000003', kind: 'voicemail', timestamp: 'Earlier' },
                    ],
                    incomingCallContent: { transcript: 'Incoming', choices: [], caller_name: 'Bob', phone_number: '+15550000004' },
                    hasVoicemail: true,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                })
            );
        });
        await act(async () => {
            historyRenderer!.root.findByProps({ 'aria-label': 'Incoming call' }).props.onClick();
            historyRenderer!.root.findByProps({ 'aria-label': 'Voicemail' }).props.onClick();
            historyRenderer!.root.findAll((node) => typeof node.props.onClick === 'function' && node.props['aria-label'] == null)[0].props.onClick();
            historyRenderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: 'zzz' } });
            historyRenderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onKeyDown({
                key: 'Enter',
                preventDefault: vi.fn(),
            });
        });
        expect(onSelectIncoming).toHaveBeenCalled();
        expect(onSelectVoicemail).toHaveBeenCalledTimes(1);
        expect(flattenText(historyRenderer!.toJSON())).toContain('No results for "zzz".');

        await act(async () => {
            historyRenderer!.update(
                React.createElement(PhoneHistoryList, {
                    key: 'history-default-kind',
                    entries: [{ id: 'call-4', number: '+15550000005', timestamp: 'Later' }],
                    incomingCallContent: null,
                    hasVoicemail: false,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                })
            );
        });
        expect(flattenText(historyRenderer!.toJSON())).toContain('Incoming');
        await act(async () => {
            historyRenderer!.root.findByType('button').props.onClick();
        });
        expect(onSelectEntry).toHaveBeenCalledWith('call-4');

        await act(async () => {
            historyRenderer!.update(
                React.createElement(PhoneHistoryList, {
                    entries: [],
                    incomingCallContent: null,
                    hasVoicemail: false,
                    onSelectIncoming,
                    onSelectVoicemail,
                })
            );
        });
        expect(flattenText(historyRenderer!.toJSON())).toContain('No recent calls.');

        const onNavigate = vi.fn();
        const onAction = vi.fn();
        const onDismissIncoming = vi.fn();
        const onBack = vi.fn();
        let phoneRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            phoneRenderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: null,
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'history',
                    onNavigate,
                    onAction,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No phone for this scenario.');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: { content: null as never, chosenIndex: null },
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'incoming_call',
                    onNavigate,
                    onAction,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No incoming call for this scenario.');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [], caller_name: 'Bob', phone_number: '+15550000004' },
                        chosenIndex: null,
                        callHistory: [{ id: 'call-1', number: '+15550000001', kind: 'incoming' }],
                        voicemailTranscript: 'Leave a message',
                        voicemailCallerName: 'Alice',
                        voicemailTimestamp: 'Now',
                    },
                    contacts: [{ id: 'c1', displayName: 'Alice', number: '+15550000001' }],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'incoming_call',
                    onNavigate,
                    onAction,
                    onDismissIncoming,
                    onBack,
                })
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Answer' }).props.onClick();
            phoneRenderer!.root.findByProps({ 'aria-label': 'Ignore' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'answer_call' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'ignore_call' }));
        expect(onDismissIncoming).toHaveBeenCalledTimes(2);

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [], caller_name: 'Bob', phone_number: '+15550000004' },
                        chosenIndex: null,
                        callHistory: [{ id: 'call-1', number: '+15550000001', kind: 'incoming', timestamp: 'Today' }],
                        voicemailTranscript: 'Leave a message',
                        voicemailCallerName: 'Alice',
                        voicemailTimestamp: 'Now',
                    },
                    contacts: [{ id: 'c1', displayName: 'Alice', number: '+15550000001' }],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'contacts',
                    onNavigate,
                    onAction,
                    onDismissIncoming,
                    onBack,
                })
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Add contact' }).props.onClick();
            phoneRenderer!.root.findAllByProps({ children: 'Call' })[0].props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('add_contact');
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'dial_phone', dialedNumber: '+15550000001' }));

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                        voicemailTranscript: 'Leave a message',
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'add_contact',
                    onNavigate,
                    onAction,
                    onBack,
                })
            );
        });
        const addContactInputs = phoneRenderer!.root.findAllByType('input');
        await act(async () => {
            addContactInputs[0].props.onChange({ target: { value: 'New Person' } });
            addContactInputs[1].props.onChange({ target: { value: '+1555' } });
            phoneRenderer!.root.findByProps({ children: 'Save' }).props.onClick();
            phoneRenderer!.root.findByProps({ children: 'Cancel' }).props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('contacts');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                        voicemailTranscript: 'Leave a message',
                        voicemailCallerName: 'Alice',
                        voicemailTimestamp: 'Now',
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'dial',
                    onNavigate,
                    onAction,
                    onBack,
                })
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Digit 2 ABC' }).props.onClick();
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'dial_phone', dialedNumber: '2' }));

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                        voicemailTranscript: 'Leave a message',
                        voicemailCallerName: 'Alice',
                        voicemailTimestamp: 'Now',
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'voicemail',
                    onNavigate,
                    onAction,
                    onBack,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('Leave a message');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                        voicemailTranscript: null as never,
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'voicemail',
                    onNavigate,
                    onAction,
                    onBack,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No voicemail.');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [], caller_name: 'Bob', phone_number: '+15550000004' },
                        chosenIndex: null,
                        callHistory: [
                            { id: 'call-1', number: '+15550000001', kind: 'incoming', timestamp: 'Today' },
                            { id: 'call-2', number: '+15550000002', label: 'Outbound call', timestamp: 'Yesterday' },
                        ],
                        voicemailTranscript: 'Leave a message',
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'history',
                    onNavigate,
                    onAction,
                    onDismissIncoming,
                    onBack,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('Calls');
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Incoming call' }).props.onClick();
            phoneRenderer!.root.findByProps({ 'aria-label': 'Voicemail' }).props.onClick();
            phoneRenderer!.root.findByProps({ 'aria-label': 'Dial' }).props.onClick();
            phoneRenderer!.root.findByProps({ 'aria-label': 'Back' }).props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('incoming_call');
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'open_voicemail' }));
        expect(onNavigate).toHaveBeenCalledWith('voicemail');
        expect(onNavigate).toHaveBeenCalledWith('dial');
        expect(onBack).toHaveBeenCalled();

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'contacts',
                    onNavigate,
                    onAction,
                    onBack,
                })
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No contacts.');
    });

    it('covers sms thread rendering, delayed reveal, attachments, and reply actions', async () => {
        vi.useFakeTimers();
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        const onBack = vi.fn();
        let smsRenderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            smsRenderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: null,
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                })
            );
        });
        expect(flattenText(smsRenderer!.toJSON())).toContain('No messages for this scenario.');

        await act(async () => {
            smsRenderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [
                                { from: 'them', text: 'Hello', delay_seconds: 1, timestamp: '09:00' },
                                { from: 'me', text: 'Attachment', attachment: { label: 'invoice.pdf', url: '/invoice.pdf' }, delay_seconds: 1 },
                                { from: 'them', text: 'No url attachment', attachment: { label: 'note.txt' } },
                            ],
                            sender_display_name: 'Security Team',
                            links: [
                                { href: 'https://example.test', text: 'Open example' },
                                { href: 'https://example.test/doc', text: 'Doc', title: 'Reference' },
                            ],
                        },
                        visibleMessageCount: 3,
                    },
                    visibleCount: 3,
                    onAction,
                    onRevealNext,
                    onBack,
                    showReplyBox: true,
                })
            );
        });
        await act(async () => {
            vi.runAllTimers();
        });
        expect(onRevealNext).toHaveBeenCalledTimes(3);
        await act(async () => {
            smsRenderer!.root.findByProps({ 'aria-label': 'Open: invoice.pdf' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Link: Open example' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Link: Doc' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Reply to message' }).props.onChange({ target: { value: ' Reply ' } });
        });
        await act(async () => {
            smsRenderer!.root.findByProps({ 'aria-label': 'Send' }).props.onClick();
            smsRenderer!.root.findByProps({ 'aria-label': 'Cancel' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link', href: '/invoice.pdf' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link', href: 'https://example.test' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'send_reply', replyText: 'Reply' }));
        expect(onBack).toHaveBeenCalledTimes(1);

        await act(async () => {
            smsRenderer!.update(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: { messages: [], sender_number: '+1555' },
                        visibleMessageCount: 0,
                    },
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                    showReplyBox: false,
                })
            );
        });
        expect(flattenText(smsRenderer!.toJSON())).toContain('No messages in this thread.');
    });

    it('covers sms sender fallbacks, null delayed messages, and enter-to-send replies', async () => {
        vi.useFakeTimers();
        const onAction = vi.fn();
        const onRevealNext = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [
                                null as never,
                                { from: 'them', text: 'Hello', delay_seconds: 1 },
                            ],
                            sender_number: '+15550000077',
                            links: [{ href: 'https://example.test/fallback', text: '' }],
                        },
                        visibleMessageCount: 0,
                    },
                    visibleCount: 0,
                    onAction,
                    onRevealNext,
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('+15550000077');
        expect(flattenText(renderer!.toJSON())).toContain('No messages in this thread.');

        await act(async () => {
            vi.runAllTimers();
        });
        expect(onRevealNext).toHaveBeenCalledTimes(1);

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Reply to message' }).props.onChange({ target: { value: ' Enter send ' } });
        });
        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Reply to message' }).props.onKeyDown({ key: 'Enter' });
            renderer!.root.findByProps({ 'aria-label': 'Link: https://example.test/fallback' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'send_reply', replyText: 'Enter send' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'click_link', href: 'https://example.test/fallback' }));
    });

    it('covers author preview formatting branches and developer tools panel sections', async () => {
        let reportRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            reportRenderer = TestRenderer.create(
                React.createElement(SimulatorAuthorPreviewReport, {
                    defaultExpanded: false,
                    report: {
                        entryPoint: { app: 'email', screen: 'detail' },
                        appsUsed: ['email', 'internet'],
                        contactsCount: 2,
                        inboxCount: 1,
                        threadMessageCount: 1,
                        browserPagesCount: 2,
                        directoryCount: 1,
                        keyActions: [
                            React.createElement('strong', { key: 'primary-action' }, 'Review'),
                            ['nested', React.createElement('em', { key: 'secondary-action' }, 'Open')],
                        ],
                        validationOk: true,
                        lintWarningCount: 0,
                        unreachableCount: 2,
                        browserHasCycle: true,
                    },
                })
            );
        });
        await act(async () => {
            reportRenderer!.root.findByProps({ children: 'Template summary' }).props.onClick();
        });
        const reportText = flattenText(reportRenderer!.toJSON());
        expect(reportText).toContain('email/detail · 2 apps · 2 contacts · 1 inbox · 1 SMS · 2 pages · 1 directory');
        expect(reportText).toContain('Unreachable items');
        expect(reportText).toContain('Browser has navigation cycle.');

        let panelRenderer: TestRenderer.ReactTestRenderer | null = null;
        await act(async () => {
            panelRenderer = TestRenderer.create(
                React.createElement(SimulatorDeveloperToolsPanel, {
                    developerTools: { enabled: true, defaultExpanded: true, sections: { summary: true, reachability: true, timeline: true, runtimeIssues: true } } as never,
                    payload: {
                        templateId: null,
                        templateKey: 'panel',
                        name: 'Panel Payload',
                        channel: 'email',
                        topicTags: [],
                        runId: null,
                        attemptId: null,
                        entryPoint: { app: 'email', screen: 'list' },
                        device: {
                            mainMenuItems: [
                                { id: 'email', label: 'Email' },
                                { id: 'internet', label: 'Internet' },
                            ],
                            secondaryDefaults: { email: 'list', internet: 'landing' },
                        },
                        email: {
                            inbox: [{ id: 'e1', subject: 'Alert', from: 'alert@example.test' }],
                            selectedMessage: {
                                subject: 'Alert',
                                from: 'alert@example.test',
                                body: 'Open this page',
                                links: [{ href: 'https://example.test', text: 'Open' }],
                            },
                            selectedMessageId: 'e1',
                        },
                        sms: null,
                        browser: {
                            defaultPageId: 'landing',
                            pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'landing' }],
                        },
                        phone: null,
                        contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550000001' }],
                        directory: [{ id: 'd1', label: 'Helpdesk', number: '+15550000001' }],
                        home: null,
                    },
                    timelineEntries: [
                        { kind: 'session_started', timestamp: '2026-01-01T10:00:00Z', app: 'email', screen: 'list' },
                    ] as never,
                    runtimeIssues: [{ severity: 'warning', message: 'Potential issue', node_id: 'start' }] as never,
                    className: 'developer-tools',
                })
            );
        });
        const panelText = flattenText(panelRenderer!.toJSON());
        expect(panelText).toContain('Template summary');
        expect(panelText).toContain('Reachability');
        expect(panelText).toContain('Session timeline');
        expect(panelText).toContain('Runtime issues');

        await act(async () => {
            panelRenderer!.update(
                React.createElement(SimulatorDeveloperToolsPanel, {
                    developerTools: { enabled: false } as never,
                })
            );
        });
        expect(panelRenderer!.toJSON()).toBeNull();
    });

    it('covers label-derived history kinds, timestamp search, and non-actionable rows', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        { id: 'v1', number: '+15550000001', label: 'Voicemail alert', timestamp: 'Monday' },
                        { id: 'o1', number: '+15550000002', label: 'Out to support', timestamp: 'Tuesday' },
                        { id: 'u1', number: '+15550000003', label: 'Something else', timestamp: 'Wednesday' },
                    ],
                    incomingCallContent: { transcript: 'Incoming', choices: [], caller_name: 'Caller', phone_number: '+15550000009' },
                    hasVoicemail: true,
                    onSelectIncoming,
                    onSelectVoicemail,
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Voicemail');
        expect(flattenText(renderer!.toJSON())).toContain('Outbound');
        expect(flattenText(renderer!.toJSON())).toContain('Incoming');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: 'Tuesday' } });
        });
        const filteredText = flattenText(renderer!.toJSON());
        expect(filteredText).toContain('Tuesday');
        expect(filteredText).not.toContain('Monday');
        expect(filteredText).not.toContain('Wednesday');
    });

    it('covers incoming-number search, custom-kind fallback labels, and unknown passive rows', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        { id: 'custom-1', kind: 'mystery' as never, timestamp: 'Soon' },
                        { id: 'voice-1', number: '+15550000003', kind: 'voicemail', timestamp: 'Later' },
                    ],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        caller_name: '',
                        phone_number: '+15550000077',
                    },
                    hasVoicemail: true,
                    onSelectIncoming,
                    onSelectVoicemail,
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Unknown');
        expect(flattenText(renderer!.toJSON())).toContain('Call');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: '0077' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('+15550000077');
        expect(flattenText(renderer!.toJSON())).not.toContain('Later');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: 'voice' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Voicemail');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Voicemail' }).props.onClick();
        });
        expect(onSelectVoicemail).toHaveBeenCalledTimes(1);
        expect(onSelectIncoming).not.toHaveBeenCalled();
    });

    it('covers voicemail history row selection, timestamp-only matches, and incoming-number filtering', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        const onSelectEntry = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        { id: 'call-1', number: '+15550000001', timestamp: 'Tomorrow' },
                        { id: 'call-2', kind: 'voicemail', name: 'Mailbox' },
                    ],
                    incomingCallContent: { transcript: 'Incoming', choices: [], phone_number: '+15550009999' },
                    hasVoicemail: false,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                })
            );
        });

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: 'Tomorrow' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Tomorrow');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: '9999' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('+15550009999');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Search calls' }).props.onChange({ target: { value: 'Mailbox' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Voicemail');

        await act(async () => {
            const clickables = renderer!.root.findAll(
                (node) => typeof node.props.onClick === 'function' && node.props['aria-label'] == null
            );
            clickables.at(-1)!.props.onClick();
        });
        expect(onSelectVoicemail).toHaveBeenCalledTimes(1);
        expect(onSelectEntry).not.toHaveBeenCalled();
        expect(onSelectIncoming).not.toHaveBeenCalled();
    });

    it('wires the default voicemail back handler when no explicit handler is provided', async () => {
        const onNavigate = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: { transcript: 'Incoming call', choices: [] },
                        chosenIndex: null,
                        voicemailTranscript: 'Leave a message',
                    },
                    contacts: [],
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'voicemail',
                    onNavigate,
                    onAction: vi.fn(),
                })
            );
        });

        await act(async () => {
            renderer!.root.findByType(PhoneVoicemailView).props.onBack();
        });
        expect(onNavigate).toHaveBeenCalledWith('history');
    });

    it('covers sms unknown sender fallback and title-only links', async () => {
        const onAction = vi.fn();
        let renderer: TestRenderer.ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(SmsSimulatorView, {
                    payload: {
                        thread: {
                            messages: [{ from: 'them', text: 'Hello', timestamp: '09:30' }],
                            links: [{ title: 'Portal only' } as never],
                        },
                        visibleMessageCount: 1,
                    },
                    visibleCount: 1,
                    onAction,
                    onRevealNext: vi.fn(),
                })
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Unknown');
        expect(flattenText(renderer!.toJSON())).toContain('Portal only');

        await act(async () => {
            renderer!.root.findByProps({ 'aria-label': 'Link: undefined' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'click_link', href: undefined, linkIndex: 0 })
        );
    });
});
