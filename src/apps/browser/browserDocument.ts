import {
    BROWSER_ACTION_TYPE,
    BROWSER_ACTION_VERSION,
} from '@signalsafe/simulator-core/apps/browserProtocol';
import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import { browserBridgeSource } from './browserBridge.js';

export const defaultBrowserCss = `:root{font:14px system-ui;color:var(--simulator-text,#263b35);background:var(--simulator-bg,#fcfdf9)}*{box-sizing:border-box}body{margin:0;padding:16px;overflow-wrap:anywhere}h1{font-size:1.5rem}input,textarea,select,button{font:inherit;padding:11px 13px;border:1px solid var(--simulator-input-border,#dfe7d7);border-radius:10px;max-width:100%;background:var(--simulator-input-bg,#f3f6ee);color:inherit;min-height:40px}label{display:block;margin:12px 0;font-weight:600}input,textarea{display:block;width:100%;margin-top:6px}button{cursor:pointer;border-radius:12px;background:var(--simulator-accent,#285b4e);color:var(--simulator-phone-dialer-call-color,#fff)}a{color:var(--simulator-accent,#285b4e)}img{max-width:100%;height:auto}:focus-visible{outline:3px solid var(--simulator-accent,#285b4e);outline-offset:2px}`;
const allowedTags = new Set(
    'a article aside b blockquote br button caption code col colgroup dd details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main nav ol option p pre section select small span strong sub summary sup table tbody td textarea th thead tr ul style'.split(
        ' ',
    ),
);
const allowedAttributes = new Set(
    'id class style title role aria-label aria-describedby aria-labelledby aria-hidden alt width height type name value placeholder required disabled checked selected multiple rows cols min max step maxlength for href src data-simulator-action data-simulator-capture'.split(
        ' ',
    ),
);
const allowedInputTypes = new Set(
    'text password email number checkbox radio date time submit button search hidden'.split(' '),
);
const safeImageSource = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i;

function sanitizeAttributes(element: Element): void {
    for (const attribute of Array.from(element.attributes)) {
        if (!allowedAttributes.has(attribute.name)) element.removeAttribute(attribute.name);
        else if (attribute.name === 'src' && !safeImageSource.test(attribute.value))
            element.removeAttribute('src');
        else if (attribute.name === 'href') element.setAttribute('href', '#');
    }
}

function sanitizeDocument(document: Document): void {
    for (const element of Array.from(document.querySelectorAll('*'))) {
        if (['HTML', 'HEAD', 'BODY'].includes(element.tagName)) continue;
        if (!allowedTags.has(element.tagName.toLowerCase())) {
            element.remove();
            continue;
        }
        sanitizeAttributes(element);
        if (
            element.tagName === 'INPUT' &&
            !allowedInputTypes.has(element.getAttribute('type') ?? 'text')
        )
            element.setAttribute('type', 'text');
    }
}

export function buildBrowserDocument(
    html: string,
    css: string,
    pageId: string,
    session: string,
    parentOrigin: string,
    themeCss = '',
): string {
    if (html.length > 200000 || css.length > 50000) throw new Error('Mock page is too large.');
    const document = new DOMParser().parseFromString(html, 'text/html');
    sanitizeDocument(document);
    const nonce = createSimulatorId().replaceAll('-', '');
    const config = JSON.stringify({
        pageId,
        session,
        parentOrigin,
        type: BROWSER_ACTION_TYPE,
        version: BROWSER_ACTION_VERSION,
    }).replaceAll('<', String.raw`\u003c`);
    const bridge = browserBridgeSource(config);
    const safeCss = css.replace(/<\/style/gi, '');
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; connect-src 'none'; base-uri 'none'"><style>${themeCss}\n${defaultBrowserCss}\n${safeCss}</style>${Array.from(
        document.head.querySelectorAll('style'),
    )
        .map((style) => style.outerHTML)
        .join(
            '',
        )}</head><body>${document.body.innerHTML}<script nonce="${nonce}">${bridge}</script></body></html>`;
}
