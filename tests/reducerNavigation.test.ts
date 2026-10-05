import { describe, expect, it } from 'vitest';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import { createState } from './support/reducerSupport';

describe('session reducer navigation', () => {
    it('handles app switches and local navigation across app families', () => {
        const start = createState({
            view: {
                activeApp: 'home',
                showPrimaryMenu: true,
                phone: { screen: 'contacts', stack: ['history'], chosenIndex: 1 },
                email: { screen: 'detail', stack: ['list'], selectedMessageId: 'm1' },
            },
        });

        const phoneApp = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'phone' });
        expect(phoneApp.view.activeApp).toBe('phone');
        expect(phoneApp.view.showPrimaryMenu).toBe(false);
        expect(phoneApp.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: 1 });

        const emailApp = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'email' });
        expect(emailApp.view.email).toEqual({ screen: 'list', stack: [], selectedMessageId: null });

        const untouchedHome = simulatorSessionReducer(start, { type: 'SWITCH_APP', app: 'home' });
        expect(untouchedHome.view.showPrimaryMenu).toBe(true);

        const phoneNav = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'history', stack: [], chosenIndex: null },
                },
            }),
            { type: 'NAV_LOCAL', app: 'phone', screen: 'dial' },
        );
        expect(phoneNav.view.phone).toEqual({
            screen: 'dial',
            stack: ['history'],
            chosenIndex: null,
        });

        const emailNav = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'list', stack: [], selectedMessageId: null },
                },
            }),
            { type: 'NAV_LOCAL', app: 'email', screen: 'outbox' },
        );
        expect(emailNav.view.email.screen).toBe('outbox');
        expect(emailNav.view.email.stack).toEqual(['list']);

        const messagesNav = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'threads', stack: [], visibleCount: 0 },
                },
            }),
            { type: 'NAV_LOCAL', app: 'messages', screen: 'new_thread' },
        );
        expect(messagesNav.view.messages.screen).toBe('new_thread');
        expect(messagesNav.view.messages.stack).toEqual(['threads']);

        const internetNav = simulatorSessionReducer(
            createState({
                view: { activeApp: 'internet', internet: { screen: 'landing', stack: ['old'] } },
            }),
            { type: 'NAV_LOCAL', app: 'internet', screen: 'pricing' },
        );
        expect(internetNav.view.internet).toEqual({ screen: 'pricing', stack: ['old'] });

        const homeNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            { type: 'NAV_LOCAL', app: 'home', screen: 'settings' },
        );
        expect(homeNav.view.home.screen).toBe('settings');

        const ignoredSameScreen = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'history', stack: [], chosenIndex: null },
                },
            }),
            { type: 'NAV_LOCAL', app: 'phone', screen: 'history' },
        );
        expect(ignoredSameScreen.view.phone.stack).toEqual([]);

        const ignoredInvalid = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            { type: 'NAV_LOCAL', app: 'home', screen: 'bogus' },
        );
        expect(ignoredInvalid.view.home.screen).toBe('home');

        const ignoredEmailInvalid = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'list', stack: [], selectedMessageId: null },
                },
            }),
            { type: 'NAV_LOCAL', app: 'email', screen: 'bogus' },
        );
        expect(ignoredEmailInvalid.view.email.screen).toBe('list');

        const ignoredMessagesInvalid = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'threads', stack: [], visibleCount: 0 },
                },
            }),
            { type: 'NAV_LOCAL', app: 'messages', screen: 'bogus' },
        );
        expect(ignoredMessagesInvalid.view.messages.screen).toBe('threads');

        const ignoredInternetInvalid = simulatorSessionReducer(
            createState({
                view: { activeApp: 'internet', internet: { screen: 'landing', stack: [] } },
            }),
            { type: 'NAV_LOCAL', app: 'internet', screen: '' },
        );
        expect(ignoredInternetInvalid.view.internet.screen).toBe('landing');

        const invalidAppNav = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'NAV_LOCAL', app: 'mystery' as never, screen: 'bogus' },
        );
        expect(invalidAppNav.view.activeApp).toBe('mystery');
    });

    it('handles back and cancel behavior per app', () => {
        const phoneBackToPrimary = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    showPrimaryMenu: false,
                    phone: { screen: 'history', stack: [], chosenIndex: null },
                },
            }),
            { type: 'BACK' },
        );
        expect(phoneBackToPrimary.view.showPrimaryMenu).toBe(true);

        const phoneBackFromStack = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'dial', stack: ['history'], chosenIndex: null },
                },
            }),
            { type: 'BACK' },
        );
        expect(phoneBackFromStack.view.phone).toEqual({
            screen: 'dial',
            stack: [],
            chosenIndex: null,
        });

        const phoneBackUndefinedFallback = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'dial', stack: [undefined as never], chosenIndex: null },
                },
            }),
            { type: 'BACK' },
        );
        expect(phoneBackUndefinedFallback.view.phone).toEqual({
            screen: 'dial',
            stack: [],
            chosenIndex: null,
        });

        const emailBackEmpty = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'detail', stack: [], selectedMessageId: 'm1' },
                },
            }),
            { type: 'BACK' },
        );
        expect(emailBackEmpty.view.email).toEqual({
            screen: 'list',
            stack: [],
            selectedMessageId: null,
        });

        const emailBackFromStack = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'trash', stack: ['outbox'], selectedMessageId: 'm1' },
                },
            }),
            { type: 'BACK' },
        );
        expect(emailBackFromStack.view.email).toEqual({
            screen: 'trash',
            stack: [],
            selectedMessageId: null,
        });

        const emailBackUndefinedFallback = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: {
                        screen: 'trash',
                        stack: [undefined as never],
                        selectedMessageId: 'm1',
                    },
                },
            }),
            { type: 'BACK' },
        );
        expect(emailBackUndefinedFallback.view.email).toEqual({
            screen: 'trash',
            stack: [],
            selectedMessageId: null,
        });

        const messagesBack = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'thread_detail', stack: [], visibleCount: 0 },
                },
            }),
            { type: 'BACK' },
        );
        expect(messagesBack.view.messages.screen).toBe('threads');

        const internetBackToStack = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'internet',
                    internet: { screen: 'pricing', stack: ['landing'] },
                },
            }),
            { type: 'BACK' },
        );
        expect(internetBackToStack.view.internet).toEqual({ screen: 'landing', stack: [] });

        const internetBackUndefinedFallback = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'internet',
                    internet: { screen: 'pricing', stack: [undefined as never] },
                },
            }),
            { type: 'BACK' },
        );
        expect(internetBackUndefinedFallback.view.internet).toEqual({
            screen: 'landing',
            stack: [],
        });

        const internetBackToDefault = simulatorSessionReducer(
            createState({
                view: { activeApp: 'internet', internet: { screen: 'pricing', stack: [] } },
            }),
            { type: 'BACK' },
        );
        expect(internetBackToDefault.view.internet.screen).toBe('landing');

        const homeBack = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }),
            { type: 'BACK' },
        );
        expect(homeBack.view.home.screen).toBe('home');

        const phoneCancel = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'phone',
                    phone: { screen: 'dial', stack: ['history'], chosenIndex: 2 },
                },
            }),
            { type: 'CANCEL' },
        );
        expect(phoneCancel.view.phone).toEqual({ screen: 'history', stack: [], chosenIndex: 2 });

        const emailCancel = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'trash', stack: ['list'], selectedMessageId: 'm1' },
                },
            }),
            { type: 'CANCEL' },
        );
        expect(emailCancel.view.email).toEqual({
            screen: 'list',
            stack: [],
            selectedMessageId: null,
        });

        const messagesCancel = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'new_thread', stack: ['threads'], visibleCount: 0 },
                },
            }),
            { type: 'CANCEL' },
        );
        expect(messagesCancel.view.messages).toEqual({
            screen: 'threads',
            stack: [],
            visibleCount: 0,
        });

        const internetCancel = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'internet',
                    internet: { screen: 'pricing', stack: ['landing'] },
                },
            }),
            { type: 'CANCEL' },
        );
        expect(internetCancel.view.internet).toEqual({ screen: 'landing', stack: [] });

        const homeCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'settings' } } }),
            { type: 'CANCEL' },
        );
        expect(homeCancel.view.home.screen).toBe('home');

        const invalidBack = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'BACK' },
        );
        expect(invalidBack.view.activeApp).toBe('mystery');

        const invalidCancel = simulatorSessionReducer(
            createState({ view: { activeApp: 'mystery' as never } }),
            { type: 'CANCEL' },
        );
        expect(invalidCancel.view.activeApp).toBe('mystery');
    });
});
