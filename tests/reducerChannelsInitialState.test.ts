import { describe, expect, it } from 'vitest';
import { getInitialSessionState } from '../src/state/simulatorSessionInitialState.js';
import {} from '../src/state/simulatorViewStateHelpers.js';
import {} from '../src/state/simulatorSessionReducer.js';
import { switchChannelAction } from '../src/state/simulatorDispatchActions.js';
import type {} from '../src/types/session';
import { createPayload } from './support/reducerSupport';

describe('session reducer channels and initial state', () => {
    it('maps shell channels to apps', () => {
        expect(switchChannelAction('sms')).toEqual({ type: 'SWITCH_APP', app: 'messages' });
        expect(switchChannelAction('browser')).toEqual({ type: 'SWITCH_APP', app: 'internet' });
        expect(switchChannelAction('contacts')).toEqual({ type: 'SWITCH_APP', app: 'phone' });
        expect(switchChannelAction('home')).toEqual({ type: 'SWITCH_APP', app: 'home' });
    });

    it('derives initial app and screen across channels and entry-point variants', () => {
        const phoneState = getInitialSessionState(
            createPayload({ channel: 'phone', entryPoint: null }),
        );
        expect(phoneState.view.activeApp).toBe('phone');
        expect(phoneState.view.phone.screen).toBe('history');
        expect(phoneState.view.showPrimaryMenu).toBe(false);

        const smsState = getInitialSessionState(
            createPayload({ channel: 'sms', entryPoint: null }),
        );
        expect(smsState.view.activeApp).toBe('messages');
        expect(smsState.view.messages.screen).toBe('threads');

        const browserState = getInitialSessionState(
            createPayload({ channel: 'browser', entryPoint: null }),
        );
        expect(browserState.view.activeApp).toBe('internet');
        expect(browserState.view.internet.screen).toBe('landing');

        const contactsState = getInitialSessionState(
            createPayload({ channel: 'contacts', entryPoint: null }),
        );
        expect(contactsState.view.activeApp).toBe('phone');
        expect(contactsState.view.phone.screen).toBe('history');
        expect(contactsState.view.showPrimaryMenu).toBe(false);

        const homeState = getInitialSessionState(
            createPayload({ channel: 'home', entryPoint: null }),
        );
        expect(homeState.view.activeApp).toBe('home');
        expect(homeState.view.home.screen).toBe('home');
        expect(homeState.view.showPrimaryMenu).toBe(true);

        const explicitHomeState = getInitialSessionState(
            createPayload({ channel: 'home', entryPoint: { app: 'home', screen: 'settings' } }),
        );
        expect(explicitHomeState.view.activeApp).toBe('home');
        expect(explicitHomeState.view.home.screen).toBe('settings');
        expect(explicitHomeState.view.showPrimaryMenu).toBe(true);

        const emailDefaultState = getInitialSessionState(
            createPayload({ channel: 'email', entryPoint: null }),
        );
        expect(emailDefaultState.view.activeApp).toBe('email');
        expect(emailDefaultState.view.email.screen).toBe('list');

        const invalidHomeScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'home', screen: 'not-real' } }),
        );
        expect(invalidHomeScreen.view.home.screen).toBe('home');

        const undefinedHomeScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'home', screen: undefined as never } }),
        );
        expect(undefinedHomeScreen.view.home.screen).toBe('home');

        const invalidBrowserScreen = getInitialSessionState(
            createPayload({ channel: 'browser', entryPoint: { app: 'internet', screen: '' } }),
        );
        expect(invalidBrowserScreen.view.internet.screen).toBe('landing');

        const invalidEmailScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'email', screen: 'not-real' } }),
        );
        expect(invalidEmailScreen.view.email.screen).toBe('list');

        const threadDetailState = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'thread_detail' } }),
        );
        expect(threadDetailState.view.messages.screen).toBe('thread_detail');

        const invalidMessagesScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'bogus' } }),
        );
        expect(invalidMessagesScreen.view.messages.screen).toBe('threads');

        const missingEmailSelection = getInitialSessionState(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: {
                    inbox: [{ id: 'fallback-id', subject: 'Alert', from: 'alerts@example.test' }],
                    outbox: [],
                    trash: [],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
            }),
        );
        expect(missingEmailSelection.view.email.selectedMessageId).toBe('fallback-id');

        const noEmailSelection = getInitialSessionState(
            createPayload({
                entryPoint: { app: 'email', screen: 'detail' },
                email: {
                    inbox: [],
                    outbox: [],
                    trash: [],
                    selectedMessage: null,
                    selectedMessageId: null,
                },
            }),
        );
        expect(noEmailSelection.view.email.selectedMessageId).toBeNull();

        const phoneFallback = getInitialSessionState(
            createPayload({ entryPoint: { app: 'phone', screen: 'not-real' } }),
        );
        expect(phoneFallback.view.phone.screen).toBe('history');

        const undefinedPhoneScreen = getInitialSessionState(
            createPayload({ entryPoint: { app: 'phone', screen: undefined as never } }),
        );
        expect(undefinedPhoneScreen.view.phone.screen).toBe('history');

        const unsupportedEntryApp = getInitialSessionState(
            createPayload({ entryPoint: { app: 'bogus' as never, screen: 'custom-screen' } }),
        );
        expect(unsupportedEntryApp.view.activeApp).toBe('bogus');

        const emailDetail = getInitialSessionState(
            createPayload({ entryPoint: { app: 'email', screen: 'detail' } }),
        );
        expect(emailDetail.view.email.screen).toBe('detail');
        expect(emailDetail.view.email.selectedMessageId).toBe('m1');

        const messagesNewThread = getInitialSessionState(
            createPayload({ entryPoint: { app: 'messages', screen: 'new_thread' } }),
        );
        expect(messagesNewThread.view.messages.screen).toBe('new_thread');

        const browserWithoutPages = getInitialSessionState(
            createPayload({
                channel: 'browser',
                entryPoint: { app: 'internet', screen: 'missing' },
                browser: { defaultPageId: 'custom-default', pages: [] },
            }),
        );
        expect(browserWithoutPages.view.internet.screen).toBe('custom-default');

        const browserWithoutPageList = getInitialSessionState(
            createPayload({
                channel: 'browser',
                entryPoint: { app: 'internet', screen: 'missing' },
                browser: { defaultPageId: 'custom-default', pages: null as never },
            }),
        );
        expect(browserWithoutPageList.view.internet.screen).toBe('custom-default');
    });
});
