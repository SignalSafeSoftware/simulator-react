import { describe, expect, it } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { applyDeepLinkToState, getDeepLinkContactsSearch, parseSimulatorSearchParams } from '../src/utils/simulatorDeepLink';
import type { SimulatorSessionState } from '../src/types/session';

function createPayload(): SimulatorSessionState['payload'] {
    return {
        channel: 'browser',
        entryPoint: { app: 'internet', screen: 'landing' },
        email: {
            inbox: [
                {
                    id: 'm1',
                    subject: 'Subject',
                    from: 'sender@example.test',
                    unread: true,
                },
            ],
            selectedMessage: null,
            selectedMessageId: null,
        },
        browser: {
            defaultPageId: 'landing',
            pages: [
                { id: 'landing', url: 'https://example.test', title: 'Landing', layout: 'landing' },
                { id: 'pricing', url: 'https://example.test/pricing', title: 'Pricing', layout: 'content' },
            ],
        },
    };
}

describe('simulatorDeepLink', () => {
    it('opens email detail when a valid message id is requested', () => {
        const state = getInitialSessionState(createPayload());

        const next = applyDeepLinkToState(state, {
            app: 'email',
            messageId: 'm1',
        });

        expect(next.view.activeApp).toBe('email');
        expect(next.view.email.screen).toBe('detail');
        expect(next.view.email.selectedMessageId).toBe('m1');
        expect(next.view.email.stack).toEqual(['list']);
    });

    it('clears the selected email when deep-linking back to the list screen', () => {
        const initial = getInitialSessionState(createPayload());
        const state = {
            ...initial,
            view: {
                ...initial.view,
                email: {
                    ...initial.view.email,
                    screen: 'detail',
                    selectedMessageId: 'm1',
                    stack: ['list'],
                },
            },
        };

        const next = applyDeepLinkToState(state, {
            app: 'email',
            screen: 'list',
        });

        expect(next.view.email.screen).toBe('list');
        expect(next.view.email.selectedMessageId).toBeNull();
        expect(next.view.email.stack).toEqual(['list']);
    });

    it('pushes browser history only when the internet target screen changes', () => {
        const state = getInitialSessionState(createPayload());

        const next = applyDeepLinkToState(state, {
            app: 'internet',
            pageId: 'pricing',
        });

        expect(next.view.activeApp).toBe('internet');
        expect(next.view.internet.screen).toBe('pricing');
        expect(next.view.internet.stack).toEqual(['landing']);
    });

    it('returns search only for phone contacts deep-links', () => {
        expect(getDeepLinkContactsSearch({
            app: 'phone',
            screen: 'contacts',
            search: 'Ada',
        })).toBe('Ada');

        expect(getDeepLinkContactsSearch({
            app: 'phone',
            screen: 'dial',
            search: 'Ada',
        })).toBeUndefined();

        expect(getDeepLinkContactsSearch(null)).toBeUndefined();
    });

    it('parses app-specific deep-link screens and preserves email selection for non-list screens', () => {
        expect(parseSimulatorSearchParams(new URLSearchParams('app=PHONE&screen=contacts'))).toEqual({
            app: 'phone',
            screen: 'contacts',
            messageId: undefined,
            pageId: undefined,
            search: undefined,
        });
        expect(parseSimulatorSearchParams(new URLSearchParams('app=email&screen=compose'))).toEqual({
            app: 'email',
            screen: 'compose',
            messageId: undefined,
            pageId: undefined,
            search: undefined,
        });
        expect(parseSimulatorSearchParams(new URLSearchParams('app=messages&screen=new_thread'))).toEqual({
            app: 'messages',
            screen: 'new_thread',
            messageId: undefined,
            pageId: undefined,
            search: undefined,
        });
        expect(parseSimulatorSearchParams(new URLSearchParams('app=home&screen=store'))).toEqual({
            app: 'home',
            screen: 'store',
            messageId: undefined,
            pageId: undefined,
            search: undefined,
        });
        expect(parseSimulatorSearchParams(new URLSearchParams('app=internet&screen=custom-page'))).toEqual({
            app: 'internet',
            screen: 'custom-page',
            messageId: undefined,
            pageId: undefined,
            search: undefined,
        });
        expect(parseSimulatorSearchParams(new URLSearchParams('app=phone&screen=not-real'))).toBeNull();

        const initial = getInitialSessionState(createPayload());
        const state = {
            ...initial,
            view: {
                ...initial.view,
                email: {
                    ...initial.view.email,
                    screen: 'detail',
                    selectedMessageId: 'm1',
                    stack: ['list'],
                },
            },
        };

        const next = applyDeepLinkToState(state, {
            app: 'email',
            screen: 'compose',
        });
        expect(next.view.activeApp).toBe('email');
        expect(next.view.email.screen).toBe('detail');
        expect(next.view.email.selectedMessageId).toBe('m1');
        expect(next.view.email.stack).toEqual(['list', 'detail']);
    });

    it('preserves compose selection and tolerates unsupported deep-link apps', () => {
        const initial = getInitialSessionState(createPayload());
        const state = {
            ...initial,
            view: {
                ...initial.view,
                email: {
                    ...initial.view.email,
                    screen: 'compose',
                    selectedMessageId: 'm1',
                    stack: ['list'],
                },
            },
        };

        const composeNext = applyDeepLinkToState(state, {
            app: 'email',
            screen: 'compose',
        });
        expect(composeNext.view.email.screen).toBe('compose');
        expect(composeNext.view.email.selectedMessageId).toBe('m1');
        expect(composeNext.view.email.stack).toEqual(['list']);

        const unsupported = applyDeepLinkToState(initial, {
            app: 'bogus' as never,
        });
        expect(unsupported.view.activeApp).toBe('bogus');
        expect(unsupported.view.email).toEqual(initial.view.email);
        expect(unsupported.view.internet).toEqual(initial.view.internet);
    });

    it('falls back for invalid phone and home screens and preserves message counts on thread lists', () => {
        const initial = getInitialSessionState(createPayload());
        const state = {
            ...initial,
            view: {
                ...initial.view,
                phone: {
                    ...initial.view.phone,
                    screen: 'dial',
                    stack: ['history'],
                },
                home: {
                    ...initial.view.home,
                    screen: 'settings',
                },
                messages: {
                    ...initial.view.messages,
                    screen: 'threads',
                    visibleCount: 4,
                    stack: ['old-thread'],
                },
            },
        };

        const phoneNext = applyDeepLinkToState(state, {
            app: 'phone',
            screen: 'not-real',
        } as never);
        expect(phoneNext.view.phone.screen).toBe('dial');
        expect(phoneNext.view.phone.stack).toEqual(['history']);

        const homeNext = applyDeepLinkToState(state, {
            app: 'home',
            screen: 'bogus',
        } as never);
        expect(homeNext.view.home.screen).toBe('settings');

        const messagesNext = applyDeepLinkToState(state, {
            app: 'messages',
            screen: 'threads',
        });
        expect(messagesNext.view.messages.screen).toBe('threads');
        expect(messagesNext.view.messages.visibleCount).toBe(4);
        expect(messagesNext.view.messages.stack).toEqual(['old-thread']);
    });

    it('falls back to the default browser page when requested targets are missing', () => {
        const initial = getInitialSessionState(createPayload());

        const next = applyDeepLinkToState(initial, {
            app: 'internet',
            pageId: 'missing-page',
            screen: '',
        });

        expect(next.view.activeApp).toBe('internet');
        expect(next.view.internet.screen).toBe('landing');
        expect(next.view.internet.stack).toEqual(initial.view.internet.stack);
    });

    it('keeps the current browser screen when no page target is supplied and it still exists', () => {
        const initial = getInitialSessionState(createPayload());
        const state = {
            ...initial,
            view: {
                ...initial.view,
                activeApp: 'internet',
                internet: {
                    ...initial.view.internet,
                    screen: 'pricing',
                    stack: ['landing'],
                },
            },
        };

        const next = applyDeepLinkToState(state, {
            app: 'internet',
        });

        expect(next.view.internet.screen).toBe('pricing');
        expect(next.view.internet.stack).toEqual(['landing']);
    });

    it('falls back to the browser default when a requested internet screen is missing and no pageId is provided', () => {
        const initial = getInitialSessionState(createPayload());

        const next = applyDeepLinkToState(initial, {
            app: 'internet',
            screen: 'missing-screen',
        } as never);

        expect(next.view.internet.screen).toBe('landing');
    });
});
