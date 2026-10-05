import { describe, expect, it } from 'vitest';
import {
    applyPreviewFallback,
    PREVIEW_PLACEHOLDER_ID_PREFIX,
} from '../src/utils/preview/previewFallbackWorld';

describe('preview fallback world', () => {
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
        expect(emailFallback.payload.email?.selectedMessageId).toContain(
            PREVIEW_PLACEHOLDER_ID_PREFIX,
        );

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
        expect(messagesFallback.payload.sms?.thread?.messages?.[0]?.text).toContain(
            'Preview placeholder',
        );

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
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'landing',
                    },
                ],
            },
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
            sms: {
                thread: { messages: [{ from: 'them', text: 'Existing' }] },
                visibleMessageCount: 1,
            },
            browser: null,
            phone: null,
            contacts: null,
            directory: null,
            home: null,
        });
        expect(messagesThreadsFallback.fallbackApplied).toBe(true);
        expect(messagesThreadsFallback.payload.sms?.thread?.messages?.[0]?.text).toContain(
            'Preview placeholder',
        );

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
        expect(browserNullFallback.payload.browser?.defaultPageId).toContain(
            PREVIEW_PLACEHOLDER_ID_PREFIX,
        );

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
                pages: [
                    {
                        id: 'landing',
                        url: 'https://example.test',
                        title: 'Landing',
                        layout: 'content',
                    },
                ],
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
});
