import { describe, expect, it } from 'vitest';
import { actionToInteractionEvent, appOpenedEvent, screenViewedEvent } from '../src/utils/simulatorEventMapper';
import type { SimulatorTemplatePayload, SimulatorViewState } from '../src/types/session';

function createViewState(): SimulatorViewState {
    return {
        activeApp: 'internet',
        showPrimaryMenu: true,
        contactsPanelOpen: false,
        contactsSearchQuery: '',
        email: { screen: 'list', stack: [], selectedMessageId: null },
        messages: { screen: 'threads', stack: [], visibleCount: 0 },
        internet: { screen: 'landing', stack: [] },
        phone: { screen: 'history', stack: [], chosenIndex: null },
        home: { screen: 'home' },
    };
}

function createPayload(): SimulatorTemplatePayload {
    return {
        channel: 'browser',
        templateId: 7,
        templateKey: 'sim-template',
        name: 'Simulator Template',
        runId: 9,
        attemptId: 42,
        topicTags: [],
        entryPoint: { app: 'internet', screen: 'landing' },
        device: null,
        email: null,
        sms: null,
        browser: null,
        phone: null,
        contacts: null,
        directory: null,
        home: null,
    };
}

describe('simulatorEventMapper', () => {
    it('stringifies attempt id in session context', () => {
        const event = actionToInteractionEvent(
            { type: 'report' },
            createViewState(),
            createPayload()
        );

        expect(event?.attempt_id).toBe('42');
        expect(event?.template_id).toBe(7);
    });

    it('uses indexed fallback keys for link and attachment actions', () => {
        const view = createViewState();
        const payload = createPayload();

        const linkEvent = actionToInteractionEvent(
            { type: 'click_link', linkIndex: 3 },
            view,
            payload
        );
        const attachmentEvent = actionToInteractionEvent(
            { type: 'open_attachment', attachmentIndex: 2 },
            view,
            payload
        );
        const downloadEvent = actionToInteractionEvent(
            { type: 'download_attachment', attachmentIndex: 5 },
            view,
            payload
        );

        expect(linkEvent?.action_key).toBe('link_3');
        expect(attachmentEvent?.action_key).toBe('attachment_2');
        expect(downloadEvent?.action_key).toBe('attachment_5');
    });

    it('covers per-app screen lookup and optional action metadata fallbacks', () => {
        const emailView = {
            ...createViewState(),
            activeApp: 'email',
            email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
        } as SimulatorViewState;
        const phoneView = {
            ...createViewState(),
            activeApp: 'phone',
            phone: { screen: 'voicemail', stack: ['history'], chosenIndex: null },
        } as SimulatorViewState;
        const homeView = {
            ...createViewState(),
            activeApp: 'home',
            home: { screen: 'settings' },
        } as SimulatorViewState;

        expect(actionToInteractionEvent({ type: 'open_email', messageId: 'm1' }, emailView, createPayload())).toEqual(
            expect.objectContaining({
                kind: 'email_opened',
                app: 'email',
                screen: 'detail',
                action_key: 'm1',
            })
        );
        expect(actionToInteractionEvent({ type: 'open_voicemail' }, phoneView, null)).toEqual(
            expect.objectContaining({
                kind: 'voicemail_opened',
                app: 'phone',
                screen: 'voicemail',
            })
        );
        expect(actionToInteractionEvent({ type: 'open_settings' }, homeView, createPayload())).toEqual(
            expect.objectContaining({
                kind: 'settings_opened',
                app: 'home',
                screen: 'settings',
            })
        );

        expect(
            actionToInteractionEvent({ type: 'click_link', href: undefined, linkIndex: null } as never, createViewState(), null)
        ).toEqual(
            expect.objectContaining({
                kind: 'link_clicked',
                action_key: undefined,
                metadata: { href: undefined, linkIndex: null, pageId: undefined },
            })
        );
        expect(
            actionToInteractionEvent(
                { type: 'download_attachment', attachmentIndex: null } as never,
                createViewState(),
                createPayload()
            )
        ).toEqual(
            expect.objectContaining({
                kind: 'attachment_downloaded',
                action_key: undefined,
                metadata: { attachmentIndex: null },
            })
        );
        expect(
            actionToInteractionEvent({ type: 'open_page', pageId: undefined } as never, createViewState(), createPayload())
        ).toEqual(
            expect.objectContaining({
                kind: 'page_viewed',
                screen: 'landing',
                action_key: undefined,
                metadata: { pageId: undefined },
            })
        );
    });

    it('returns null for unsupported actions and covers app/screen event helpers', () => {
        const payload = { ...createPayload(), attemptId: null };
        const view = createViewState();

        expect(actionToInteractionEvent({ type: 'unsupported_action' } as never, view, payload)).toBeNull();
        expect(appOpenedEvent('phone', view, payload)).toEqual(
            expect.objectContaining({
                kind: 'app_opened',
                app: 'phone',
                screen: 'history',
                attempt_id: undefined,
            })
        );
        expect(appOpenedEvent('bogus', view, null) as never).toEqual(
            expect.objectContaining({
                kind: 'app_opened',
                app: 'bogus',
                screen: '',
            })
        );
        expect(screenViewedEvent('email', 'compose', view, payload)).toEqual(
            expect.objectContaining({
                kind: 'screen_viewed',
                app: 'email',
                screen: 'compose',
            })
        );
    });

    it('maps contact and directory actions with plain metadata objects', () => {
        const view = createViewState();
        const payload = createPayload();

        const contactEvent = actionToInteractionEvent(
            { type: 'open_contact', contactId: 'contact-42' },
            view,
            payload
        );
        const directoryEvent = actionToInteractionEvent(
            { type: 'view_directory_entry', entryId: 'dir-9' },
            view,
            payload
        );

        expect(contactEvent).toEqual(
            expect.objectContaining({
                kind: 'contact_opened',
                action_key: 'contact-42',
                metadata: { contactId: 'contact-42' },
            })
        );
        expect(directoryEvent).toEqual(
            expect.objectContaining({
                kind: 'directory_entry_viewed',
                action_key: 'dir-9',
                metadata: { entryId: 'dir-9' },
            })
        );
    });

    it('covers empty session context fields and fallback indexed keys', () => {
        const payload = {
            ...createPayload(),
            templateId: null,
            templateKey: undefined,
            runId: null,
            attemptId: 0,
        } as never;

        expect(actionToInteractionEvent({ type: 'report' }, createViewState(), payload)).toEqual(
            expect.objectContaining({
                template_id: undefined,
                template_key: undefined,
                run_id: undefined,
                attempt_id: '0',
            })
        );

        expect(
            actionToInteractionEvent({ type: 'open_attachment', attachmentIndex: 0 }, createViewState(), payload)
        ).toEqual(
            expect.objectContaining({
                kind: 'attachment_opened',
                action_key: 'attachment_0',
            })
        );
    });
});
