import { describe, expect, it } from 'vitest';
import { templateDetailToPayload } from '../src/adapters/templateToSession';
import { type SimulatorTemplateDetail } from '../src/types/template.js';

describe('templateDetailToPayload', () => {
    it('sanitizes object-valued display fields that would otherwise crash preview rendering', () => {
        const detail = {
            id: 1,
            channel: 'browser',
            key: 'preview-template',
            name: { rich: 'Preview Template' },
            is_master: false,
            is_active: true,
            company: 1,
            topics: [],
            created_on: '2026-01-01T00:00:00Z',
            updated_on: '2026-01-01T00:00:00Z',
            description: '',
            content_json: {},
            simulator_json: null,
            simulator: {
                entry_point: { app: 'internet', screen: { nested: 'landing' } },
                device: {
                    main_menu_items: [
                        {
                            id: 'browser',
                            label: { app: 'email', screen: 'list' },
                            app: 'internet',
                        },
                    ],
                },
                internet: {
                    pages: [
                        {
                            id: 'landing',
                            url: 'example.test',
                            title: { rich: 'object' },
                            layout: 'login',
                        },
                    ],
                    forms: [
                        {
                            id: 'login-form',
                            page_id: 'landing',
                            fields: [
                                {
                                    name: 'username',
                                    type: 'text',
                                    label: { nested: 'label' },
                                },
                            ],
                        },
                    ],
                },
                email: {
                    detail: {
                        id: 'm1',
                        subject: { nested: 'subject' },
                        from: { nested: 'from' },
                        body: { nested: 'body' },
                        links: [
                            {
                                href: { nested: 'href' },
                                text: { nested: 'text' },
                            },
                        ],
                    },
                },
            },
            thread_id: null,
            reply_to_message: null,
            attachment_name: '',
            attachment_type: '',
            attachment_behavior: '',
            messages: [],
            browser_template: null,
        } as unknown as SimulatorTemplateDetail;

        const payload = templateDetailToPayload(detail);

        expect(payload.name).toBe('preview-template');
        expect(payload.entryPoint?.screen).toBe('');
        expect(payload.browser?.pages[0]?.title).toBe('Page');
        expect(payload.browser?.pages[0]?.formFields?.[0]?.label).toBe('Field');
        expect(payload.device?.mainMenuItems[0]?.label).toBe('browser');

        expect(payload.email?.selectedMessage?.subject).toBe('');
        expect(payload.email?.selectedMessage?.from).toBe('');
        expect(payload.email?.selectedMessage?.body).toBe('');
        expect(payload.email?.selectedMessage?.links).toBeUndefined();
    });

    it('adds template identity without using the transport channel for routing', () => {
        const payload = templateDetailToPayload(
            {
                id: 2,
                key: 'test',
                name: 'Template',
                channel: 'email',
                topics: [{ key: 'topic', name: 'Topic' }],
                simulator: { entry_point: { app: 'messages', screen: 'threads' } },
            } as SimulatorTemplateDetail,
            { runId: 5, attemptId: 6 },
        );
        expect(payload).toMatchObject({
            templateId: 2,
            templateKey: 'test',
            name: 'Template',
            channel: 'sms',
            runId: 5,
            attemptId: 6,
            topicTags: [{ key: 'topic', name: 'Topic' }],
            entryPoint: { app: 'messages', screen: 'threads' },
        });
    });

    it.each([null, {}, { entry_point: { app: 'pager', screen: 'home' } }])(
        'rejects missing or invalid device entry points instead of falling back to channel',
        (simulator) => {
            expect(() =>
                templateDetailToPayload({
                    id: 1,
                    channel: 'phone',
                    simulator,
                } as unknown as SimulatorTemplateDetail),
            ).toThrow('entry_point');
        },
    );

    it('reads the device once and retains metadata defaults for imperfect API display fields', () => {
        let reads = 0;
        const detail = {
            id: 4,
            key: null,
            name: null,
            topics: [{}, { key: 'topic-key' }],
            get simulator() {
                reads += 1;
                return { entry_point: { app: 'phone', screen: 'history' } };
            },
        } as unknown as SimulatorTemplateDetail;
        const payload = templateDetailToPayload(detail);
        expect(reads).toBe(1);
        expect(payload.name).toBe('Simulator');
        expect(payload.topicTags).toEqual([
            { key: 'topic-0', name: 'Topic 1' },
            { key: 'topic-key', name: 'topic-key' },
        ]);
        expect(payload.channel).toBe('phone');
    });
});
