import { describe, expect, it } from 'vitest';
import { appToChannel } from '../src/adapters/fullDeviceToSession';
import { channelToApp, getCurrentScreenForApp, viewStateToActiveChannel } from '../src/types/session';

describe('session mappings', () => {
    it('maps simulator apps to shell channels', () => {
        expect(appToChannel('phone')).toBe('phone');
        expect(appToChannel('messages')).toBe('sms');
        expect(appToChannel('internet')).toBe('browser');
    });

    it('maps shell channels back to apps', () => {
        expect(channelToApp('contacts')).toBe('phone');
        expect(channelToApp('sms')).toBe('messages');
        expect(channelToApp('browser')).toBe('internet');
    });

    it('falls back to email for unknown app mapping', () => {
        expect(appToChannel('bogus' as never)).toBe('email');
    });

    it('falls back to email for unknown channel mapping', () => {
        expect(channelToApp('bogus' as never)).toBe('email');
    });

    it('keeps direct view-state and channel mappings for email and home and still defaults unknown values to email', () => {
        expect(viewStateToActiveChannel('email')).toBe('email');
        expect(viewStateToActiveChannel('home')).toBe('home');
        expect(viewStateToActiveChannel('bogus' as never)).toBe('email');
        expect(channelToApp('email')).toBe('email');
        expect(channelToApp('home')).toBe('home');
    });

    it('returns the current screen for the active app', () => {
        expect(
            getCurrentScreenForApp({
                activeApp: 'email',
                showPrimaryMenu: false,
                contactsPanelOpen: false,
                contactsSearchQuery: '',
                actionHistory: [],
                email: { screen: 'detail', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
            } as never)
        ).toBe('detail');
    });

    it('returns an empty string for unknown active apps', () => {
        expect(
            getCurrentScreenForApp({
                activeApp: 'bogus',
                showPrimaryMenu: false,
                contactsPanelOpen: false,
                contactsSearchQuery: '',
                actionHistory: [],
                email: { screen: 'detail', stack: [], selectedMessageId: null },
                messages: { screen: 'threads', stack: [], visibleCount: 0 },
                internet: { screen: 'landing', stack: [] },
                phone: { screen: 'history', stack: [], chosenIndex: null },
                home: { screen: 'home' },
            } as never)
        ).toBe('');
    });
});
