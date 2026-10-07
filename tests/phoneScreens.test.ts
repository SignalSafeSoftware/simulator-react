import type { ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhoneDialView from '../src/views/phone/PhoneDialView';
import PhoneHistoryList from '../src/views/phone/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/phonePanelsSupport';

afterEach(() => {
    vi.useRealTimers();
});

describe('phone screens', () => {
    it('covers phone simulator screens, dialer, and history list interactions', async () => {
        const onDial = vi.fn();
        let dialRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            dialRenderer = TestRenderer.create(React.createElement(PhoneDialView, { onDial }));
        });
        for (const label of ['Digit 1', 'Digit 2 ABC', 'Digit 3 DEF', 'Digit 0 +', 'Backspace']) {
            await act(async () => {
                dialRenderer!.root.findByProps({ 'aria-label': label }).props.onClick();
            });
        }
        await act(async () => {
            dialRenderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        expect(onDial).toHaveBeenCalledWith('123');

        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        const onSelectEntry = vi.fn();
        let historyRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            historyRenderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        {
                            id: 'call-1',
                            number: '+15550000001',
                            name: 'Alice',
                            kind: 'incoming',
                            timestamp: 'Today',
                        },
                        {
                            id: 'call-2',
                            number: '+15550000002',
                            kind: 'missed',
                            label: 'Missed call',
                            timestamp: 'Yesterday',
                        },
                        {
                            id: 'call-3',
                            number: '+15550000003',
                            kind: 'voicemail',
                            timestamp: 'Earlier',
                        },
                    ],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        caller_name: 'Bob',
                        phone_number: '+15550000004',
                    },
                    hasVoicemail: true,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                }),
            );
        });
        await act(async () => {
            historyRenderer!.root.findByProps({ 'aria-label': 'Incoming call' }).props.onClick();
            historyRenderer!.root.findByProps({ 'aria-label': 'Voicemail' }).props.onClick();
            historyRenderer!.root
                .findAll(
                    (node) =>
                        typeof node.props.onClick === 'function' &&
                        node.props['aria-label'] == null,
                )[0]!
                .props.onClick();
            historyRenderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: 'zzz' } });
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
                    entries: [
                        {
                            id: 'call-4',
                            number: '+15550000005',
                            kind: 'incoming',
                            timestamp: 'Later',
                        },
                    ],
                    incomingCallContent: null,
                    hasVoicemail: false,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                }),
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
                }),
            );
        });
        expect(flattenText(historyRenderer!.toJSON())).toContain('No recent calls.');

        const onNavigate = vi.fn();
        const onAction = vi.fn();
        const onDismissIncoming = vi.fn();
        const onBack = vi.fn();
        let phoneRenderer: ReactTestRenderer | null = null;
        await act(async () => {
            phoneRenderer = TestRenderer.create(
                React.createElement(PhoneSimulatorView, {
                    payload: null,
                    phoneCapabilities: { dial: true, voicemail: true, directory: true },
                    screen: 'history',
                    onNavigate,
                    onAction,
                }),
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
                }),
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain(
            'No incoming call for this scenario.',
        );

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: {
                            transcript: 'Incoming call',
                            choices: [],
                            caller_name: 'Bob',
                            phone_number: '+15550000004',
                        },
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
                }),
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Answer call' }).props.onClick();
            phoneRenderer!.root.findByProps({ 'aria-label': 'Decline call' }).props.onClick();
        });
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'answer_call' }));
        expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'ignore_call' }));
        expect(onDismissIncoming).toHaveBeenCalledTimes(2);

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: {
                            transcript: 'Incoming call',
                            choices: [],
                            caller_name: 'Bob',
                            phone_number: '+15550000004',
                        },
                        chosenIndex: null,
                        callHistory: [
                            {
                                id: 'call-1',
                                number: '+15550000001',
                                kind: 'incoming',
                                timestamp: 'Today',
                            },
                        ],
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
                }),
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Add contact' }).props.onClick();
            phoneRenderer!.root.findAllByProps({ children: 'Call' })[0]!.props.onClick();
        });
        expect(onNavigate).toHaveBeenCalledWith('add_contact');
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'dial_phone', dialedNumber: '+15550000001' }),
        );

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
                }),
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain(
            'Contact creation is not configured for this scenario.',
        );
        expect(phoneRenderer!.root.findAllByType('input')).toHaveLength(0);
        await act(async () => {
            phoneRenderer!.root.findByProps({ children: 'Back to contacts' }).props.onClick();
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
                }),
            );
        });
        await act(async () => {
            phoneRenderer!.root.findByProps({ 'aria-label': 'Digit 2 ABC' }).props.onClick();
        });
        await act(async () => {
            phoneRenderer!.root.findByType('form').props.onSubmit({ preventDefault() {} });
        });
        expect(onAction).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'dial_phone', dialedNumber: '2' }),
        );

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
                }),
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
                }),
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No voicemail.');

        await act(async () => {
            phoneRenderer!.update(
                React.createElement(PhoneSimulatorView, {
                    payload: {
                        content: {
                            transcript: 'Incoming call',
                            choices: [],
                            caller_name: 'Bob',
                            phone_number: '+15550000004',
                        },
                        chosenIndex: null,
                        callHistory: [
                            {
                                id: 'call-1',
                                number: '+15550000001',
                                kind: 'incoming',
                                timestamp: 'Today',
                            },
                            {
                                id: 'call-2',
                                number: '+15550000002',
                                kind: 'outgoing',
                                label: 'Outbound call',
                                timestamp: 'Yesterday',
                            },
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
                }),
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('Call History');
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
                }),
            );
        });
        expect(flattenText(phoneRenderer!.toJSON())).toContain('No contacts.');
    });
});
