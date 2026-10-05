import { afterEach, describe, expect, it, vi } from 'vitest';
import { getScreenContextLabel, getScreenMetadata } from '../src/utils/navigation/screenMetadata';
import {
    applyDeepLinkToState,
    getDeepLinkContactsSearch,
    parseSimulatorSearchParams,
} from '../src/utils/navigation/simulatorDeepLink';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import type { SimulatorViewState } from '../src/types/session';
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

describe('screen metadata and deep links', () => {
    it('covers screen metadata for all app variants and fallback labels', () => {
        const payload = createPayload();

        const emailMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
                },
            }).view,
            payload,
        );
        expect(emailMeta).toEqual(
            expect.objectContaining({
                app: 'email',
                parentScreen: 'list',
                showBack: true,
                showCancel: false,
                label: 'Email → Message',
                source: 'detail',
            }),
        );

        const messagesMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'new_thread', stack: [], visibleCount: 0 },
                },
            }).view,
            payload,
        );
        expect(messagesMeta.label).toBe('Messages → New Thread');
        expect(messagesMeta.source).toBe('new_thread');

        const messageDetailMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'thread_detail', stack: ['threads'], visibleCount: 1 },
                },
            }).view,
            payload,
        );
        expect(messageDetailMeta.label).toBe('Messages → Thread');
        expect(messageDetailMeta.source).toBe('detail');
        expect(messageDetailMeta.showBack).toBe(true);

        const messageListMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'threads', stack: [], visibleCount: 0 },
                },
            }).view,
            payload,
        );
        expect(messageListMeta.label).toBe('Messages → Threads');
        expect(messageListMeta.source).toBe('list');
        expect(messageListMeta.showCancel).toBe(true);

        const internetMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'internet',
                    internet: { screen: 'pricing', stack: ['landing'] },
                },
            }).view,
            payload,
        );
        expect(internetMeta.pageTitle).toBe('Pricing');
        expect(getScreenContextLabel(internetMeta)).toBe('Internet → Pricing');

        const internetFallbackMeta = getScreenMetadata(
            createState({
                view: { activeApp: 'internet', internet: { screen: 'missing', stack: [] } },
            }).view,
            payload,
        );
        expect(internetFallbackMeta.pageTitle).toBeNull();
        expect(internetFallbackMeta.label).toBe('Internet → missing');
        expect(internetFallbackMeta.showCancel).toBe(true);

        const phoneMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'directory', stack: [], chosenIndex: null },
                },
            }).view,
            payload,
        );
        expect(phoneMeta.label).toBe('Phone → Directory');

        const unknownPhoneMeta = getScreenMetadata(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'custom' as never, stack: [], chosenIndex: null },
                },
            }).view,
            payload,
        );
        expect(unknownPhoneMeta.label).toBe('Phone → custom');
        expect(unknownPhoneMeta.showCancel).toBe(true);

        const homeMeta = getScreenMetadata(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }).view,
            payload,
        );
        expect(homeMeta).toEqual(
            expect.objectContaining({ parentScreen: 'home', showBack: true, showCancel: false }),
        );

        const homeRootMeta = getScreenMetadata(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }).view,
            payload,
        );
        expect(homeRootMeta.label).toBe('Home → Home');
        expect(homeRootMeta.showCancel).toBe(true);

        const fallbackView = {
            ...createState().view,
            activeApp: 'bogus' as never,
        } as SimulatorViewState;
        const fallbackMeta = getScreenMetadata(fallbackView, {
            ...payload,
            browser: null as never,
        });
        expect(fallbackMeta.label).toBe('bogus / ');
        expect(fallbackMeta.showCancel).toBe(true);
    });

    it('covers deep-link parsing and app-specific application behavior', () => {
        expect(parseSimulatorSearchParams(new URLSearchParams())).toBeNull();
        expect(parseSimulatorSearchParams(new URLSearchParams('app=bogus'))).toBeNull();
        expect(
            parseSimulatorSearchParams(new URLSearchParams('app=email&screen=not-real')),
        ).toBeNull();
        expect(
            parseSimulatorSearchParams(new URLSearchParams('app=internet&pageId=pricing')),
        ).toEqual({
            app: 'internet',
            screen: undefined,
            messageId: undefined,
            pageId: 'pricing',
            search: undefined,
        });

        const state = getInitialSessionState(
            createPayload({
                channel: 'browser',
                entryPoint: { app: 'internet', screen: 'landing' },
            }),
        );

        const emailNext = applyDeepLinkToState(state, { app: 'email', messageId: 'missing' });
        expect(emailNext.view.activeApp).toBe('email');
        expect(emailNext.view.email.screen).toBe('detail');
        expect(emailNext.view.email.selectedMessageId).toBeNull();

        const messagesNext = applyDeepLinkToState(state, {
            app: 'messages',
            screen: 'thread_detail',
        });
        expect(messagesNext.view.messages.screen).toBe('thread_detail');
        expect(messagesNext.view.messages.visibleCount).toBe(1);

        const internetNext = applyDeepLinkToState(state, { app: 'internet', pageId: 'missing' });
        expect(internetNext.view.internet.screen).toBe('landing');

        const phoneNext = applyDeepLinkToState(state, {
            app: 'phone',
            screen: 'contacts',
            search: 'Ada',
        });
        expect(phoneNext.view.phone.screen).toBe('contacts');
        expect(phoneNext.view.phone.stack).toEqual(['history']);

        const phoneUnchanged = applyDeepLinkToState(phoneNext, {
            app: 'phone',
            screen: 'contacts',
        });
        expect(phoneUnchanged.view.phone.stack).toEqual(['history']);

        const homeNext = applyDeepLinkToState(state, { app: 'home', screen: 'settings' });
        expect(homeNext.view.home.screen).toBe('settings');

        expect(getDeepLinkContactsSearch({ app: 'phone', screen: 'contacts', search: 'Ada' })).toBe(
            'Ada',
        );
        expect(
            getDeepLinkContactsSearch({ app: 'phone', screen: 'contacts', search: '' }),
        ).toBeUndefined();
        expect(
            getDeepLinkContactsSearch({ app: 'email', screen: 'list', search: 'Ada' }),
        ).toBeUndefined();
    });
});
