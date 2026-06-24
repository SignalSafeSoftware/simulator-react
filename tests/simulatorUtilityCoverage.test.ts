import { describe, expect, it } from 'vitest';
import {
    appToChannel,
    mapContacts,
    mapDevice,
    mapDirectory,
    mapEmail,
    mapHome,
    mapInternet,
    mapMessages,
    mapPhone,
} from '../src/adapters/fullDeviceToSession';
import { templateDetailToPayload } from '../src/adapters/templateToSession';
import { DEFAULT_BROWSER_SUBMIT_TARGET } from '../src/constants';
import { applyPreviewFallback, PREVIEW_PLACEHOLDER_ID_PREFIX } from '../src/utils/previewFallbackWorld';
import { runSimulatorRealismChecks } from '../src/utils/simulatorRealismChecks';
import { buildSimulatorNavGraph, simulatorNavGraphToJson } from '../src/utils/simulatorNavGraph';

describe('simulator utility coverage', () => {
    it('applies preview fallbacks only when entry targets missing content', () => {
        const emailFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-email',
            name: 'Preview Email',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'detail' },
            device: null,
            email: { inbox: [], selectedMessage: null, selectedMessageId: null },
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(emailFallback.fallbackApplied).toBe(true);
        expect(emailFallback.payload.email?.selectedMessageId).toContain(PREVIEW_PLACEHOLDER_ID_PREFIX);

        const messagesFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-sms',
            name: 'Preview SMS',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'thread_detail' },
            device: null,
            email: null,
            sms: { thread: { messages: [] }, visibleMessageCount: 0 },
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(messagesFallback.payload.sms?.thread?.messages?.[0]?.text).toContain('Preview placeholder');

        const browserFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-browser',
            name: 'Preview Browser',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'missing' },
            device: null,
            email: null,
            sms: null,
            browser: { defaultPageId: 'landing', pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'landing' }] },
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(browserFallback.payload.browser?.defaultPageId).toBe('missing');

        const phoneFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-phone',
            name: 'Preview Phone',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'incoming_call' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: { content: null as never, chosenIndex: null },
            contacts: null,
            directory: null,
            home: null,
        });
        expect(phoneFallback.payload.phone?.content?.transcript).toContain('Preview placeholder');

        const messagesThreadsFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-sms-threads',
            name: 'Preview SMS Threads',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'threads' },
            device: null,
            email: null,
            sms: { thread: { messages: [{ from: 'them', text: 'Existing' }] }, visibleMessageCount: 1 },
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(messagesThreadsFallback.fallbackApplied).toBe(true);
        expect(messagesThreadsFallback.payload.sms?.thread?.messages?.[0]?.text).toContain('Preview placeholder');

        const browserNullFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-browser-null',
            name: 'Preview Browser Null',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'landing' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(browserNullFallback.payload.browser?.defaultPageId).toContain(PREVIEW_PLACEHOLDER_ID_PREFIX);

        const noPhoneFallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-phone-directory',
            name: 'Preview Phone Directory',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'phone', screen: 'directory' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(noPhoneFallback.fallbackApplied).toBe(false);

        const unchanged = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-unchanged',
            name: 'Preview Unchanged',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: null,
            email: {
                inbox: [{ id: 'e1', subject: 'Ready', from: 'sender@example.test' }],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(unchanged.fallbackApplied).toBe(false);
    });

    it('applies an email list fallback when the email slice is entirely missing', () => {
        const fallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-email-list-null',
            name: 'Preview Email List Null',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });

        expect(fallback.fallbackApplied).toBe(true);
        expect(fallback.payload.email?.inbox[0]?.subject).toContain('Preview placeholder');
    });

    it('keeps browser content unchanged when the entry screen already exists', () => {
        const payload = {
            templateId: null,
            templateKey: 'preview-browser-existing',
            name: 'Preview Browser Existing',
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
                pages: [{ id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'content' }],
            },
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        } as const;

        const fallback = applyPreviewFallback(payload as never);

        expect(fallback.fallbackApplied).toBe(false);
        expect(fallback.payload.browser?.pages[0]?.title).toBe('Landing');
    });

    it('uses the preview placeholder landing id when browser entry screen is missing', () => {
        const fallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-browser-default-screen',
            name: 'Preview Browser Default Screen',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: null as never },
            device: null,
            email: null,
            sms: null,
            browser: { defaultPageId: 'other', pages: [] },
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });

        expect(fallback.fallbackApplied).toBe(true);
        expect(fallback.payload.browser?.defaultPageId).toContain(PREVIEW_PLACEHOLDER_ID_PREFIX);
    });

    it('leaves the payload unchanged when no entry point is defined', () => {
        const payload = {
            templateId: null,
            templateKey: 'preview-no-entry',
            name: 'Preview No Entry',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: null,
            email: null,
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        } as const;

        const fallback = applyPreviewFallback(payload as never);

        expect(fallback.fallbackApplied).toBe(false);
        expect(fallback.payload).toBe(payload);
    });

    it('does not apply an email detail fallback when a selected message already exists', () => {
        const fallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-email-detail-existing',
            name: 'Preview Email Detail Existing',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'detail' },
            device: null,
            email: {
                inbox: [],
                selectedMessage: { subject: 'Present', from: 'sender@example.test', body: 'Body' },
                selectedMessageId: 'm1',
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });

        expect(fallback.fallbackApplied).toBe(false);
        expect(fallback.payload.email?.selectedMessage?.subject).toBe('Present');
    });

    it('does not apply a messages thread-detail fallback when messages already exist', () => {
        const fallback = applyPreviewFallback({
            templateId: null,
            templateKey: 'preview-sms-thread-existing',
            name: 'Preview SMS Thread Existing',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'thread_detail' },
            device: null,
            email: null,
            sms: {
                thread: { messages: [{ from: 'them', text: 'Existing thread message' }] },
                visibleMessageCount: 1,
            },
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });

        expect(fallback.fallbackApplied).toBe(false);
        expect(fallback.payload.sms?.thread?.messages?.[0]?.text).toBe('Existing thread message');
    });

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
            browser: { defaultPageId: 'landing', pages: [{ id: 'landing', url: '', title: '', layout: 'content' }] },
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
            ])
        );
        expect(emailReport.suggestions.map((issue) => issue.code)).toContain('realism_sender_display_generic');

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
            phone: { content: { transcript: '', choices: [], phone_number: '', caller_name: '' }, chosenIndex: null },
            contacts: [],
            directory: [],
            home: null,
        });
        expect(phoneReport.blockers.map((issue) => issue.code)).toContain('realism_phone_incoming_bare');

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
                thread: { messages: [{ from: 'them', text: 'Visit this page' }], links: [{ href: 'https://sms.example.test' }] as never },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [{ id: 'landing', url: 'https://sms.example.test', title: 'SMS', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(directoryReport.blockers.map((issue) => issue.code)).toContain('realism_phone_directory_empty');

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
                pages: [{ id: 'landing', url: 'https://sms.example.test', title: 'SMS', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(messagesReport.suggestions.map((issue) => issue.code)).toContain('realism_sms_verification_contacts');

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
                pages: [{ id: 'landing', url: 'https://example.test', title: '', layout: 'content' }],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        });
        expect(browserSuggestionReport.pass).toBe(true);
        expect(browserSuggestionReport.suggestions.map((issue) => issue.code)).toContain('realism_browser_page_no_title');

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
            phone: { content: { transcript: '', choices: [], phone_number: '', caller_name: 'Caller' }, chosenIndex: null },
            contacts: [],
            directory: [],
            home: null,
        });
        expect(phoneSuggestionReport.suggestions.map((issue) => issue.code)).toContain('realism_phone_incoming_transcript');
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
                        links: [{ href: 'https://secure.example.test' }],
                    },
                ],
                selectedMessage: {
                    subject: 'Security update',
                    from: 'alert@example.test',
                    from_display_name: 'Alex Example',
                    body: 'Review the alert.',
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
                    { id: 'details', url: 'https://secure.example.test/details', title: 'Details', layout: 'content' },
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
            browser: { defaultPageId: 'landing', pages: [{ id: 'landing', url: 'https://example.test', title: 'Example', layout: 'content' }] },
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
                inbox: [{ id: 'e1', subject: 'Subject', from: 'sender@example.test', from_display_name: 'Unknown' }],
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

        expect(report.suggestions.map((issue) => issue.code)).toContain('realism_sender_display_generic');
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

        expect(report.suggestions.map((issue) => issue.code)).not.toContain('realism_sender_display_generic');
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
                content: { transcript: 'This is the help desk.', choices: [], phone_number: '', caller_name: '' },
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

        expect(report.blockers.map((issue) => issue.code)).not.toContain('realism_phone_directory_empty');
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
                content: { transcript: '', choices: [], phone_number: '+15550000001', caller_name: '' },
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
                inbox: [{ id: 'e1', subject: 'Subject', from: 'sender@example.test', from_display_name: '   ' }],
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

    it('builds nav graphs and maps full-device payload sections', () => {
        const payload = {
            templateId: 1,
            templateKey: 'graph-world',
            name: 'Graph World',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'email', screen: 'list' },
            device: {
                mainMenuItems: [
                    { id: 'email', label: 'Email' },
                    { id: 'messages', label: 'Messages' },
                    { id: 'internet', label: 'Internet' },
                    { id: 'phone', label: 'Phone' },
                    { id: 'home', label: 'Home' },
                ],
                secondaryDefaults: { phone: 'directory' },
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the site',
                    links: [{ href: 'https://site.example.test/login', text: 'Login' }],
                },
                selectedMessageId: 'e1',
            },
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Message body' }],
                    links: [{ href: 'https://site.example.test/result' }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://site.example.test', title: 'Landing', layout: 'landing', buttons: [{ label: 'Go', targetPageId: 'login' }] },
                    { id: 'login', url: 'https://site.example.test/login', title: 'Login', layout: 'login', submitTargetPageId: 'result' },
                    { id: 'result', url: 'https://site.example.test/result', title: 'Result', layout: 'result' },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [{ id: 'c1', displayName: 'Helpdesk', number: '+15550001111' }],
            directory: [{ id: 'd1', label: 'Helpdesk', number: '+15550001111' }],
            home: { widgets: [{ id: 'w1', label: 'Widget' }], featuredApps: [], settingsSections: [] },
        };

        const graph = buildSimulatorNavGraph(payload);
        expect(graph.entry).toEqual({ app: 'email', screen: 'list' });
        expect(graph.nodes.some((node) => node.id === 'internet:landing')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'main_menu')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'button_click')).toBe(true);
        expect(graph.edges.some((edge) => edge.action === 'click_link')).toBe(true);
        expect(simulatorNavGraphToJson(graph, false)).toContain('"entry"');

        expect(appToChannel('messages')).toBe('sms');
        expect(appToChannel('internet')).toBe('browser');
        expect(appToChannel('home')).toBe('home');

        expect(mapDevice(null as never)).toBeNull();
        expect(
            mapDevice({
                main_menu_items: [
                    { id: 'email', label: 'Email' },
                    { id: 'phone' },
                    null,
                ],
                secondary_defaults: { phone: 'history' },
            } as never)
        ).toEqual({
            mainMenuItems: [
                { id: 'email', label: 'Email', app: undefined },
                { id: 'phone', label: 'phone', app: undefined },
            ],
            secondaryDefaults: { phone: 'history' },
        });

        expect(mapDirectory([{ id: 'd1', label: 'Directory', number: '1' }, { id: 'bad' }])).toHaveLength(1);
        expect(mapContacts([{ display_name: 'Ada', id: 'c1', number: '123', email: 'ada@example.test' }, null] as never)).toEqual([
            { id: 'c1', displayName: 'Ada', number: '123', email: 'ada@example.test' },
        ]);

        const email = mapEmail({
            messages: [],
            detail: {
                id: 'm1',
                subject: 'Hello',
                from_addr: 'sender@example.test',
                body: 'Body',
                from_display_name: 'Sender',
                attachment_name: 'invoice.pdf',
                attachment_behavior: 'download',
                links: [{ href: 'https://detail.example.test', text: 'Open' }],
            },
        } as never);
        expect(email?.selectedMessage?.attachment_behavior).toBe('download');
        expect(email?.inbox?.[0]?.id).toBe('m1');

        const emailWithoutArrayLinks = mapEmail({
            messages: [],
            detail: {
                id: 'm2',
                subject: 'Hello',
                from_addr: 'sender@example.test',
                body: 'Body',
                links: { href: 'https://detail.example.test' },
            },
        } as never);
        expect(emailWithoutArrayLinks?.selectedMessage?.links).toBeUndefined();

        const messages = mapMessages({
            thread_detail: {
                messages: [{ from: 'me', text: 'Sent', attachment: { label: 'File', url: '/file' } }],
                sender_display_name: 'Security Team',
                sender_number: '+1555',
                unread: true,
            },
            threads: [{ id: 't1', snippet: 'Preview', contact_name: 'Security Team', contact_number: '+1555', unread: true }],
        } as never);
        expect(messages?.thread.messages[0]).toEqual(expect.objectContaining({ from: 'me', text: 'Sent' }));
        expect(messages?.threads?.[0]?.preview).toBe('Preview');

        const phone = mapPhone({
            incoming_call: { transcript: '', phone_number: '+1555', caller_name: 'Caller' },
            history: [{ id: 'call-1', number: '+1555', name: 'Caller', direction: 'out', timestamp: 'Now' }],
            voicemail: { transcript: 'Leave a message', caller_name: 'Caller', timestamp: 'Later' },
        } as never);
        expect(phone?.content?.transcript).toBe('Incoming call.');
        expect(phone?.callHistory?.[0]?.kind).toBe('outgoing');
        expect(phone?.voicemailTranscript).toBe('Leave a message');

        const internet = mapInternet({
            pages: [{ id: 'landing', url: 'portal.example.test', title: '', layout: 'login' }],
            forms: [{ page_id: 'landing', fields: [{ name: 'email', type: 'email', label: 'Email' }] }],
        } as never);
        expect(internet?.pages.some((page) => page.id === DEFAULT_BROWSER_SUBMIT_TARGET)).toBe(true);
        expect(internet?.pages[0]?.url).toBe('https://portal.example.test/');

        const home = mapHome({
            home: { widgets: [{ id: 'w1', type: 'news', label: 'News' }] },
            store: { featured_apps: [{ id: 'app-1', name: 'App' }] },
            settings: { sections: [{ id: 's1', title: 'General' }] },
        } as never);
        expect(home).toEqual({
            widgets: [{ id: 'w1', type: 'news', label: 'News' }],
            featuredApps: [{ id: 'app-1', name: 'App' }],
            settingsSections: [{ id: 's1', title: 'General' }],
        });

        const sparseHome = mapHome({
            home: { widgets: {} },
            store: { featured_apps: {} },
            settings: { sections: {} },
        } as never);
        expect(sparseHome).toEqual({
            widgets: [],
            featuredApps: [],
            settingsSections: [],
        });
    });

    it('covers nav graph fallback entry points and unresolved link skips', () => {
        const fallbackGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-fallback',
            name: 'Graph Fallback',
            channel: 'contacts',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'phone', label: 'Phone' }, { id: 'internet', label: 'Internet' }],
                secondaryDefaults: { phone: 'directory' },
            },
            email: null,
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Open this link' }],
                    links: [{ href: 'https://missing.example.test' }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://site.example.test', title: '', layout: 'content', submitTargetPageId: 'landing', buttons: [] },
                    { id: 'pricing', url: 'https://site.example.test/pricing', title: 'Pricing', layout: 'content', buttons: [] },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(fallbackGraph.entry).toEqual({ app: 'phone', screen: 'directory' });
        expect(fallbackGraph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'internet:landing', label: '' }),
                expect.objectContaining({ id: 'phone:directory', label: 'directory' }),
            ])
        );
        expect(fallbackGraph.edges.some((edge) => edge.action === 'form_submit')).toBe(false);
        expect(fallbackGraph.edges.some((edge) => edge.action === 'click_link')).toBe(false);
    });

    it('covers nav graph default screens for messages and home apps', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-messages-home',
            name: 'Graph Messages Home',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'messages', label: 'Messages' }, { id: 'home', label: 'Home' }],
                secondaryDefaults: { home: 'settings' },
            },
            email: null,
            sms: {
                thread: { messages: [{ from: 'them', text: 'Hello' }] },
                visibleMessageCount: 1,
            },
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: {
                widgets: [{ id: 'w1', label: 'Widget' }],
                featuredApps: [],
                settingsSections: [],
            },
        } as never);

        expect(graph.entry).toEqual({ app: 'messages', screen: 'threads' });
        expect(graph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'messages:threads', label: 'threads' }),
                expect.objectContaining({ id: 'home:settings', label: 'settings' }),
            ])
        );
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ from: 'messages:threads', to: 'home:settings', action: 'main_menu' }),
                expect.objectContaining({ from: 'messages:threads', to: 'messages:thread_detail', action: 'open_thread' }),
                expect.objectContaining({ from: 'messages:threads', to: 'messages:new_thread', action: 'new_thread' }),
            ])
        );
    });

    it('adds browser form-submit edges and falls back to phone history defaults', () => {
        const phoneGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-phone-browser',
            name: 'Graph Phone Browser',
            channel: 'phone',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'phone', label: 'Phone' }, { id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the real site',
                    links: [{ href: 'https://known.example.test/login', text: 'Known' }, { href: 'https://unknown.example.test', text: 'Unknown' }],
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://known.example.test',
                        title: 'Landing',
                        layout: 'content',
                        buttons: [],
                    },
                    {
                        id: 'login',
                        url: 'https://known.example.test/login',
                        title: 'Login',
                        layout: 'login',
                        submitTargetPageId: 'result',
                    },
                    {
                        id: 'result',
                        url: 'https://known.example.test/result',
                        title: 'Result',
                        layout: 'result',
                    },
                ],
            },
            phone: {
                content: { transcript: 'Incoming call', choices: [] },
                chosenIndex: null,
            },
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(phoneGraph.entry).toEqual({ app: 'phone', screen: 'history' });

        const browserGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-browser-submit',
            name: 'Graph Browser Submit',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'internet', screen: 'login' },
            device: {
                mainMenuItems: [{ id: 'email', label: 'Email' }, { id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open the real site',
                    links: [{ href: 'https://known.example.test/login', text: 'Known' }, { href: 'https://unknown.example.test', text: 'Unknown' }],
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: 'login',
                pages: [
                    { id: 'landing', url: 'https://known.example.test', title: 'Landing', layout: 'content' },
                    {
                        id: 'login',
                        url: 'https://known.example.test/login',
                        title: 'Login',
                        layout: 'login',
                        submitTargetPageId: 'result',
                        buttons: [{ label: 'Continue', targetPageId: 'result' }],
                    },
                    { id: 'result', url: 'https://known.example.test/result', title: 'Result', layout: 'result' },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(browserGraph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ from: 'internet:login', to: 'internet:result', action: 'form_submit' }),
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:login',
                    action: 'click_link',
                    label: 'https://known.example.test/login',
                }),
            ])
        );
        expect(
            browserGraph.edges.some(
                (edge) => edge.action === 'click_link' && edge.label === 'https://unknown.example.test'
            )
        ).toBe(false);
    });

    it('covers nav graph email fallback links, unknown entry fallback, and pretty JSON output', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-email-fallback',
            name: 'Graph Email Fallback',
            channel: 'unknown' as never,
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'email', label: 'Email' }, { id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [
                    {
                        id: 'e1',
                        subject: 'Inbox',
                        from: 'sender@example.test',
                        links: [{ href: 'site.example.test/login', text: 'Login' }],
                    } as never,
                ],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: {
                defaultPageId: undefined,
                pages: [
                    {
                        id: 'landing',
                        url: 'https://site.example.test/',
                        layout: 'content',
                        buttons: [{ label: 'Open login', targetPageId: 'login' }],
                    } as never,
                    { id: 'login', url: 'https://site.example.test/login', layout: 'content' } as never,
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'email', screen: 'list' });
        expect(graph.nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'internet:landing', label: 'landing' }),
                expect.objectContaining({ id: 'internet:login', label: 'login' }),
            ])
        );
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:login',
                    action: 'click_link',
                    label: 'site.example.test/login',
                }),
            ])
        );
        expect(simulatorNavGraphToJson(graph)).toContain('\n  "entry"');
    });

    it('covers nav graph browser defaults, blank href skips, and undefined click-link labels', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-browser-defaults',
            name: 'Graph Browser Defaults',
            channel: 'browser',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: null,
            device: {
                mainMenuItems: [{ id: 'internet', label: 'Internet' }, { id: 'email', label: 'Email' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: {
                    subject: 'Inbox',
                    from: 'sender@example.test',
                    body: 'Open it',
                    links: [{ href: undefined, text: 'No href' }, { href: '   ', text: 'Blank href' }] as never,
                },
                selectedMessageId: 'e1',
            },
            sms: null,
            browser: {
                defaultPageId: undefined,
                pages: [
                    { id: 'landing', url: '', title: 'Landing', layout: 'content', buttons: [] },
                    { id: 'target', url: '', title: 'Target', layout: 'content', buttons: [] },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'internet', screen: 'landing' });
        expect(graph.edges).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: 'email:detail',
                    to: 'internet:landing',
                    action: 'click_link',
                    label: '   ',
                }),
            ])
        );

        const smsGraph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-sms-undefined-label',
            name: 'Graph SMS Undefined Label',
            channel: 'sms',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'messages', screen: 'thread_detail' },
            device: {
                mainMenuItems: [{ id: 'messages', label: 'Messages' }, { id: 'internet', label: 'Internet' }],
                secondaryDefaults: {},
            },
            email: null,
            sms: {
                thread: {
                    messages: [{ from: 'them', text: 'Open target' }],
                    links: [{ href: 'https://known.example.test/target' }, { href: undefined }] as never,
                },
                visibleMessageCount: 1,
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    { id: 'landing', url: 'https://known.example.test', title: 'Landing', layout: 'content' },
                    { id: 'target', url: 'https://known.example.test/target', title: 'Target', layout: 'content' },
                ],
            },
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(smsGraph.edges.some((edge) => edge.action === 'click_link')).toBe(false);
    });

    it('falls back to list defaults for unsupported entry apps in nav graphs', () => {
        const graph = buildSimulatorNavGraph({
            templateId: null,
            templateKey: 'graph-bogus-entry',
            name: 'Graph Bogus Entry',
            channel: 'email',
            topicTags: [],
            runId: null,
            attemptId: null,
            entryPoint: { app: 'bogus' as never, screen: null as never },
            device: {
                mainMenuItems: [{ id: 'email', label: 'Email' }],
                secondaryDefaults: {},
            },
            email: {
                inbox: [{ id: 'e1', subject: 'Inbox', from: 'sender@example.test' }],
                selectedMessage: null,
                selectedMessageId: null,
            },
            sms: null,
            browser: null,
            phone: null,
            contacts: [],
            directory: [],
            home: null,
        } as never);

        expect(graph.entry).toEqual({ app: 'bogus', screen: 'list' });
    });

    it('maps template details into stable payloads for full-device and empty inputs', () => {
        const empty = templateDetailToPayload({
            id: 1,
            key: 'empty-template',
            name: '',
            channel: 'browser',
            topics: [{ key: 'phish', name: 'Phishing' }],
            simulator: null,
        } as never);
        expect(empty.channel).toBe('browser');
        expect(empty.entryPoint).toBeNull();
        expect(empty.name).toBe('');

        const invalidEntry = templateDetailToPayload({
            id: 2,
            key: 'invalid-entry',
            name: 'Invalid Entry',
            channel: 'sms',
            topics: [],
            simulator: { entry_point: { app: 'not-real' } },
        } as never);
        expect(invalidEntry.channel).toBe('sms');
        expect(invalidEntry.entryPoint).toBeNull();

        const full = templateDetailToPayload(
            {
                id: 3,
                key: 'full-template',
                name: 'Full Template',
                channel: 'email',
                topics: [{ key: '', name: '' }],
                simulator: {
                    entry_point: { app: 'internet', screen: 'landing' },
                    device: {
                        main_menu_items: [{ id: 'internet', label: 'Internet' }],
                        secondary_defaults: { internet: 'landing' },
                    },
                    email: {
                        messages: [],
                        detail: null,
                    },
                    messages: {
                        thread_detail: { messages: [{ from: 'them', text: 'Hello' }] },
                    },
                    internet: {
                        pages: [{ id: 'landing', url: 'example.test', title: 'Landing', layout: 'content' }],
                    },
                    phone: {
                        incoming_call: { transcript: 'Incoming call.' },
                    },
                    contacts: [{ display_name: 'Ada' }],
                    directory: [{ id: 'dir-1', label: 'Directory' }],
                    home: { home: { widgets: [] }, store: { featured_apps: [] }, settings: { sections: [] } },
                },
            } as never,
            { runId: 9, attemptId: 10 }
        );

        expect(full.channel).toBe('browser');
        expect(full.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(full.runId).toBe(9);
        expect(full.attemptId).toBe(10);
        expect(full.topicTags).toEqual([{ key: '', name: '' }]);
        expect(full.contacts?.[0]?.displayName).toBe('Ada');
        expect(full.browser?.defaultPageId).toBe('landing');
    });
});
