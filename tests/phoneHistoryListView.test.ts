import type { ReactTestRenderer } from 'react-test-renderer';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhoneHistoryList from '../src/views/phone/PhoneHistoryList';
import PhoneSimulatorView from '../src/views/phone/PhoneSimulatorView';
import PhoneVoicemailView from '../src/views/phone/PhoneVoicemailView';
import { TestRenderer, act } from './reactTestRenderer';
import { flattenText } from './support/phonePanelsSupport';

afterEach(() => {
    vi.useRealTimers();
});

describe('phone history list', () => {
    it('covers explicit history kinds, timestamp search, and non-actionable rows', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        {
                            id: 'v1',
                            number: '+15550000001',
                            kind: 'voicemail',
                            label: 'Voicemail alert',
                            timestamp: 'Monday',
                        },
                        {
                            id: 'o1',
                            number: '+15550000002',
                            kind: 'outgoing',
                            label: 'Out to support',
                            timestamp: 'Tuesday',
                        },
                        {
                            id: 'u1',
                            number: '+15550000003',
                            kind: 'unknown',
                            label: 'Something else',
                            timestamp: 'Wednesday',
                        },
                    ],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        caller_name: 'Caller',
                        phone_number: '+15550000009',
                    },
                    hasVoicemail: true,
                    onSelectIncoming,
                    onSelectVoicemail,
                }),
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Voicemail');
        expect(flattenText(renderer!.toJSON())).toContain('Outbound');
        expect(flattenText(renderer!.toJSON())).toContain('Incoming');

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: 'Tuesday' } });
        });
        const filteredText = flattenText(renderer!.toJSON());
        expect(filteredText).toContain('Tuesday');
        expect(filteredText).not.toContain('Monday');
        expect(filteredText).not.toContain('Wednesday');
    });

    it('covers incoming-number search, custom-kind fallback labels, and unknown passive rows', async () => {
        const onSelectIncoming = vi.fn();
        const onSelectVoicemail = vi.fn();
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        { id: 'custom-1', number: '', kind: 'mystery' as never, timestamp: 'Soon' },
                        {
                            id: 'voice-1',
                            number: '+15550000003',
                            kind: 'voicemail',
                            timestamp: 'Later',
                        },
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
                }),
            );
        });

        expect(flattenText(renderer!.toJSON())).toContain('Unknown');
        expect(flattenText(renderer!.toJSON())).toContain('Call');

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: '0077' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('+1 555 000 0077');
        expect(flattenText(renderer!.toJSON())).not.toContain('Later');

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: 'voice' } });
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
        let renderer: ReactTestRenderer | null = null;

        await act(async () => {
            renderer = TestRenderer.create(
                React.createElement(PhoneHistoryList, {
                    entries: [
                        {
                            id: 'call-1',
                            number: '+15550000001',
                            kind: 'incoming',
                            timestamp: 'Tomorrow',
                        },
                        { id: 'call-2', number: '', kind: 'voicemail', name: 'Mailbox' },
                    ],
                    incomingCallContent: {
                        transcript: 'Incoming',
                        choices: [],
                        phone_number: '+15550009999',
                    },
                    hasVoicemail: false,
                    onSelectIncoming,
                    onSelectVoicemail,
                    onSelectEntry,
                }),
            );
        });

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: 'Tomorrow' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Tomorrow');

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: '9999' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('+15550009999');

        await act(async () => {
            renderer!.root
                .findByProps({ 'aria-label': 'Search calls' })
                .props.onChange({ target: { value: 'Mailbox' } });
        });
        expect(flattenText(renderer!.toJSON())).toContain('Voicemail');

        await act(async () => {
            const clickables = renderer!.root.findAll(
                (node) =>
                    typeof node.props.onClick === 'function' && node.props['aria-label'] == null,
            );
            clickables.at(-1)!.props.onClick();
        });
        expect(onSelectVoicemail).toHaveBeenCalledTimes(1);
        expect(onSelectEntry).not.toHaveBeenCalled();
        expect(onSelectIncoming).not.toHaveBeenCalled();
    });

    it('wires the default voicemail back handler when no explicit handler is provided', async () => {
        const onNavigate = vi.fn();
        let renderer: ReactTestRenderer | null = null;

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
                }),
            );
        });

        await act(async () => {
            renderer!.root.findByType(PhoneVoicemailView).props.onBack();
        });
        expect(onNavigate).toHaveBeenCalledWith('history');
    });
});
