// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
    scenarioBrowserPage,
    scenarioBrowserAction,
} from '../src/apps/browser/scenarioBrowserPage';
import type { SimulatorBrowserPage } from '../src/types/session';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
    type BrowserAction,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import { createLock } from '../src/apps/lock/lock';
import BrowserWorkbench from '../src/apps/browser/BrowserWorkbench';
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});
const translate = (key: string) => key;
const page: SimulatorBrowserPage = {
    id: 'Case',
    url: 'https://example.test/Case',
    title: '',
    layout: 'landing',
};
it('renders optional authored fields safely and supplies completion/download defaults', () => {
    expect(scenarioBrowserPage(page, translate).html).toContain('app.browser.pageTitle');
    const login = scenarioBrowserPage(
        {
            ...page,
            title: '<title>',
            logoUrl: 'https://example.test/a?x="',
            warningBanner: '<warning>',
            showMediaPlaceholder: true,
            formFields: [{ name: 'email', label: '<Email>', type: 'email' }],
        },
        translate,
    );
    expect(login.html).toContain('&#60;Email&#62;');
    expect(login.html).not.toContain('<warning>');
    expect(login.html).toContain('scenario-submit');
    expect(login.html).toContain('aria-hidden');
    expect(scenarioBrowserPage({ ...page, layout: 'result' }, translate).html).toContain(
        'complete',
    );
    expect(scenarioBrowserPage({ ...page, layout: 'download' }, translate).html).toContain(
        'scenario-download',
    );
    expect(
        scenarioBrowserPage(
            { ...page, layout: 'download', buttons: [{ label: 'Get file' }] },
            translate,
        ).html,
    ).not.toContain('scenario-download');
});
it('maps only valid authored browser actions and never collects form field values', () => {
    const event = (action: string, event: 'click' | 'submit' = 'click'): BrowserAction => ({
        type: BROWSER_ACTION_TYPE,
        version: BROWSER_ACTION_VERSION,
        pageId: 'Case',
        session: 'test-session',
        action,
        event,
        values: { password: 'fictional' },
    });
    expect(scenarioBrowserAction(page, event('scenario-submit', 'submit'))?.type).toBe(
        'submit_form',
    );
    expect(scenarioBrowserAction(page, event('scenario-download'))).toMatchObject({
        type: 'download_click',
    });
    for (const [action, kind] of [
        ['other', 'click'],
        ['scenario-button:0', 'submit'],
        ['scenario-button:-1', 'click'],
        ['scenario-button:1.5', 'click'],
        ['scenario-button:no', 'click'],
        ['scenario-button:9', 'click'],
    ] as const)
        expect(scenarioBrowserAction(page, event(action, kind))).toBeNull();
    const buttonPage = {
        ...page,
        buttons: [
            { label: 'Next' },
            { label: 'Download', href: 'https://example.test/file', targetPageId: 'Next' },
        ],
    };
    expect(scenarioBrowserAction(buttonPage, event('scenario-button:0'))).toMatchObject({
        href: page.url,
    });
    expect(scenarioBrowserAction(buttonPage, event('scenario-button:1'))).toMatchObject({
        href: 'https://example.test/file',
        pageId: 'Next',
    });
    expect(
        scenarioBrowserAction({ ...buttonPage, layout: 'download' }, event('scenario-button:0')),
    ).toMatchObject({ type: 'download_click' });
    expect(
        scenarioBrowserAction({ ...buttonPage, layout: 'download' }, event('scenario-button:1')),
    ).toMatchObject({ type: 'download_click' });
});
it('rejects screen-lock creation when browser cryptography is unavailable', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => bytes });
    await expect(createLock('fictional')).rejects.toThrow('HTTPS');
});
it('does not treat authored malformed URLs as a reason to leave the sandbox', () => {
    render(
        <BrowserWorkbench
            pages={[{ id: 'broken', title: 'Broken', url: 'not a url', html: '<p>Example</p>' }]}
        />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search or enter address' });
    fireEvent.change(input, { target: { value: 'https://unknown.example.test' } });
    const form = input.closest('form');
    if (!form) throw new Error('Address form missing');
    fireEvent.submit(form);
    expect(screen.getByTitle('Page unavailable')).toBeTruthy();
});
