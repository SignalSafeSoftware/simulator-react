import { escapeBrowserHtml } from './browserDocument.js';
import type { BrowserAction } from '@signalsafe/simulator-core/apps/browserProtocol';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import {
    BrowserLayout,
    type SimulatorAction,
    type SimulatorBrowserPage,
} from '../../types/session.js';
import { normalizeBrowserLayout } from '../../utils/navigation/simulatorBrowserEdges.js';
import { getFieldInputType } from '../../utils/payload/browserFieldType.js';
import type { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { MockPage } from './BrowserWorkbench.js';

type Translate = ReturnType<typeof useSimulatorLocale>['t'];
const SUBMIT_ACTION = 'scenario-submit';
const DOWNLOAD_ACTION = 'scenario-download';
const BUTTON_ACTION = 'scenario-button:';

/** Authored data becomes sandbox content; the workbench owns all browser chrome. */
export function scenarioBrowserPage(page: SimulatorBrowserPage, t: Translate): MockPage {
    const layout = normalizeBrowserLayout(page.layout);
    const title = page.title || t('app.browser.pageTitle');
    const content =
        page.content ||
        (layout === BrowserLayout.Result
            ? t('screen.browserPageRenderer.simulation.complete.you.submitted.credentials.on.a')
            : '');
    const fields = (
        layout === BrowserLayout.Login || layout === BrowserLayout.Landing
            ? (page.formFields ?? [])
            : []
    )
        .map(
            (field) =>
                `<label>${escapeBrowserHtml(field.label)}<input name="${escapeBrowserHtml(field.name)}" type="${getFieldInputType(field.type)}" autocomplete="off"></label>`,
        )
        .join('');
    const form = fields
        ? `<form data-simulator-action="${SUBMIT_ACTION}">${fields}<button type="submit">${escapeBrowserHtml(t('screen.browserPageRenderer.submit'))}</button></form>`
        : '';
    const buttons = (page.buttons ?? [])
        .map(
            (button, index) =>
                `<button type="button" data-simulator-action="${BUTTON_ACTION}${index}">${escapeBrowserHtml(button.label)}</button>`,
        )
        .join(' ');
    const download =
        layout === BrowserLayout.Download && !buttons
            ? `<button type="button" data-simulator-action="${DOWNLOAD_ACTION}">${escapeBrowserHtml(t('screen.emailMessageDetail.download'))}</button>`
            : '';
    return {
        id: page.id,
        title,
        url: page.url,
        html: `${page.logoUrl ? `<img src="${escapeBrowserHtml(page.logoUrl)}" alt="">` : ''}<h1>${escapeBrowserHtml(title)}</h1>${page.warningBanner ? `<aside role="alert">${escapeBrowserHtml(page.warningBanner)}</aside>` : ''}${content ? `<p style="white-space:pre-wrap">${escapeBrowserHtml(content)}</p>` : ''}${page.showMediaPlaceholder ? '<div aria-hidden="true">▶</div>' : ''}${form}${buttons}${download}`,
    };
}

/** Only authored action identifiers map into telemetry; field values stay in the sandbox. */
export function scenarioBrowserAction(
    page: SimulatorBrowserPage,
    event: BrowserAction,
): SimulatorAction | null {
    if (event.action === SUBMIT_ACTION && event.event === 'submit')
        return SimulatorActions.submitForm({});
    if (event.action === DOWNLOAD_ACTION && event.event === 'click')
        return SimulatorActions.downloadClick(page.id);
    if (!event.action.startsWith(BUTTON_ACTION) || event.event !== 'click') return null;
    const index = Number(event.action.slice(BUTTON_ACTION.length));
    if (!Number.isInteger(index) || index < 0) return null;
    const button = page.buttons?.[index];
    if (!button) return null;
    return normalizeBrowserLayout(page.layout) === BrowserLayout.Download
        ? SimulatorActions.downloadClick(button.href ?? button.label)
        : SimulatorActions.clickLink({
              href: button.href ?? page.url,
              linkIndex: index,
              pageId: button.targetPageId,
          });
}
