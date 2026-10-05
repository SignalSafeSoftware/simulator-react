import type {} from '../src/types/session.js';
import { describe, expect, it } from 'vitest';
import {} from '../src/adapters/device/emailMapper';
import {} from '../src/adapters/device/homeMapper';
import {} from '../src/adapters/device/internetMapper';
import {} from '../src/adapters/device/messagesMapper';
import {} from '../src/adapters/device/phoneMapper';
import {} from '../src/adapters/templateToSession';
import {} from '../src/constants';
import { runSimulatorRealismChecks } from '../src/utils/payload/simulatorRealismChecks';

describe('realism checks', () => {
    it('reports realism blockers and suggestions for implausible examples', () => {
        const emailReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-email',
            name: 'Realism Email',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: null,
            email: {
                inbox: [],
                selectedMessage: {
                    subject: 'Alert',
                    from: 'alert@example.test',
                    body: 'Click here',
                    from_display_name: 'Unknown',
                    links: [{ href: 'https://secure.example.test/login', text: 'Open' }],
                },
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [{ id: 'landing', url: '', title: '', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(emailReport.pass).toBe(false);
        expect(emailReport.blockers.map((issue) => issue.code)).toEqual(
            expect.arrayContaining([
                'realism_email_list_empty',
                'realism_verification_no_contacts',
                'realism_browser_page_no_url_or_title',
            ]),
        );
        expect(emailReport.suggestions.map((issue) => issue.code)).toContain(
            'realism_sender_display_generic',
        );

        const phoneReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-phone',
            name: 'Realism Phone',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: {
                content: { transcript: '', choices: [], phone_number: '', caller_name: '' },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        });
        expect(phoneReport.blockers.map((issue) => issue.code)).toContain(
            'realism_phone_incoming_bare',
        );

        const directoryReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-directory',
            name: 'Realism Directory',
            channel: 'contacts',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'directory' },
            device: null,
            email: null,
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Visit this page' }],
                    links: [{ href: 'https://sms.example.test' }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://sms.example.test',
                        title: 'SMS',
                        layout: 'content',
                    },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(directoryReport.blockers.map((issue) => issue.code)).toContain(
            'realism_phone_directory_empty',
        );

        const messagesReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-messages',
            name: 'Realism Messages',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'thread_detail' },
            device: null,
            email: null,
            sms: {
                thread: { messages: [{ from: 'them', text: 'Visit this page' }] },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://sms.example.test',
                        title: 'SMS',
                        layout: 'content',
                    },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(messagesReport.suggestions.map((issue) => issue.code)).toContain(
            'realism_sms_verification_contacts',
        );

        const browserSuggestionReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-browser-suggestion',
            name: 'Realism Browser Suggestion',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: null,
            email: null,
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://example.test', title: '', layout: 'content' },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(browserSuggestionReport.pass).toBe(true);
        expect(browserSuggestionReport.suggestions.map((issue) => issue.code)).toContain(
            'realism_browser_page_no_title',
        );

        const phoneSuggestionReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-phone-suggestion',
            name: 'Realism Phone Suggestion',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: {
                content: { transcript: '', choices: [], phone_number: '', caller_name: 'Caller' },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        });
        expect(phoneSuggestionReport.suggestions.map((issue) => issue.code)).toContain(
            'realism_phone_incoming_transcript',
        );
    });

    it('passes realism checks for plausible payloads and covers quiet branch paths', () => {
        const realisticReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-clean',
            name: 'Realism Clean',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: null,
            email: {
                inbox: [
                    {
                        id: 'e1',
                        subject: 'Security update',
                        from: 'alert@example.test',
                        from_display_name: 'Alex Example',
                        // @ts-expect-error Exercise handling of extra untyped link metadata on a summary row.
                        links: [{ href: 'https://secure.example.test' }],
                    },
                ],
                selectedMessage: {
                    subject: 'Security update',
                    from: 'alert@example.test',
                    from_display_name: 'Alex Example',
                    body: 'Review the alert.',
                    // @ts-expect-error Exercise handling of an untyped link without display text.
                    links: [{ href: 'https://secure.example.test' }],
                },
                selectedMessageId: 'e1',
            },
            sms: {
                thread: { messages: [{ from: 'them', text: 'Open the secure site' }] },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    null as never,
                    { id: 'landing', url: '', title: 'Security portal', layout: 'content' },
                    {
                        id: 'details',
                        url: 'https://secure.example.test/details',
                        title: 'Details',
                        layout: 'content',
                    },
                ],
            },
            phone: { content: null as never, chosenIndex: null },
            contacts: [{ id: 'c1', displayName: 'Security Team', number: '+15550000001' }],
            directory: [{ id: 'd1', label: 'Security Team', number: '+15550000001' }],
            home: null,
        });

        expect(realisticReport.pass).toBe(true);
        expect(realisticReport.blockers).toEqual([]);
        expect(realisticReport.suggestions).toEqual([]);

        const noEntryScreenReport = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-no-entry-screen',
            name: 'Realism No Entry Screen',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: null as never },
            device: null,
            email: { inbox: [], selectedMessage: null, selectedMessageId: null },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Example',
                        layout: 'content',
                    },
                ],
            },
            phone: { content: null as never, chosenIndex: null },
            contacts: [],
            directory: [],
            home: null,
        });

        expect(noEntryScreenReport.pass).toBe(true);
        expect(noEntryScreenReport.blockers).toEqual([]);
        expect(noEntryScreenReport.suggestions).toEqual([]);
    });

    it('suggests a more believable sender name when only the inbox row has a generic display name', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-inbox-sender',
            name: 'Realism Inbox Sender',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'detail' },
            device: null,
            email: {
                inbox: [
                    {
                        id: 'e1',
                        subject: 'Subject',
                        from: 'sender@example.test',
                        from_display_name: 'Unknown',
                    },
                ],
                selectedMessage: null,
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.suggestions.map((issue) => issue.code)).toContain(
            'realism_sender_display_generic',
        );
    });

    it('does not suggest a sender warning for believable display names', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-specific-sender',
            name: 'Realism Specific Sender',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'detail' },
            device: null,
            email: {
                inbox: [],
                selectedMessage: {
                    subject: 'Subject',
                    from: 'sender@example.test',
                    from_display_name: 'Jamie Rivera',
                    body: 'Hello',
                },
                selectedMessageId: null,
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.suggestions.map((issue) => issue.code)).not.toContain(
            'realism_sender_display_generic',
        );
    });

    it('accepts incoming calls that include a transcript even without a caller name or number', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-phone-transcript-only',
            name: 'Realism Phone Transcript Only',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: {
                content: {
                    transcript: 'This is the help desk.',
                    choices: [],
                    phone_number: '',
                    caller_name: '',
                },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.blockers).toEqual([]);
        expect(report.suggestions).toEqual([]);
    });

    it('accepts phone directory entry points when contacts exist even without directory rows', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-directory-contacts-only',
            name: 'Realism Directory Contacts Only',
            channel: 'contacts',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'DIRECTORY' as never },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: [{ id: 'c1', displayName: 'Support', number: '+15550000001' }],
            directory: [],
            home: null,
        });

        expect(report.blockers.map((issue) => issue.code)).not.toContain(
            'realism_phone_directory_empty',
        );
    });

    it('allows browser pages that have only a title and no url', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-browser-title-only',
            name: 'Realism Browser Title Only',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'landing' },
            device: null,
            email: null,
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [{ id: 'landing', url: '', title: 'Landing', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.blockers).toEqual([]);
        expect(report.suggestions).toEqual([]);
    });

    it('allows incoming calls with only a phone number', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-phone-number-only',
            name: 'Realism Phone Number Only',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: {
                content: {
                    transcript: '',
                    choices: [],
                    phone_number: '+15550000001',
                    caller_name: '',
                },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.blockers).toEqual([]);
        expect(report.suggestions).toEqual([]);
    });

    it('ignores blank sender display names when evaluating realism suggestions', () => {
        const report = runSimulatorRealismChecks({
            templateId: null,
            templateKey: 'realism-blank-sender',
            name: 'Realism Blank Sender',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'detail' },
            device: null,
            email: {
                inbox: [
                    {
                        id: 'e1',
                        subject: 'Subject',
                        from: 'sender@example.test',
                        from_display_name: '   ',
                    },
                ],
                selectedMessage: null,
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });

        expect(report.suggestions).toEqual([]);
    });
});
