import { SIM_INPUT, SIM_BTN_OUTLINE } from '../../ui/styles/simulatorClasses.js';
import { INPUT_TYPE_SEARCH, AUTOCOMPLETE_OFF } from '../../constants.js';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
    browserActionSchema,
    type BrowserAction,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DevicePage } from '../shared/DevicePage.js';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildBrowserDocument } from './browserDocument.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
export interface MockPage {
    id: string;
    title: string;
    url: string;
    html: string;
    css?: string;
}
export function HtmlMockPage({
    page,
    onAction,
    themeCss = '',
}: Readonly<{
    themeCss?: string;
    page: MockPage;
    onAction: (action: BrowserAction) => void;
}>) {
    const frame = useRef<HTMLIFrameElement>(null);
    const { t } = useSimulatorLocale();
    const callback = useRef(onAction);
    useEffect(() => {
        callback.current = onAction;
    }, [onAction]);
    const document = useMemo(() => {
        const session = createSimulatorId();
        try {
            return {
                session,
                html: buildBrowserDocument(
                    page.html,
                    page.css ?? '',
                    page.id,
                    session,
                    window.location.origin,
                    themeCss,
                ),
                error: '',
            };
        } catch (reason) {
            return {
                session,
                html: '',
                error: reason instanceof Error ? reason.message : t('app.browser.renderFailed'),
            };
        }
    }, [page.html, page.css, page.id, themeCss, t]);
    useEffect(() => {
        function receive(event: MessageEvent<unknown>) {
            if (event.source !== frame.current?.contentWindow || event.origin !== 'null') return;
            const parsed = browserActionSchema.safeParse(event.data);
            if (
                parsed.success &&
                parsed.data.pageId === page.id &&
                parsed.data.session === document.session
            )
                callback.current(parsed.data);
        }
        window.addEventListener('message', receive);
        return () => window.removeEventListener('message', receive);
    }, [page.id, document.session]);
    return document.error ? (
        <p role='alert'>{document.error}</p>
    ) : (
        <iframe
            key={document.session}
            ref={frame}
            title={page.title}
            sandbox='allow-scripts allow-forms'
            referrerPolicy='no-referrer'
            srcDoc={document.html}
            className='prototype-browser-frame'
        />
    );
}
/** Trusted consuming-app components run in the host and use the same action envelope. */
export function ReactMockPage({
    pageId,
    render,
    onAction,
}: Readonly<{
    pageId: string;
    render: (emit: (action: string, values?: Record<string, string>) => void) => ReactNode;
    onAction: (event: BrowserAction) => void;
}>) {
    return (
        <div className='prototype-react-page'>
            {render((action, values = {}) => {
                const parsed = browserActionSchema.safeParse({
                    type: BROWSER_ACTION_TYPE,
                    version: BROWSER_ACTION_VERSION,
                    pageId,
                    session: 'host-react',
                    event: 'custom',
                    action,
                    values,
                });
                if (parsed.success) onAction(parsed.data);
            })}
        </div>
    );
}
type Translate = ReturnType<typeof useSimulatorLocale>['t'];

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => `&#${character.codePointAt(0)};`);
}

const SEARCH_PAGE_ID = 'search';
const SEARCH_ACTION = 'search';

function samplePage(t: Translate): MockPage {
    const title = escapeHtml(t('app.browser.search.title'));
    const label = escapeHtml(t('app.browser.search.label'));
    return {
        id: SEARCH_PAGE_ID,
        title: t('app.browser.search.title'),
        url: 'https://example.test/search',
        html: `<h1>${title}</h1><form data-simulator-action="${SEARCH_ACTION}"><label>${label}<input name="query" data-simulator-capture="true"></label><button type="submit">${label}</button></form><p>${escapeHtml(t('app.browser.search.stays'))}</p>`,
    };
}
export default function BrowserWorkbench({
    templates,
    mode = 'html',
    themeCss = '',
}: Readonly<{
    themeCss?: string;
    templates: ReactNode;
    mode?: 'html' | 'react' | 'templates';
}>) {
    const { t } = useSimulatorLocale();
    const [sample] = useState(() => samplePage(t));
    const [page, setPage] = useState(sample);
    const [address, setAddress] = useState(sample.url);
    const [history, setHistory] = useState<MockPage[]>([sample]);
    const [position, setPosition] = useState(0);
    const [last, setLast] = useState('');
    const previousPage = history[position - 1];
    const nextPage = history[position + 1];
    function navigate(next: MockPage) {
        setHistory((previous) => [...previous.slice(0, position + 1), next].slice(-100));
        setPosition(Math.min(position + 1, 99));
        setPage(next);
        setAddress(next.url);
    }
    function goTo(index: number, target: MockPage) {
        setPosition(index);
        setPage(target);
        setAddress(target.url);
    }
    function search(query: string) {
        navigate({
            id: createSimulatorId(),
            title: t('app.browser.result.title'),
            url: 'https://example.test/results',
            html: `<h1>${escapeHtml(t('app.browser.result.title'))}</h1><p>${escapeHtml(t('app.browser.result.searched', { text: query }))}</p><p>${escapeHtml(t('app.browser.result.noNetwork'))}</p>`,
        });
    }
    function action(event: BrowserAction) {
        setLast(`${event.event}: ${event.action}`);
        if (event.action === SEARCH_ACTION) search(String(event.values.query ?? ''));
    }
    function submitAddress() {
        const value = address.trim();
        if (!value) return;
        const looksLikeUrl = /^[a-z][a-z0-9+.-]*:/i.test(value) || /^[^\s/]+\.[^\s/]+/.test(value);
        if (!looksLikeUrl) {
            search(value);
            return;
        }
        try {
            const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
            if (!['http:', 'https:'].includes(url.protocol)) {
                setLast(t('app.browser.badProtocol'));
                return;
            }
            const existing = history.find((item) => item.url === url.href);
            navigate(
                existing ?? {
                    id: createSimulatorId(),
                    title: t('app.browser.unavailable.title'),
                    url: url.href,
                    html: `<h1>${escapeHtml(t('app.browser.unavailable.title'))}</h1><p>${escapeHtml(t('app.browser.unavailable.body'))}</p>`,
                },
            );
            setLast('');
        } catch {
            setLast(t('app.browser.badAddress'));
        }
    }
    return (
        <DevicePage title={t('app.browser.title')} listLayout>
            {mode === 'templates' ? (
                templates
            ) : (
                <>
                    <form
                        className='prototype-address-group'
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitAddress();
                        }}
                    >
                        <button
                            className={SIM_BTN_OUTLINE}
                            type='button'
                            aria-label={t('app.browser.back')}
                            title={t('app.browser.back')}
                            disabled={!previousPage}
                            onClick={() => previousPage && goTo(position - 1, previousPage)}
                        >
                            <ArrowLeft size={18} aria-hidden='true' />
                        </button>
                        <button
                            className={SIM_BTN_OUTLINE}
                            type='button'
                            aria-label={t('app.browser.forward')}
                            title={t('app.browser.forward')}
                            disabled={!nextPage}
                            onClick={() => nextPage && goTo(position + 1, nextPage)}
                        >
                            <ArrowRight size={18} aria-hidden='true' />
                        </button>
                        <input
                            className={SIM_INPUT}
                            type={INPUT_TYPE_SEARCH}
                            aria-label={t('app.browser.address')}
                            placeholder={t('app.browser.address')}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            autoComplete={AUTOCOMPLETE_OFF}
                            spellCheck={false}
                        />
                    </form>
                    {mode === 'html' ? (
                        <HtmlMockPage page={page} onAction={action} themeCss={themeCss} />
                    ) : (
                        <ReactMockPage
                            pageId='react-example'
                            onAction={action}
                            render={(emit) => (
                                <>
                                    <h3>{t('app.browser.example.title')}</h3>
                                    <p>{t('app.browser.example.body')}</p>
                                    <button
                                        className={SIM_BTN_OUTLINE}
                                        onClick={() => emit('open-account')}
                                    >
                                        {t('app.browser.example.account')}
                                    </button>
                                </>
                            )}
                        />
                    )}
                    <output aria-live='polite'>{last}</output>
                </>
            )}
        </DevicePage>
    );
}
