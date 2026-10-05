import { describe, expect, it } from 'vitest';
import { simulatorSessionReducer } from '../src/state/simulatorSessionReducer.js';
import { createState } from './support/reducerSupport';

describe('session reducer side effects', () => {
    it('handles reducer side effects for view-only and simulator actions', () => {
        const selectedEmail = simulatorSessionReducer(createState(), {
            type: 'SELECT_EMAIL',
            messageId: 'm1',
        });
        expect(selectedEmail.view.email.screen).toBe('detail');
        expect(selectedEmail.view.email.stack).toEqual(['list']);

        const clearedEmail = simulatorSessionReducer(selectedEmail, {
            type: 'SELECT_EMAIL',
            messageId: null,
        });
        expect(clearedEmail.view.email).toEqual({
            screen: 'list',
            stack: [],
            selectedMessageId: null,
        });

        const revealedSms = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'messages',
                    messages: { screen: 'threads', stack: [], visibleCount: 1 },
                },
            }),
            { type: 'SMS_REVEAL_NEXT' },
        );
        expect(revealedSms.view.messages.visibleCount).toBe(2);

        const browserScreen = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'internet',
                    internet: {
                        screen: 'landing',
                        stack: Array.from({ length: 20 }, (_, i) => `page-${i}`),
                    },
                },
            }),
            { type: 'BROWSER_SCREEN', screen: 'pricing' },
        );
        expect(browserScreen.view.internet.screen).toBe('pricing');
        expect(browserScreen.view.internet.stack).toHaveLength(20);
        expect(browserScreen.view.internet.stack.at(-1)).toBe('landing');

        const phoneChoose = simulatorSessionReducer(createState(), {
            type: 'PHONE_CHOOSE',
            index: 3,
        });
        expect(phoneChoose.view.phone.chosenIndex).toBe(3);

        const toggledContacts = simulatorSessionReducer(createState(), {
            type: 'TOGGLE_CONTACTS_PANEL',
        });
        expect(toggledContacts.view.contactsPanelOpen).toBe(true);

        const resetSearch = simulatorSessionReducer(createState(), {
            type: 'SET_CONTACTS_SEARCH',
            query: 123 as never,
        });
        expect(resetSearch.view.contactsSearchQuery).toBe('');

        const setSearch = simulatorSessionReducer(createState(), {
            type: 'SET_CONTACTS_SEARCH',
            query: 'Ada',
        });
        expect(setSearch.view.contactsSearchQuery).toBe('Ada');

        const switchedViaBackToPrimary = simulatorSessionReducer(createState(), {
            type: 'BACK_TO_PRIMARY',
        });
        expect(switchedViaBackToPrimary.view.activeApp).toBe('home');
        expect(switchedViaBackToPrimary.view.showPrimaryMenu).toBe(true);

        const navAction = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', home: { screen: 'home' } } }),
            {
                type: 'SIMULATOR_ACTION',
                action: { type: 'navigate_screen', app: 'home', screen: 'store' },
            },
        );
        expect(navAction.view.home.screen).toBe('store');
        expect(navAction.view.actionHistory).toHaveLength(1);

        const openAppAction = simulatorSessionReducer(
            createState({ view: { activeApp: 'home', showPrimaryMenu: true } }),
            { type: 'SIMULATOR_ACTION', action: { type: 'open_app', app: 'phone' } },
        );
        expect(openAppAction.view.activeApp).toBe('phone');

        const linkNoTarget = simulatorSessionReducer(
            createState({
                view: { activeApp: 'email', internet: { screen: 'landing', stack: [] } },
            }),
            { type: 'SIMULATOR_ACTION', action: { type: 'click_link' } as never },
        );
        expect(linkNoTarget.view.internet.screen).toBe('landing');
        expect(linkNoTarget.view.actionHistory).toHaveLength(1);

        const linkWithFallbackPage = simulatorSessionReducer(
            createState({
                view: {
                    activeApp: 'email',
                    email: { screen: 'detail', stack: [], selectedMessageId: 'm1' },
                },
            }),
            {
                type: 'SIMULATOR_ACTION',
                action: { type: 'click_link', href: 'https://example.test' },
            },
        );
        expect(linkWithFallbackPage.view.activeApp).toBe('internet');
        expect(linkWithFallbackPage.view.internet.screen).toBe('landing');

        const linkWithinInternet = simulatorSessionReducer(
            createState({
                view: { activeApp: 'internet', internet: { screen: 'landing', stack: [] } },
            }),
            { type: 'SIMULATOR_ACTION', action: { type: 'click_link', pageId: 'pricing' } },
        );
        expect(linkWithinInternet.view.internet).toEqual({ screen: 'pricing', stack: ['landing'] });

        const checkContacts = simulatorSessionReducer(createState(), {
            type: 'SIMULATOR_ACTION',
            action: { type: 'check_contacts' },
        });
        expect(checkContacts.view.contactsPanelOpen).toBe(true);

        const checkSingleContact = simulatorSessionReducer(createState(), {
            type: 'SIMULATOR_ACTION',
            action: { type: 'check_contact', contactId: 'c1' } as never,
        });
        expect(checkSingleContact.view.contactsPanelOpen).toBe(true);

        const answered = simulatorSessionReducer(createState(), {
            type: 'SIMULATOR_ACTION',
            action: { type: 'answer_call', choiceIndex: 2 },
        });
        expect(answered.view.phone.chosenIndex).toBe(2);

        const unanswered = simulatorSessionReducer(createState(), {
            type: 'SIMULATOR_ACTION',
            action: { type: 'answer_call', choiceIndex: undefined },
        });
        expect(unanswered.view.phone.chosenIndex).toBeNull();

        const defaultAction = simulatorSessionReducer(createState(), {
            type: 'SIMULATOR_ACTION',
            action: { type: 'report' },
        });
        expect(defaultAction.view.actionHistory).toHaveLength(1);
        expect(defaultAction.view.activeApp).toBe('email');

        const unknownReducerAction = simulatorSessionReducer(createState(), {
            type: 'UNKNOWN',
        } as never);
        expect(unknownReducerAction.view).toEqual(createState().view);
    });
});

it.each(['list', 'outbox', 'trash'] as const)(
    'returns email details to %s then up to primary navigation',
    (folder) => {
        const state = createState({
            view: {
                activeApp: 'email',
                showPrimaryMenu: false,
                email: { screen: 'detail', stack: ['list', folder], selectedMessageId: 'm1' },
            },
        });
        const parent = simulatorSessionReducer(state, { type: 'BACK' });
        expect(parent.view.email.screen).toBe(folder);
        expect(parent.view.showPrimaryMenu).toBe(false);
        const root = simulatorSessionReducer(parent, { type: 'BACK' });
        expect(root.view.showPrimaryMenu).toBe(true);
        expect(root.view.activeApp).toBe('home');
        expect(root.view.home.screen).toBe('home');
        expect(root.view.email.screen).toBe(folder);
    },
);
