/**
 * Renders a single browser page by layout family. Wireframe: landing, login/form, content/download/result.
 * Uses SimulatorBrowserChrome (title above bar, back/forward/refresh/home, address bar).
 */
import {
    BrowserLayout,
    type SimulatorAction,
    type SimulatorBrowserPage,
} from '../../types/session.js';
import {
    SIM_BTN_SM,
    SIM_FLEX_WRAP,
    SIM_ROUNDED_NONE,
    SIM_TEXT_CENTER,
    SIM_TEXT_SECONDARY,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { normalizeBrowserLayout } from '../../utils/navigation/simulatorBrowserEdges.js';
import { getFieldInputType } from '../../utils/payload/browserFieldType.js';
import { joinKeyParts, withStableKeys } from '../../utils/lists/stableKeys.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { ReactNode } from 'react';

import SimulatorBrowserChrome from '../../apps/browser/SimulatorBrowserChrome.js';
import {
    BrowserDownloadActions,
    BrowserLoginLayout,
    MediaControlsBar,
    MediaPlaceholder,
    renderPageButton,
    renderWarningBanner,
    urlHighlight,
} from './BrowserPageParts.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simLayout, simSpacing, simTypo } from '../../simulatorStyles.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
} from '../../ui/primitives.js';
import {
    type SimulatorChoiceRenderProps,
    type SimulatorFeedbackRenderProps,
} from '../../ui/renderSlots.js';

export interface BrowserPageRendererProps {
    page: SimulatorBrowserPage;
    onAction: (action: SimulatorAction) => void;
    /** When set, chrome Back button is shown and calls this. */
    onBack?: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode;
}

export default function BrowserPageRenderer({
    page,
    onAction,
    onBack,
    renderChoice,
    renderFeedback,
}: Readonly<BrowserPageRendererProps>) {
    const screenLocale = useSimulatorLocale();

    const {
        url,
        title,
        layout,
        content,
        buttons,
        formFields,
        logoUrl,
        warningBanner,
        showMediaPlaceholder,
    } = page;
    const layoutNorm = normalizeBrowserLayout(layout);
    const displayTitle = title || screenLocale.t('app.browser.pageTitle');
    const pageBtnClass = joinClasses(SIM_ROUNDED_NONE, SIM_BTN_SM);
    const keyedFormFields = withStableKeys(formFields ?? [], (field) =>
        joinKeyParts([field.name, field.label, field.type]),
    );
    const keyedButtons = withStableKeys(buttons ?? [], (button) =>
        joinKeyParts([button.label, button.href, button.targetPageId]),
    );

    const contentParagraph = content != null && content !== '' && (
        <p
            className={joinClasses(simSpacing.mb3, SIM_TEXT_SM, SIM_TEXT_SECONDARY)}
            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}
        >
            {content}
        </p>
    );
    const warning =
        warningBanner != null &&
        warningBanner !== '' &&
        renderWarningBanner(warningBanner, renderFeedback);
    const formFieldInputs = keyedFormFields.map(({ item: field, key }) => (
        <SimulatorField key={key} className={simSpacing.mb2}>
            <SimulatorLabel className={simLayout.fieldLabel}>{field.label}</SimulatorLabel>
            <SimulatorInput
                type={getFieldInputType(field.type)}
                className={SIM_ROUNDED_NONE}
                autoComplete="off"
                aria-label={field.label}
            />
        </SimulatorField>
    ));
    const linkButtons = (containerClass: string) =>
        buttons != null &&
        buttons.length > 0 && (
            <div className={containerClass}>
                {keyedButtons.map(({ item: btn, key, index }) => (
                    <span key={key}>
                        {renderPageButton(
                            btn.label,
                            () =>
                                onAction(
                                    SimulatorActions.clickLink({
                                        href: btn.href ?? url,
                                        linkIndex: index,
                                        pageId: btn.targetPageId,
                                    }),
                                ),
                            SimulatorButtonTone.Primary,
                            pageBtnClass,
                            renderChoice,
                        )}
                    </span>
                ))}
            </div>
        );

    return (
        <SimulatorBrowserChrome
            title={displayTitle}
            url={url || displayTitle}
            urlHighlightSegments={urlHighlight(url)}
            onBack={onBack}
        >
            {/* Landing / generic page: optional logo, content area, buttons */}
            {(layoutNorm === BrowserLayout.Landing || layoutNorm === BrowserLayout.Content) && (
                <>
                    {logoUrl != null && logoUrl !== '' && (
                        <div className={joinClasses(simSpacing.mb3, SIM_TEXT_CENTER)}>
                            <img src={logoUrl} alt="" style={{ maxHeight: 48 }} />
                        </div>
                    )}
                    {layoutNorm === BrowserLayout.Content && warning}
                    {layoutNorm === BrowserLayout.Content && showMediaPlaceholder === true && (
                        <>
                            <MediaPlaceholder minHeight={160} iconSize="2.5rem" />
                            <MediaControlsBar />
                        </>
                    )}
                    {contentParagraph}
                    {layoutNorm === BrowserLayout.Landing &&
                        formFields != null &&
                        formFields.length > 0 && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onAction(SimulatorActions.submitForm({}));
                                }}
                            >
                                {formFieldInputs}
                                <SimulatorButton
                                    type="submit"
                                    tone={SimulatorButtonTone.Primary}
                                    className={SIM_ROUNDED_NONE}
                                >
                                    {screenLocale.t('screen.browserPageRenderer.submit')}
                                </SimulatorButton>
                            </form>
                        )}
                    {linkButtons(joinClasses(simLayout.actionsRow, simSpacing.mt2))}
                </>
            )}

            {/* Login / form page: centered modal-like form, Submit (blue), Cancel (gray) */}
            {layoutNorm === BrowserLayout.Login && (
                <BrowserLoginLayout
                    displayTitle={displayTitle}
                    content={content}
                    formFields={formFields}
                    formFieldInputs={formFieldInputs}
                    onAction={onAction}
                    onBack={onBack}
                    renderChoice={renderChoice}
                />
            )}

            {/* Result page: post-submit message */}
            {layoutNorm === BrowserLayout.Result && (
                <p className={simTypo.emptyState}>
                    {content ??
                        screenLocale.t(
                            'screen.browserPageRenderer.simulation.complete.you.submitted.credentials.on.a',
                        )}
                </p>
            )}

            {/* Download page: optional warning, media placeholder, content, download buttons */}
            {layoutNorm === BrowserLayout.Download && (
                <>
                    {warning}
                    {showMediaPlaceholder === true && (
                        <MediaPlaceholder minHeight={140} iconSize="2rem" />
                    )}
                    {contentParagraph}
                    <BrowserDownloadActions
                        page={page}
                        keyedButtons={keyedButtons}
                        pageBtnClass={pageBtnClass}
                        onAction={onAction}
                        renderChoice={renderChoice}
                    />
                </>
            )}

            {/* Fallback for unknown layout: render content + buttons */}
            {layoutNorm !== BrowserLayout.Landing &&
                layoutNorm !== BrowserLayout.Content &&
                layoutNorm !== BrowserLayout.Login &&
                layoutNorm !== BrowserLayout.Result &&
                layoutNorm !== BrowserLayout.Download && (
                    <>
                        {warning}
                        {contentParagraph}
                        {linkButtons(joinClasses(simLayout.actionsRow, SIM_FLEX_WRAP))}
                    </>
                )}
        </SimulatorBrowserChrome>
    );
}
