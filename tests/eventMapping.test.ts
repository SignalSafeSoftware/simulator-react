import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    actionToInteractionEvent,
    appOpenedEvent,
    screenViewedEvent,
} from '../src/utils/telemetry/simulatorEventMapper';
import { createPayload, createState } from './support/utilityTailSupport';

const originalNodeEnv = process.env.NODE_ENV;

const originalWindow = (globalThis as { window?: unknown }).window;

const originalLocalStorage = (globalThis as { localStorage?: unknown }).localStorage;

afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
    } else {
        (globalThis as { window?: unknown }).window = originalWindow;
    }
    if (originalLocalStorage === undefined) {
        delete (globalThis as { localStorage?: unknown }).localStorage;
    } else {
        (globalThis as { localStorage?: unknown }).localStorage = originalLocalStorage;
    }
    vi.restoreAllMocks();
});

describe('event mapping', () => {
    it('covers event mapping for emitted and skipped simulator actions', () => {
        const view = createState({
            view: {
                activeApp: 'phone',
                phone: { screen: 'history', stack: [], chosenIndex: null },
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 1 },
                internet: { screen: 'pricing', stack: ['landing'] },
                home: { screen: 'settings' },
            },
        }).view;
        const payload = createPayload();

        expect(
            actionToInteractionEvent({ type: 'open_contact', contactId: 'c1' }, view, payload)
                ?.kind,
        ).toBe('contact_opened');
        expect(
            actionToInteractionEvent(
                { type: 'click_link', href: 'https://example.test' },
                view,
                payload,
            )?.kind,
        ).toBe('link_clicked');
        expect(
            actionToInteractionEvent({ type: 'open_attachment', attachmentIndex: 1 }, view, payload)
                ?.kind,
        ).toBe('attachment_opened');
        expect(
            actionToInteractionEvent(
                { type: 'download_attachment', attachmentIndex: 2 },
                view,
                payload,
            )?.kind,
        ).toBe('attachment_downloaded');
        expect(
            actionToInteractionEvent({ type: 'answer_call', choiceIndex: 0 }, view, payload)?.kind,
        ).toBe('call_answered');
        expect(actionToInteractionEvent({ type: 'ignore_call' }, view, payload)?.kind).toBe(
            'call_ignored',
        );
        expect(
            actionToInteractionEvent({ type: 'dial_phone', dialedNumber: '+1555' }, view, payload)
                ?.kind,
        ).toBe('dial_started');
        expect(
            actionToInteractionEvent(
                { type: 'submit_form', submitMetadata: { ok: true } },
                view,
                payload,
            )?.kind,
        ).toBe('form_submitted');
        expect(
            actionToInteractionEvent({ type: 'send_reply', replyText: 'Reply' }, view, payload)
                ?.kind,
        ).toBe('message_sent');
        expect(
            actionToInteractionEvent({ type: 'open_page', pageId: 'pricing' }, view, payload)
                ?.screen,
        ).toBe('pricing');
        expect(actionToInteractionEvent({ type: 'open_voicemail' }, view, payload)?.kind).toBe(
            'voicemail_opened',
        );
        expect(actionToInteractionEvent({ type: 'open_store' }, view, payload)?.kind).toBe(
            'store_opened',
        );
        expect(actionToInteractionEvent({ type: 'open_settings' }, view, payload)?.kind).toBe(
            'settings_opened',
        );
        expect(actionToInteractionEvent({ type: 'report' }, view, payload)?.kind).toBe(
            'report_clicked',
        );
        expect(
            actionToInteractionEvent(
                { type: 'download_click', downloadTarget: '/file.exe' },
                view,
                payload,
            )?.kind,
        ).toBe('download_clicked');
        expect(actionToInteractionEvent({ type: 'check_contact' }, view, payload)?.kind).toBe(
            'check_contact_clicked',
        );
        expect(actionToInteractionEvent({ type: 'check_contacts' }, view, payload)?.kind).toBe(
            'check_contact_clicked',
        );
        expect(
            actionToInteractionEvent({ type: 'view_directory_entry', entryId: 'd1' }, view, payload)
                ?.kind,
        ).toBe('directory_entry_viewed');
        expect(
            actionToInteractionEvent({ type: 'search_contacts', query: 'Ada' }, view, payload)
                ?.kind,
        ).toBe('search_performed');
        expect(
            actionToInteractionEvent(
                { type: 'navigate_screen', app: 'email', screen: 'list' },
                view,
                payload,
            ),
        ).toBeNull();
        expect(
            actionToInteractionEvent({ type: 'open_app', app: 'email' }, view, payload),
        ).toBeNull();
        expect(
            actionToInteractionEvent({ type: 'switch_channel', channel: 'email' }, view, payload),
        ).toBeNull();
        expect(appOpenedEvent('messages', view, payload)).toEqual(
            expect.objectContaining({
                kind: 'app_opened',
                app: 'messages',
                screen: 'thread_detail',
            }),
        );
        expect(screenViewedEvent('internet', 'pricing', view, payload)).toEqual(
            expect.objectContaining({ kind: 'screen_viewed', app: 'internet', screen: 'pricing' }),
        );
        expect(
            actionToInteractionEvent({ type: 'open_email', messageId: 'm1' }, view, null)
                ?.template_id,
        ).toBeUndefined();
    });
});
