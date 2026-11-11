// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import BrowserWorkbench, { type MockPage } from '../src/apps/browser/BrowserWorkbench';
import ScenarioBrowserWorkbench from '../src/apps/browser/ScenarioBrowserWorkbench';
import PhoneSimulatorShell from '../src/shell/PhoneSimulatorShell';
import { SimulatorActionType } from '../src/utils/telemetry/simulatorActionTaxonomy';
import type { SimulatorBrowserPayload } from '../src/types/session';

afterEach(cleanup);
const pages: [MockPage, MockPage] = [
    {
        id: 'One',
        title: 'First page',
        url: 'https://example.test/one',
        html: '<p>First full body</p>',
    },
    {
        id: 'Two',
        title: 'Second page',
        url: 'https://example.test/two',
        html: '<p>Second full body</p>',
    },
];
function address(value: string) {
    const input = screen.getByRole('searchbox', { name: 'Search or enter address' });
    fireEvent.change(input, { target: { value } });
    const form = input.closest('form');
    if (!form) throw new Error('Missing workbench address form');
    fireEvent.submit(form);
}
it('resolves authored URLs, preserves browser history on edits and removes deleted pages', async () => {
    const onNavigate = vi.fn();
    const view = render(<BrowserWorkbench pages={pages} onNavigate={onNavigate} />);
    address(pages[1].url);
    expect(screen.getByTitle('Second page').getAttribute('srcdoc')).toContain('Second full body');
    fireEvent.click(screen.getByRole('button', { name: 'Back page' }));
    expect(screen.getByTitle('First page')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Forward page' }));
    const updated = [pages[0], { ...pages[1], html: '<p>Updated full body</p>' }];
    view.rerender(<BrowserWorkbench pages={updated} onNavigate={onNavigate} />);
    await waitFor(() =>
        expect(screen.getByTitle('Second page').getAttribute('srcdoc')).toContain(
            'Updated full body',
        ),
    );
    expect(screen.getByRole('button', { name: 'Back page' }).hasAttribute('disabled')).toBe(false);
    view.rerender(<BrowserWorkbench pages={[pages[0]]} onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.queryByTitle('Second page')).toBeNull());
    expect(screen.getByTitle('First page')).toBeDefined();
    view.rerender(
        <BrowserWorkbench
            pages={[pages[1]]}
            pageId='removed-authored-id'
            onNavigate={onNavigate}
        />,
    );
    await waitFor(() => expect(screen.getByTitle('Second page')).toBeDefined());
    expect(onNavigate).toHaveBeenCalledWith(pages[1]);
});
it('accepts external page selection and contains unknown URL navigation in the sandbox', async () => {
    const view = render(<BrowserWorkbench pages={pages} pageId='One' />);
    address('https://unknown.example.test/path');
    expect(screen.getByTitle('Page unavailable')).toBeDefined();
    view.rerender(<BrowserWorkbench pages={pages} pageId='Two' />);
    await waitFor(() => expect(screen.getByTitle('Second page')).toBeDefined());
});
it('maps authored links and form submissions to scenario actions without collecting field values', () => {
    const onAction = vi.fn();
    const onNavigate = vi.fn();
    const payload: SimulatorBrowserPayload = {
        defaultPageId: 'One',
        pages: [
            {
                id: 'One',
                url: pages[0].url,
                title: 'Login',
                layout: 'login',
                submitTargetPageId: 'ResultCase',
                formFields: [{ name: 'password', label: 'Password', type: 'password' }],
                buttons: [{ label: 'Next', targetPageId: 'Two' }],
            },
            {
                id: 'ResultCase',
                url: 'https://example.test/result',
                title: 'Result page',
                layout: 'result',
                content: 'Submission complete',
                formFields: [{ name: 'unused', type: 'text', label: 'Not a login' }],
            },
        ],
    };
    render(
        <ScenarioBrowserWorkbench
            payload={payload}
            screen='One'
            onAction={onAction}
            onNavigate={onNavigate}
        />,
    );
    const frame = screen.getByTitle('Login');
    if (!(frame instanceof HTMLIFrameElement)) throw new Error('Expected sandbox frame');
    const source = frame.getAttribute('srcdoc') ?? '';
    const session = /"session":"([^"]+)"/.exec(source)?.[1];
    expect(source).not.toContain('data-simulator-capture');
    const post = (action: string, event: string) =>
        act(() =>
            window.dispatchEvent(
                new MessageEvent('message', {
                    origin: 'null',
                    source: frame.contentWindow,
                    data: {
                        type: BROWSER_ACTION_TYPE,
                        version: BROWSER_ACTION_VERSION,
                        pageId: 'One',
                        session,
                        action,
                        event,
                        values: { password: 'never-forward-this' },
                    },
                }),
            ),
        );
    post('scenario-button:0', 'click');
    expect(onAction).toHaveBeenCalledWith({
        type: SimulatorActionType.ClickLink,
        href: pages[0].url,
        linkIndex: 0,
        pageId: 'Two',
    });
    post('scenario-submit', 'submit');
    expect(onAction).toHaveBeenCalledWith({
        type: SimulatorActionType.SubmitForm,
        submitMetadata: {},
    });
    expect(JSON.stringify(onAction.mock.calls)).not.toContain('never-forward-this');
    expect(screen.getByTitle('Result page').getAttribute('srcdoc')).toContain(
        'Submission complete',
    );
    expect(screen.getByTitle('Result page').getAttribute('srcdoc')).not.toContain('Not a login');
    expect(onNavigate).toHaveBeenCalledWith('ResultCase');
    expect(screen.queryByText('submit: scenario-submit')).toBeNull();
});
it('leaves frame dimensions to the shared theme in standalone and compact modes', () => {
    const { container, rerender } = render(
        <PhoneSimulatorShell activeChannel='phone' onChannelChange={() => undefined} />,
    );
    expect(container.querySelector('.simulator-shell__frame')?.getAttribute('style')).toBeNull();
    rerender(
        <PhoneSimulatorShell activeChannel='phone' compact onChannelChange={() => undefined} />,
    );
    expect(container.querySelector('.simulator-shell__frame')?.getAttribute('style')).toBeNull();
});
