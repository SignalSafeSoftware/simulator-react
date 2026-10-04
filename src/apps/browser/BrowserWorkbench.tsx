import {
    SIM_INPUT,
    SimulatorButtonTone,
    simBtnToneClass,
} from '../../ui/styles/simulatorClasses.js';
import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DevicePage } from '../shared/DevicePage.js';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { browserActionSchema } from '@signalsafe/simulator-core/apps/browserProtocol';
import type { BrowserAction } from '@signalsafe/simulator-core/apps/browserProtocol';
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
}: {
    themeCss?: string;
    page: MockPage;
    onAction: (action: BrowserAction) => void;
}) {
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
        <p role="alert">{document.error}</p>
    ) : (
        <iframe
            key={document.session}
            ref={frame}
            title={page.title}
            sandbox="allow-scripts allow-forms"
            referrerPolicy="no-referrer"
            srcDoc={document.html}
            className="prototype-browser-frame"
        />
    );
}
/** Trusted consuming-app components run in the host and use the same action envelope. */
export function ReactMockPage({
    pageId,
    render,
    onAction,
}: {
    pageId: string;
    render: (emit: (action: string, values?: Record<string, string>) => void) => ReactNode;
    onAction: (event: BrowserAction) => void;
}) {
    return (
        <div className="prototype-react-page">
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
const sample: MockPage = {
    id: 'search',
    title: 'Local search',
    url: 'https://example.test/search',
    html: '<h1>Local search</h1><form data-simulator-action="search"><label>Search<input name="query" data-simulator-capture="true"></label><button type="submit">Search</button></form><p>This page stays inside the simulator.</p>',
};
export default function BrowserWorkbench({
    templates,
    mode = 'html',
    themeCss = '',
}: {
    themeCss?: string;
    templates: ReactNode;
    mode?: 'html' | 'react' | 'templates';
}) {
    const [page, setPage] = useState(sample);
    const [address, setAddress] = useState(sample.url);
    const [history, setHistory] = useState<MockPage[]>([sample]);
    const [position, setPosition] = useState(0);
    const [last, setLast] = useState('');
    const { t } = useSimulatorLocale();
    function navigate(next: MockPage) {
        setHistory((previous) => [...previous.slice(0, position + 1), next].slice(-100));
        setPosition(Math.min(position + 1, 99));
        setPage(next);
        setAddress(next.url);
    }
    function goTo(index: number) {
        const target = history[index];
        if (!target) return;
        setPosition(index);
        setPage(target);
        setAddress(target.url);
    }
    function search(query: string) {
        const text = query.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
        navigate({
            id: createSimulatorId(),
            title: 'Search result',
            url: 'https://example.test/results',
            html: `<h1>Search result</h1><p>You searched for: ${text}</p><p>No network request was made.</p>`,
        });
    }
    function action(event: BrowserAction) {
        setLast(`${event.event}: ${event.action}`);
        if (event.action === 'search') search(String(event.values.query ?? ''));
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
                    title: 'Page unavailable',
                    url: url.href,
                    html: '<h1>Page unavailable</h1><p>This address has no page configured in the simulator.</p>',
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
                        className="prototype-address-group"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitAddress();
                        }}
                    >
                        <button
                            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                            type="button"
                            aria-label={t('app.browser.back')}
                            title={t('app.browser.back')}
                            disabled={position === 0}
                            onClick={() => goTo(position - 1)}
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                        </button>
                        <button
                            className={simBtnToneClass(SimulatorButtonTone.NeutralOutline)}
                            type="button"
                            aria-label={t('app.browser.forward')}
                            title={t('app.browser.forward')}
                            disabled={position === history.length - 1}
                            onClick={() => goTo(position + 1)}
                        >
                            <ArrowRight size={18} aria-hidden="true" />
                        </button>
                        <input
                            className={SIM_INPUT}
                            type="search"
                            aria-label={t('app.browser.address')}
                            placeholder={t('app.browser.address')}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </form>
                    {mode === 'html' ? (
                        <HtmlMockPage page={page} onAction={action} themeCss={themeCss} />
                    ) : (
                        <ReactMockPage
                            pageId="react-example"
                            onAction={action}
                            render={(emit) => (
                                <>
                                    <h3>React example</h3>
                                    <p>
                                        A trusted client component using the simulator&apos;s
                                        default styles.
                                    </p>
                                    <button
                                        className={simBtnToneClass(
                                            SimulatorButtonTone.NeutralOutline,
                                        )}
                                        onClick={() => emit('open-account')}
                                    >
                                        My account
                                    </button>
                                </>
                            )}
                        />
                    )}
                    <output aria-live="polite">{last}</output>
                </>
            )}
        </DevicePage>
    );
}
