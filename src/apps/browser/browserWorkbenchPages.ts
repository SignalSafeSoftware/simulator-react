import { createSimulatorId } from '@signalsafe/simulator-core/apps/id';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { MockPage } from './BrowserWorkbench.js';

type Translate = ReturnType<typeof useSimulatorLocale>['t'];

const SEARCH_PAGE_ID = 'search';
export const SEARCH_ACTION = 'search';

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => `&#${character.codePointAt(0)};`);
}

export function samplePage(t: Translate): MockPage {
    const title = escapeHtml(t('app.browser.search.title'));
    const label = escapeHtml(t('app.browser.search.label'));
    return {
        id: SEARCH_PAGE_ID,
        title: t('app.browser.search.title'),
        url: 'https://example.test/search',
        html: `<h1>${title}</h1><form data-simulator-action="${SEARCH_ACTION}"><label>${label}<input name="query" data-simulator-capture="true"></label><button type="submit">${label}</button></form><p>${escapeHtml(t('app.browser.search.stays'))}</p>`,
    };
}

export function searchResultPage(t: Translate, query: string): MockPage {
    return {
        id: createSimulatorId(),
        title: t('app.browser.result.title'),
        url: 'https://example.test/results',
        html: `<h1>${escapeHtml(t('app.browser.result.title'))}</h1><p>${escapeHtml(t('app.browser.result.searched', { text: query }))}</p><p>${escapeHtml(t('app.browser.result.noNetwork'))}</p>`,
    };
}

export function unavailablePage(t: Translate, href: string): MockPage {
    return {
        id: createSimulatorId(),
        title: t('app.browser.unavailable.title'),
        url: href,
        html: `<h1>${escapeHtml(t('app.browser.unavailable.title'))}</h1><p>${escapeHtml(t('app.browser.unavailable.body'))}</p>`,
    };
}
