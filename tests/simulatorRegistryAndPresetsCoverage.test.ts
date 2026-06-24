import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { employeeDeviceWorld, fakeBankWorld, FIXTURE_WORLD_CATALOG, getFixtureWorld, minimalPhoneWorld, verificationBusinessWorld, browserCredentialWorld } from '@workspace-simulator-test-support/fixtureWorlds';
import {
    buildPayloadFromPresets,
    getSimulatorPreset,
    PRESET_EMPLOYEE_CORPORATE_DEVICE,
    PRESET_EXECUTIVE_IMPERSONATION,
    PRESET_FAKE_BANK_CONSUMER,
    PRESET_HELPDESK_VERIFICATION,
    PRESET_PACKAGE_DELIVERY_SCAM,
    SIMULATOR_PRESET_CATALOG,
} from '@workspace-simulator-test-support/simulatorPresets';
import { getInitialSessionState } from '../src/state/simulatorSessionReducer';
import { renderActiveScreen, resolveScreen, SCREEN_REGISTRY } from '../src/screenRegistry/registry';
import type { SimulatorRenderContext } from '../src/screenRegistry/types';

import { TestRenderer, act } from './reactTestRenderer';

function createRenderContext(overrides?: Partial<SimulatorRenderContext>): SimulatorRenderContext {
    const payload = employeeDeviceWorld();
    return {
        state: getInitialSessionState(payload),
        dispatch: vi.fn(),
        capabilities: {
            phone: { dial: true, voicemail: true, directory: true },
            home: { store: true, settings: true },
            emailAttachments: true,
            browserForms: true,
        },
        onAction: vi.fn(),
        onSelectEmail: vi.fn(),
        onBack: vi.fn(),
        onSmsRevealNext: vi.fn(),
        onSelectThread: vi.fn(),
        onOpenContactFromPhone: vi.fn(),
        initialContactsSearch: 'security',
        ...overrides,
    };
}

describe('simulator fixture and preset coverage', () => {
    it('builds every fixture world and catalog lookup', () => {
        const minimal = minimalPhoneWorld();
        const verification = verificationBusinessWorld();
        const bank = fakeBankWorld();
        const employee = employeeDeviceWorld();
        const browser = browserCredentialWorld();

        expect(minimal.entryPoint?.screen).toBe('incoming_call');
        expect(verification.directory).toHaveLength(2);
        expect(bank.browser?.pages).toHaveLength(3);
        expect(employee.sms?.thread?.messages).toHaveLength(2);
        expect(browser.browser?.defaultPageId).toBe('landing');

        expect(Object.keys(FIXTURE_WORLD_CATALOG)).toEqual([
            'minimalPhone',
            'verificationBusiness',
            'fakeBank',
            'employeeDevice',
            'browserCredential',
        ]);
        expect(getFixtureWorld('fakeBank').templateKey).toBe('fixture-fake-bank');
    });

    it('builds payloads from presets and returns preset partials by id', () => {
        expect(PRESET_EMPLOYEE_CORPORATE_DEVICE.contacts).toHaveLength(2);
        expect(PRESET_FAKE_BANK_CONSUMER.directory).toHaveLength(1);
        expect(PRESET_EXECUTIVE_IMPERSONATION.contacts).toHaveLength(2);
        expect(PRESET_HELPDESK_VERIFICATION.entryPoint?.screen).toBe('directory');
        expect(PRESET_PACKAGE_DELIVERY_SCAM.contacts).toHaveLength(2);
        expect(Object.keys(SIMULATOR_PRESET_CATALOG)).toContain('employeeCorporateDevice');
        expect(getSimulatorPreset('helpdeskVerification')).toBe(PRESET_HELPDESK_VERIFICATION);

        const built = buildPayloadFromPresets(
            {
                templateKey: 'composed-template',
                name: 'Composed Template',
                channel: 'browser',
            },
            ['employeeCorporateDevice', 'fakeBankConsumer'],
            {
                entryPoint: { app: 'internet', screen: 'landing' },
                browser: {
                    defaultPageId: 'landing',
                    pages: [{ id: 'landing', title: 'Landing', url: 'https://example.test', layout: 'landing' }],
                },
            }
        );

        expect(built.templateKey).toBe('composed-template');
        expect(built.channel).toBe('browser');
        expect(built.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(built.browser?.pages?.[0]?.id).toBe('landing');
        expect(built.contacts?.length).toBeGreaterThan(0);
        expect(built.directory?.length).toBeGreaterThan(0);
    });

    it('maps sparse overlays to explicit null slices in buildPayloadFromPresets', () => {
        const sparse = buildPayloadFromPresets(
            { templateKey: 'sparse', name: 'Sparse', channel: 'browser' },
            [],
            {
                entryPoint: { app: 'internet', screen: 'landing' },
                browser: {
                    defaultPageId: 'landing',
                    pages: [{ id: 'landing', title: 'Landing', url: 'https://example.test', layout: 'landing' }],
                },
            }
        );
        expect(sparse.entryPoint).toEqual({ app: 'internet', screen: 'landing' });
        expect(sparse.browser?.defaultPageId).toBe('landing');
        expect(sparse.email).toBeNull();
        expect(sparse.sms).toBeNull();
        expect(sparse.phone).toBeNull();
        expect(sparse.contacts).toBeNull();
        expect(sparse.directory).toBeNull();
        expect(sparse.home).toBeNull();
        expect(sparse.device).toBeNull();
    });
});

describe('simulator screen registry coverage', () => {
    it('resolves and renders entries for all registry-owned apps', () => {
        const ctx = createRenderContext();
        const emailEntry = resolveScreen('email', ctx);
        expect(emailEntry?.app).toBe('email');

        ctx.state.view.messages.screen = 'threads';
        const messagesThreads = resolveScreen('messages', ctx);
        expect(messagesThreads?.screen).toBe('threads');
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('messages', ctx)));

        ctx.state.view.messages.screen = 'new_thread';
        const newThreadEntry = resolveScreen('messages', ctx);
        expect(newThreadEntry?.screen).toBe('new_thread');
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('messages', ctx)));

        ctx.state.view.messages.screen = 'thread_detail';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('messages', ctx)));

        ctx.state.view.internet.screen = 'landing';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('internet', ctx)));

        ctx.state.view.phone.screen = 'contacts';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('phone', ctx)));

        ctx.state.view.phone.screen = 'directory';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('phone', ctx)));

        ctx.state.view.phone.screen = 'history';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('phone', ctx)));

        ctx.state.view.home.screen = 'home';
        TestRenderer.create(React.createElement(React.Fragment, null, renderActiveScreen('home', ctx)));

        expect(SCREEN_REGISTRY.length).toBeGreaterThan(0);
    });

    it('falls back to default entries and null when no matching app entry exists', () => {
        const ctx = createRenderContext();
        ctx.state.view.messages.screen = 'unknown-screen' as never;
        expect(resolveScreen('messages', ctx)).toBeNull();
        expect(renderActiveScreen('messages', ctx)).toBeNull();
    });

    it('covers registry prop builders for fallbacks, search state, and shell-owned nav', () => {
        const ctx = createRenderContext({
            initialContactsSearch: 'initial-search',
        });

        ctx.state.payload.sms = {
            thread: {
                messages: [{ text: 'A very long message that should be truncated by the registry preview builder because it exceeds the limit.' }],
                sender_display_name: 'Sender',
            },
            visibleMessageCount: 0,
        } as never;
        ctx.state.view.messages.screen = 'threads';
        const threadProps = resolveScreen('messages', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect((threadProps.threads as Array<Record<string, unknown>>)[0].preview).toContain('…');

        ctx.state.payload.sms = {
            thread: {
                messages: [{}],
            },
            visibleMessageCount: 0,
        } as never;
        const defaultPreviewProps = resolveScreen('messages', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect((defaultPreviewProps.threads as Array<Record<string, unknown>>)[0].preview).toBe('New message');

        ctx.state.view.activeApp = 'phone';
        ctx.state.view.showPrimaryMenu = true;
        ctx.state.view.phone.screen = 'contacts';
        ctx.state.view.contactsSearchQuery = '';
        const contactsProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(contactsProps.initialSearch).toBe('initial-search');
        expect(contactsProps.searchQuery).toBe('initial-search');
        expect(contactsProps.phoneLocalNavItems).toBeTruthy();
        expect(contactsProps.onPhoneNavSelect).toBeTruthy();

        ctx.state.view.showPrimaryMenu = false;
        ctx.state.view.activeApp = 'phone';
        ctx.state.view.contactsSearchQuery = 'stored-search';
        const shellOwnedContactsProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(shellOwnedContactsProps.searchQuery).toBe('stored-search');
        expect(shellOwnedContactsProps.phoneLocalNavItems).toBeUndefined();
        expect(shellOwnedContactsProps.onPhoneNavSelect).toBeUndefined();

        ctx.state.view.phone.screen = 'directory';
        const directoryProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(directoryProps.phoneLocalNavItems).toBeUndefined();
        expect(typeof directoryProps.onViewEntry).toBe('function');

        ctx.state.view.phone.screen = 'history';
        const phoneProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(phoneProps.navRenderedByShell).toBe(true);

        ctx.state.view.activeApp = 'email';
        ctx.state.view.showPrimaryMenu = false;
        ctx.state.view.email.screen = 'detail';
        const emailProps = resolveScreen('email', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(emailProps.navRenderedByShell).toBe(true);

        ctx.state.view.activeApp = 'home';
        ctx.state.view.home.screen = 'settings';
        const homeProps = resolveScreen('home', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(homeProps.screen).toBe('settings');

        ctx.initialContactsSearch = undefined;
        ctx.state.view.activeApp = 'phone';
        ctx.state.view.phone.screen = 'contacts';
        ctx.state.view.showPrimaryMenu = true;
        ctx.state.view.contactsSearchQuery = '';
        const emptySearchProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(emptySearchProps.searchQuery).toBe('');
    });

    it('dispatches through registry-owned callback props', () => {
        const ctx = createRenderContext({
            dispatch: vi.fn(),
            onAction: vi.fn(),
        });

        ctx.state.view.activeApp = 'email';
        ctx.state.view.showPrimaryMenu = false;
        ctx.state.view.email.screen = 'detail';
        const emailProps = resolveScreen('email', ctx)!.getProps(ctx) as Record<string, unknown>;
        (emailProps.onNavigate as (screen: string) => void)('trash');

        ctx.state.view.messages.screen = 'threads';
        const messageProps = resolveScreen('messages', ctx)!.getProps(ctx) as Record<string, unknown>;
        (messageProps.onCompose as () => void)();

        ctx.state.view.activeApp = 'phone';
        ctx.state.view.showPrimaryMenu = true;
        ctx.state.view.phone.screen = 'contacts';
        const contactsProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        (contactsProps.onSearchSubmit as (query: string) => void)('help');
        (contactsProps.onSearchChange as (query: string) => void)('desk');
        (contactsProps.onAddContact as () => void)();
        (contactsProps.onPhoneNavSelect as (id: string) => void)('dial');

        ctx.state.view.phone.screen = 'directory';
        const directoryProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        (directoryProps.onViewEntry as (id: string) => void)('d1');
        (directoryProps.onPhoneNavSelect as (id: string) => void)('history');

        ctx.state.view.phone.screen = 'history';
        const phoneProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        (phoneProps.onNavigate as (id: string) => void)('voicemail');

        ctx.state.view.activeApp = 'home';
        ctx.state.view.home.screen = 'home';
        const homeProps = resolveScreen('home', ctx)!.getProps(ctx) as Record<string, unknown>;
        (homeProps.onNavigate as (id: string) => void)('store');

        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'email', screen: 'trash' },
        });
        expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'NAV_LOCAL', app: 'messages', screen: 'new_thread' });
        expect(ctx.onAction).toHaveBeenCalledWith({ type: 'search_contacts', query: 'help' });
        expect(ctx.dispatch).toHaveBeenCalledWith({ type: 'SET_CONTACTS_SEARCH', query: 'desk' });
        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'phone', screen: 'add_contact' },
        });
        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'phone', screen: 'dial' },
        });
        expect(ctx.onAction).toHaveBeenCalledWith({ type: 'view_directory_entry', entryId: 'd1' });
        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'phone', screen: 'history' },
        });
        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'phone', screen: 'voicemail' },
        });
        expect(ctx.dispatch).toHaveBeenCalledWith({
            type: 'SIMULATOR_ACTION',
            action: { type: 'navigate_screen', app: 'home', screen: 'store' },
        });
    });

    it('returns null for unknown app lookups', () => {
        const ctx = createRenderContext();
        expect(resolveScreen('unknown' as never, ctx)).toBeNull();
        expect(renderActiveScreen('unknown' as never, ctx)).toBeNull();
    });

    it('selects first directory id for harness-phone-directory-entry templates', () => {
        const ctx = createRenderContext();
        ctx.state.payload.templateKey = 'harness-phone-directory-entry';
        (ctx.state.payload as { directory?: Array<{ id: string }> }).directory = [{ id: 'first-entry' }, { id: 'second' }];
        ctx.state.view.phone.screen = 'directory';
        const directoryProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(directoryProps.initialSelectedDirectoryId).toBe('first-entry');
    });

    it('uses null initial directory id when harness template has no directory rows', () => {
        const ctx = createRenderContext();
        ctx.state.payload.templateKey = 'harness-phone-directory-entry';
        (ctx.state.payload as { directory?: Array<{ id: string }> }).directory = [];
        ctx.state.view.phone.screen = 'directory';
        const directoryProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(directoryProps.initialSelectedDirectoryId).toBeNull();
    });

    it('wires IT helpdesk harness contacts selection and title-only detail', () => {
        const ctx = createRenderContext();
        ctx.state.payload.templateKey = 'harness-phone-contact-it-helpdesk';
        ctx.state.view.phone.screen = 'contacts';
        const contactsProps = resolveScreen('phone', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(contactsProps.initialSelectedContactId).toBe('it-helpdesk');
        expect(contactsProps.contactDetailTitleOnly).toBe(true);
    });

    it('covers prebuilt thread lists and null-message fallback in registry lookup', () => {
        const ctx = createRenderContext();

        ctx.state.payload.sms = {
            threads: [
                {
                    id: 'thread-1',
                    preview: 'Preset preview',
                    senderName: 'Security Team',
                    timestamp: '09:00',
                },
            ],
            thread: {
                messages: [{ text: 'Ignored because threads already exist' }],
            },
            visibleMessageCount: 0,
        } as never;
        ctx.state.view.messages.screen = 'threads';
        const smsPayload = ctx.state.payload.sms as { threads: Array<{ id: string; preview: string }> };
        const threadedProps = resolveScreen('messages', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect((threadedProps.threads as Array<Record<string, unknown>>)[0].preview).toBe('Preset preview');
        expect(threadedProps.threads).toBe(smsPayload.threads);

        ctx.state.payload.sms = null as never;
        const emptyProps = resolveScreen('messages', ctx)!.getProps(ctx) as Record<string, unknown>;
        expect(emptyProps.threads).toEqual([]);
    });
});
