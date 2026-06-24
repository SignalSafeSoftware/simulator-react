import { describe, expect, it } from 'vitest';
import { analyzeReachability } from '../src/utils/simulatorReachability';

describe('analyzeReachability', () => {
    it('starts browser reachability from the entry screen when it is present', () => {
        const report = analyzeReachability({
            channel: 'browser',
            entryPoint: { app: 'internet', screen: 'pricing' },
            device: {
                mainMenuItems: [{ id: 'internet' }],
            },
            browser: {
                defaultPageId: 'landing',
                pages: [
                    {
                        id: 'landing',
                        buttons: [{ targetPageId: 'contact' }],
                    },
                    {
                        id: 'pricing',
                        buttons: [{ targetPageId: 'checkout' }],
                    },
                    {
                        id: 'checkout',
                        buttons: [],
                    },
                    {
                        id: 'contact',
                        buttons: [],
                    },
                ],
            },
        } as never);

        expect(report.reachableScreens.internet).toEqual(['pricing', 'checkout']);
        expect(report.unreachable.browserPageIds).toEqual(['landing', 'contact']);
    });

    it('marks defined screens as unreachable when an app has content but is not reachable', () => {
        const report = analyzeReachability({
            channel: 'email',
            email: {
                inbox: [{ id: 'm1' }],
            },
            sms: {
                thread: {
                    messages: [{ id: 'sms-1' }],
                },
            },
            browser: {
                pages: [{ id: 'landing', buttons: [] }],
            },
            home: {},
        } as never);

        expect(report.reachableApps).toEqual(['email']);
        expect(report.unreachable.screens).toEqual(
            expect.arrayContaining([
                { app: 'messages', screen: 'threads' },
                { app: 'messages', screen: 'thread_detail' },
                { app: 'messages', screen: 'new_thread' },
                { app: 'internet', screen: 'landing' },
                { app: 'home', screen: 'home' },
                { app: 'home', screen: 'store' },
                { app: 'home', screen: 'settings' },
            ])
        );
    });

    it('covers entry-app fallbacks, browser cycles, and unreachable entities', () => {
        const report = analyzeReachability({
            channel: 'contacts',
            device: {
                mainMenuItems: [{ id: 'phone' }, { id: 'internet' }, { id: 'not-an-app' }],
            },
            contacts: [{ id: 'c1' }, { id: 'c2' }],
            phone: {},
            browser: {
                defaultPageId: 'missing-default',
                pages: [
                    { id: 'landing', buttons: [{ targetPageId: 'pricing' }] },
                    { id: 'pricing', buttons: [{ targetPageId: 'landing' }, { targetPageId: '' }] },
                    { id: 'support', buttons: [{ targetPageId: 'missing' }] },
                ],
            },
        } as never);

        expect(report.entryApp).toBe('phone');
        expect(report.reachableApps).toEqual(['phone', 'internet']);
        expect(report.reachableScreens.phone).toEqual([
            'history',
            'contacts',
            'dial',
            'incoming_call',
            'voicemail',
            'directory',
        ]);
        expect(report.reachableScreens.internet).toEqual(['landing', 'pricing']);
        expect(report.reachableEntities.contacts).toEqual(['c1', 'c2']);
        expect(report.reachableEntities.browserPageIds).toEqual(['landing', 'pricing']);
        expect(report.unreachable.browserPageIds).toEqual(['support']);
        expect(report.browserHasCycle).toBe(true);
    });

    it('returns null entry app and empty reachability when nothing is defined', () => {
        const report = analyzeReachability({
            channel: 'unknown-channel',
            contacts: null,
        } as never);

        expect(report.entryApp).toBeNull();
        expect(report.reachableApps).toEqual([]);
        expect(report.reachableScreens).toEqual({
            email: [],
            messages: [],
            internet: [],
            phone: [],
            home: [],
        });
        expect(report.unreachable).toEqual({
            screens: [],
            contacts: [],
            inboxMessageIds: [],
            browserPageIds: [],
        });
    });

    it('covers empty reachable content branches and app-specific unreachable fallbacks', () => {
        const emailReport = analyzeReachability({
            channel: 'email',
            device: { mainMenuItems: [{ id: 'email' }] },
            email: { inbox: [] },
        } as never);
        expect(emailReport.reachableScreens.email).toEqual(['list']);
        expect(emailReport.unreachable.screens).toEqual([{ app: 'email', screen: 'detail' }]);

        const messagesReport = analyzeReachability({
            channel: 'sms',
            device: { mainMenuItems: [{ id: 'messages' }] },
            sms: { thread: { messages: [] } },
        } as never);
        expect(messagesReport.reachableScreens.messages).toEqual(['threads', 'new_thread']);
        expect(messagesReport.unreachable.screens).toEqual([{ app: 'messages', screen: 'thread_detail' }]);

        const internetReport = analyzeReachability({
            channel: 'browser',
            device: { mainMenuItems: [{ id: 'internet' }] },
            browser: { defaultPageId: 'landing', pages: [] },
        } as never);
        expect(internetReport.reachableScreens.internet).toEqual([]);
        expect(internetReport.unreachable.browserPageIds).toEqual([]);

        const phoneReport = analyzeReachability({
            channel: 'phone',
            device: { mainMenuItems: [{ id: 'phone' }] },
            phone: {},
            contacts: [],
        } as never);
        expect(phoneReport.reachableScreens.phone).toEqual([
            'history',
            'contacts',
            'dial',
            'incoming_call',
            'voicemail',
            'directory',
        ]);
        expect(phoneReport.reachableEntities.contacts).toEqual([]);
    });

    it('covers malformed phone contacts and unreachable phone-content fallbacks', () => {
        expect(() =>
            analyzeReachability({
                channel: 'phone',
                device: { mainMenuItems: [{ id: 'phone' }] },
                phone: {},
                contacts: 'not-an-array' as never,
            } as never)
        ).toThrow('map is not a function');

        const unreachablePhoneReport = analyzeReachability({
            channel: 'email',
            device: { mainMenuItems: [{ id: 'email' }] },
            email: { inbox: [{ id: 'm1' }] },
            phone: { content: { transcript: 'Incoming' } },
        } as never);
        expect(unreachablePhoneReport.reachableApps).toEqual(['email']);
        expect(unreachablePhoneReport.unreachable.screens).toEqual(
            expect.arrayContaining([
                { app: 'phone', screen: 'history' },
                { app: 'phone', screen: 'contacts' },
                { app: 'phone', screen: 'dial' },
                { app: 'phone', screen: 'incoming_call' },
                { app: 'phone', screen: 'voicemail' },
                { app: 'phone', screen: 'directory' },
            ])
        );
    });

    it('falls back to synthetic landing when browser page ids are malformed', () => {
        const report = analyzeReachability({
            channel: 'browser',
            entryPoint: { app: 'internet', screen: 'missing' },
            device: { mainMenuItems: [{ id: 'internet' }] },
            browser: {
                defaultPageId: 'missing-default',
                pages: [{ buttons: [{ targetPageId: 'other' }] } as never, { id: 'actual-page', buttons: [] }],
            },
        } as never);

        expect(report.reachableScreens.internet).toEqual(['landing']);
        expect(report.reachableEntities.browserPageIds).toEqual(['landing']);
        expect(report.unreachable.browserPageIds).toEqual(['actual-page']);
    });
});
