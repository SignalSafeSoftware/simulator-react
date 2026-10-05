// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import BrowserWorkbench, {
    HtmlMockPage,
    ReactMockPage,
} from '../src/apps/browser/BrowserWorkbench';
import { browserBridgeSource, installBrowserBridge } from '../src/apps/browser/browserBridge';
import { buildBrowserDocument, defaultBrowserCss } from '../src/apps/browser/browserDocument';

const config = {
    type: BROWSER_ACTION_TYPE,
    version: BROWSER_ACTION_VERSION,
    pageId: 'page',
    session: 'session',
    parentOrigin: window.location.origin,
} as const;

describe('installBrowserBridge', () => {
    let post: ReturnType<typeof vi.spyOn>;
    let dispose: () => void;

    beforeEach(() => {
        post = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
        dispose = installBrowserBridge(config);
    });

    afterEach(() => {
        dispose();
        post.mockRestore();
        document.body.innerHTML = '';
    });

    const mount = (html: string) => {
        document.body.innerHTML = html;
    };
    const lastMessage = () => post.mock.calls.at(-1)?.[0] as Record<string, unknown>;

    it('emits clicks on action elements and blocks link navigation', () => {
        mount(
            '<a href="#x" id="link"><span id="inner">go</span></a>' +
                '<button id="b" data-simulator-action="open">Open</button>' +
                '<a id="a" href="#y" data-simulator-action="anchor">A</a>' +
                '<div id="plain">nothing</div>',
        );
        const inner = document.getElementById('inner')!;
        const prevented = !inner.dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
        );
        expect(prevented).toBe(true);
        expect(post).not.toHaveBeenCalled();

        document.getElementById('b')!.click();
        expect(lastMessage()).toMatchObject({
            type: BROWSER_ACTION_TYPE,
            pageId: 'page',
            session: 'session',
            action: 'open',
            event: 'click',
            values: {},
        });
        expect(post.mock.calls.at(-1)?.[1]).toBe(window.location.origin);

        document.getElementById('a')!.click();
        expect(lastMessage()).toMatchObject({ action: 'anchor' });

        post.mockClear();
        document.getElementById('plain')!.click();
        expect(post).not.toHaveBeenCalled();
    });

    it('ignores clicks that are not on simple action elements', () => {
        mount(
            '<form data-simulator-action="f"><input id="submit" type="submit" data-simulator-action="s"></form>' +
                '<form id="form2" data-simulator-action="form"></form>' +
                '<select id="select" data-simulator-action="sel"><option>1</option></select>' +
                '<textarea id="area" data-simulator-action="area"></textarea>' +
                '<input id="text" data-simulator-action="text">' +
                '<button id="formButton" type="submit"></button>' +
                '<svg><circle id="circle" data-simulator-action="svg"></circle></svg>' +
                '<input id="plainButton" type="button" data-simulator-action="inputButton">' +
                '<button id="lone" type="submit" data-simulator-action="lone">x</button>',
        );
        for (const id of ['form2', 'select', 'area', 'text', 'formButton', 'circle']) {
            document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        expect(post).not.toHaveBeenCalled();
        // A submit button defers to the form's submit event instead of a click.
        document.getElementById('submit')!.click();
        expect(post).toHaveBeenCalledTimes(1);
        expect(lastMessage()).toMatchObject({ event: 'submit', action: 'f' });
        post.mockClear();
        document.getElementById('plainButton')!.click();
        expect(lastMessage()).toMatchObject({ action: 'inputButton' });
        document.getElementById('lone')!.click();
        expect(lastMessage()).toMatchObject({ action: 'lone' });
    });

    it('ignores click events whose target is not an element', () => {
        document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(post).not.toHaveBeenCalled();
    });

    it('collects captured form values on submit', () => {
        mount(
            '<form id="f" data-simulator-action="save">' +
                '<input name="name" value="Ada" data-simulator-capture="true">' +
                '<input name="skipped" value="no">' +
                '<input value="unnamed" data-simulator-capture="true">' +
                '<input name="pw" type="password" value="p" data-simulator-capture="true">' +
                '<input name="hidden" type="hidden" value="h" data-simulator-capture="true">' +
                '<input name="sub" type="submit" value="s" data-simulator-capture="true">' +
                '<input name="btn" type="button" value="b" data-simulator-capture="true">' +
                '<input name="off" value="d" disabled data-simulator-capture="true">' +
                '<input name="color" type="checkbox" value="red" checked data-simulator-capture="true">' +
                '<input name="color" type="checkbox" value="green" checked data-simulator-capture="true">' +
                '<input name="color" type="checkbox" value="blue" checked data-simulator-capture="true">' +
                '<input name="unchecked" type="checkbox" value="x" data-simulator-capture="true">' +
                '<input name="radio" type="radio" value="r" checked data-simulator-capture="true">' +
                '<select name="many" multiple data-simulator-capture="true">' +
                '<option value="a" selected>a</option><option value="b" selected>b</option></select>' +
                '<textarea name="notes" data-simulator-capture="true">hi</textarea>' +
                '<input name="__proto__" value="p1" data-simulator-capture="true">' +
                '<input name="__proto__" value="p2" data-simulator-capture="true">' +
                '</form>',
        );
        const form = document.getElementById('f')!;
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        const message = lastMessage();
        expect(message.event).toBe('submit');
        const values = message.values as Record<string, unknown>;
        expect(Object.keys(values).sort()).toEqual(
            ['__proto__', 'color', 'many', 'name', 'notes', 'radio'].sort(),
        );
        expect(values.name).toBe('Ada');
        expect(values.color).toEqual(['red', 'green', 'blue']);
        expect(values.many).toEqual(['a', 'b']);
        expect(Object.getOwnPropertyDescriptor(values, '__proto__')?.value).toEqual(['p1', 'p2']);
    });

    it('ignores submit events that are not from a form', () => {
        mount('<div id="d" data-simulator-action="x"></div>');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        document.getElementById('d')!.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        expect(post).not.toHaveBeenCalled();
    });

    it('emits change events with single, multiple or no values', () => {
        mount(
            '<input id="one" data-simulator-action="one" data-simulator-capture="true" value="v">' +
                '<select id="many" multiple data-simulator-action="many" data-simulator-capture="true">' +
                '<option value="a" selected>a</option><option value="b" selected>b</option></select>' +
                '<select id="none" multiple data-simulator-action="none" data-simulator-capture="true"><option value="a">a</option></select>' +
                '<input id="pw" type="password" data-simulator-action="pw" data-simulator-capture="true">' +
                '<div id="div" data-simulator-action="div"></div>' +
                '<input id="silent" value="x">',
        );
        const change = (id: string) =>
            document.getElementById(id)!.dispatchEvent(new Event('change', { bubbles: true }));
        change('one');
        expect(lastMessage()).toMatchObject({ event: 'change', values: { value: 'v' } });
        change('many');
        expect(lastMessage()).toMatchObject({ values: { value: ['a', 'b'] } });
        change('none');
        expect(lastMessage()).toMatchObject({ values: {} });
        change('pw');
        expect(lastMessage()).toMatchObject({ values: {} });
        change('div');
        expect(lastMessage()).toMatchObject({ action: 'div', values: {} });
        post.mockClear();
        change('silent');
        document.dispatchEvent(new Event('change', { bubbles: true }));
        expect(post).not.toHaveBeenCalled();
    });

    it('runs as serialized sandbox script text', () => {
        dispose();
        // eslint-disable-next-line no-new-func -- evaluates the sandbox script as the iframe would
        const stop = new Function(
            `return ${browserBridgeSource(JSON.stringify(config))}`,
        )() as () => void;
        mount(
            '<form id="f" data-simulator-action="save"><input name="a" value="1" data-simulator-capture="true"></form>',
        );
        document.getElementById('f')!.dispatchEvent(new Event('submit', { bubbles: true }));
        expect(lastMessage()).toMatchObject({ event: 'submit', values: { a: '1' } });
        stop();
        dispose = installBrowserBridge(config);
    });

    it('removes its listeners on dispose', () => {
        mount('<button id="b" data-simulator-action="open">x</button>');
        dispose();
        document.getElementById('b')!.click();
        expect(post).not.toHaveBeenCalled();
        dispose = installBrowserBridge(config);
    });
});

describe('buildBrowserDocument', () => {
    const build = (html: string, css = '', theme = '') =>
        buildBrowserDocument(html, css, 'page', 'session', 'https://host.test', theme);

    it('rejects oversized pages and styles', () => {
        expect(() => build('x'.repeat(200001))).toThrow('too large');
        expect(() => build('x', 'x'.repeat(50001))).toThrow('too large');
    });

    it('removes disallowed tags and attributes and neutralises links', () => {
        const html = build(
            '<script>alert(1)</script><iframe src="x"></iframe>' +
                '<p onclick="bad()" id="ok" data-other="1">Hi</p>' +
                '<a href="https://evil.test" data-simulator-action="go">link</a>' +
                '<img src="https://evil.test/a.png" alt="remote">' +
                '<img src="data:image/png;base64,AAAA" alt="local">',
        );
        const body = new DOMParser().parseFromString(html, 'text/html').body;
        expect(body.querySelector('iframe')).toBeNull();
        expect(body.querySelectorAll('script')).toHaveLength(1);
        expect(body.querySelector('script')!.textContent).not.toContain('alert(1)');
        const paragraph = body.querySelector('p')!;
        expect(paragraph.getAttribute('onclick')).toBeNull();
        expect(paragraph.getAttribute('data-other')).toBeNull();
        expect(paragraph.id).toBe('ok');
        expect(body.querySelector('a')!.getAttribute('href')).toBe('#');
        const images = body.querySelectorAll('img');
        expect(images[0]!.hasAttribute('src')).toBe(false);
        expect(images[1]!.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    });

    it('normalises input types and keeps allowed ones', () => {
        const html = build('<input id="a" type="file"><input id="b" type="email"><input id="c">');
        const body = new DOMParser().parseFromString(html, 'text/html').body;
        expect(body.querySelector('#a')!.getAttribute('type')).toBe('text');
        expect(body.querySelector('#b')!.getAttribute('type')).toBe('email');
        expect(body.querySelector('#c')!.hasAttribute('type')).toBe(false);
    });

    it('embeds theme and page css, page style tags and the bridge with an escaped config', () => {
        const html = build(
            '<style>.x{color:red}</style><p>body</p>',
            'p{color:blue}</style><script>x</script>',
            ':root{--t:1}',
        );
        expect(html).toContain(':root{--t:1}');
        expect(html).toContain(defaultBrowserCss);
        expect(html).toContain('p{color:blue}><script>x</script></style>');
        expect(html).toContain('.x{color:red}');
        expect(html).toContain('Content-Security-Policy');
        expect(html).toContain('"pageId":"page"');
    });

    it('removes nested style-close sequences that would reassemble after one pass', () => {
        const html = build('', 'a{}</</stylestyle><script>x</script>');
        expect(html).not.toContain('a{}</style');
        expect(html).toContain('a{}><script>x</script></style>');
    });

    it('escapes angle brackets in bridge configuration', () => {
        const html = buildBrowserDocument('', '', '<page>', 's', 'https://h.test');
        expect(html).toContain('\\u003cpage>');
        expect(html).not.toContain('"pageId":"<page>"');
    });
});

describe('HtmlMockPage', () => {
    const page = { id: 'p1', title: 'Mock', url: 'https://x.test', html: '<p>hi</p>' };

    const sessionOf = (frame: HTMLIFrameElement) =>
        /"session":"([^"]+)"/.exec(frame.getAttribute('srcdoc') ?? '')![1]!;

    const send = (source: Window | null, data: unknown, origin = 'null') =>
        act(() => {
            window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
        });

    const action = (session: string, overrides: Record<string, unknown> = {}) => ({
        type: BROWSER_ACTION_TYPE,
        version: BROWSER_ACTION_VERSION,
        pageId: 'p1',
        session,
        action: 'go',
        event: 'click',
        values: {},
        ...overrides,
    });

    it('forwards valid messages from the sandboxed frame only', () => {
        const onAction = vi.fn();
        render(<HtmlMockPage page={page} onAction={onAction} />);
        const frame = screen.getByTitle('Mock') as HTMLIFrameElement;
        const session = sessionOf(frame);

        send(frame.contentWindow, action(session));
        expect(onAction).toHaveBeenCalledTimes(1);

        send(window, action(session));
        send(frame.contentWindow, action(session), 'https://evil.test');
        send(frame.contentWindow, { nope: true });
        send(frame.contentWindow, action(session, { pageId: 'other' }));
        send(frame.contentWindow, action('wrong'));
        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('uses the latest callback and removes its listener on unmount', () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender, unmount } = render(<HtmlMockPage page={page} onAction={first} />);
        const frame = screen.getByTitle('Mock') as HTMLIFrameElement;
        const session = sessionOf(frame);
        rerender(<HtmlMockPage page={page} onAction={second} />);
        send(frame.contentWindow, action(session));
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
        const win = frame.contentWindow;
        unmount();
        send(win, action(session));
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('shows an alert when the page cannot be built', () => {
        render(<HtmlMockPage page={{ ...page, html: 'x'.repeat(200001) }} onAction={vi.fn()} />);
        expect(screen.getByRole('alert').textContent).toBe('Mock page is too large.');
    });

    it('falls back to the localised message for non-Error failures', () => {
        const spy = vi.spyOn(DOMParser.prototype, 'parseFromString').mockImplementation(() => {
            throw 'broken';
        });
        render(<HtmlMockPage page={page} onAction={vi.fn()} />);
        spy.mockRestore();
        expect(screen.getByRole('alert').textContent).toBe('Page could not be rendered.');
    });
});

describe('ReactMockPage', () => {
    it('emits validated custom actions', () => {
        const onAction = vi.fn();
        render(
            <ReactMockPage
                pageId='r1'
                onAction={onAction}
                render={(emit) => (
                    <>
                        <button onClick={() => emit('open', { id: '1' })}>valued</button>
                        <button onClick={() => emit('bare')}>bare</button>
                        <button onClick={() => emit('', {})}>invalid</button>
                    </>
                )}
            />,
        );
        fireEvent.click(screen.getByText('valued'));
        fireEvent.click(screen.getByText('bare'));
        fireEvent.click(screen.getByText('invalid'));
        expect(onAction).toHaveBeenCalledTimes(2);
        expect(onAction.mock.calls[0]![0]).toMatchObject({
            pageId: 'r1',
            session: 'host-react',
            event: 'custom',
            action: 'open',
            values: { id: '1' },
        });
    });
});

describe('BrowserWorkbench', () => {
    const address = () => screen.getByLabelText('Search or enter address') as HTMLInputElement;
    const submit = (value: string) => {
        fireEvent.change(address(), { target: { value } });
        fireEvent.submit(address().closest('form')!);
    };
    const frame = () => document.querySelector('iframe') as HTMLIFrameElement;
    const post = (data: unknown) =>
        act(() => {
            window.dispatchEvent(
                new MessageEvent('message', {
                    data,
                    origin: 'null',
                    source: frame().contentWindow,
                }),
            );
        });
    const session = () => /"session":"([^"]+)"/.exec(frame().getAttribute('srcdoc')!)![1]!;
    const output = () => document.querySelector('output')!.textContent;

    it('renders only the supplied templates in templates mode', () => {
        render(<BrowserWorkbench mode='templates' templates={<p>templates here</p>} />);
        expect(screen.getByText('templates here')).toBeTruthy();
        expect(document.querySelector('form')).toBeNull();
    });

    it('renders the trusted React example and records its actions', () => {
        render(<BrowserWorkbench mode='react' templates={null} />);
        fireEvent.click(screen.getByText('My account'));
        expect(output()).toBe('custom: open-account');
    });

    it('navigates through searches, history and addresses in html mode', () => {
        render(<BrowserWorkbench templates={null} themeCss=':root{}' />);
        expect(frame().title).toBe('Local search');
        const back = screen.getByLabelText('Back page') as HTMLButtonElement;
        const forward = screen.getByLabelText('Forward page') as HTMLButtonElement;
        expect(back.disabled).toBe(true);
        expect(forward.disabled).toBe(true);

        post({
            type: BROWSER_ACTION_TYPE,
            version: BROWSER_ACTION_VERSION,
            pageId: 'search',
            session: session(),
            action: 'search',
            event: 'submit',
            values: { query: 'cats' },
        });
        expect(output()).toBe('submit: search');
        expect(frame().title).toBe('Search result');
        expect(frame().getAttribute('srcdoc')).toContain('You searched for: cats');
        expect(address().value).toBe('https://example.test/results');

        post({
            type: BROWSER_ACTION_TYPE,
            version: BROWSER_ACTION_VERSION,
            pageId: 'search',
            session: 'stale',
            action: 'other',
            event: 'click',
            values: {},
        });

        fireEvent.click(back);
        expect(frame().title).toBe('Local search');
        expect(forward.disabled).toBe(false);
        fireEvent.click(forward);
        expect(frame().title).toBe('Search result');

        fireEvent.click(back);
        post({
            type: BROWSER_ACTION_TYPE,
            version: BROWSER_ACTION_VERSION,
            pageId: 'search',
            session: session(),
            action: 'search',
            event: 'submit',
            values: {},
        });
        expect(frame().getAttribute('srcdoc')).toContain('You searched for: </p>');

        submit('dogs');
        expect(frame().getAttribute('srcdoc')).toContain('You searched for: dogs');

        submit(`<b>"it's"</b>`);
        expect(frame().getAttribute('srcdoc')).toContain('&lt;b&gt;"it\'s"&lt;/b&gt;');

        submit('   ');
        expect(frame().getAttribute('srcdoc')).toContain('&lt;b&gt;');

        submit('example.org/page');
        expect(frame().title).toBe('Page unavailable');
        expect(address().value).toBe('https://example.org/page');
        expect(output()).toBe('');

        submit('https://example.org/page');
        expect(frame().title).toBe('Page unavailable');

        submit('ftp://example.org');
        expect(output()).toBe('Use an HTTP or HTTPS address.');

        submit('http://[::1');
        expect(output()).toBe('Enter a valid address or search term.');
    });

    it('trims history to the most recent hundred pages', () => {
        render(<BrowserWorkbench templates={null} />);
        for (let index = 0; index < 105; index++) submit(`site${index}.test`);
        expect(address().value).toBe('https://site104.test/');
        const back = screen.getByLabelText('Back page') as HTMLButtonElement;
        expect(back.disabled).toBe(false);
        for (let index = 0; index < 99; index++) fireEvent.click(back);
        expect(back.disabled).toBe(true);
        expect(address().value).toBe('https://site5.test/');
    });
});
