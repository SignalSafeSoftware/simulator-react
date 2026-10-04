import { BrowserLayout } from '../../types/session.js';
import {
    SIM_BORDER_NONE,
    SIM_BTN_PLAIN,
    SIM_BTN_SM,
    SIM_FLEX_CENTER_MOD,
    SIM_FLEX_GROW_1,
    SIM_FLEX_WRAP,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_CENTER,
    SIM_TEXT_SECONDARY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SimulatorAlertTone,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { normalizeBrowserLayout } from '../../utils/navigation/simulatorBrowserEdges.js';
import { getFieldInputType } from '../../utils/payload/browserFieldType.js';
import { joinKeyParts, withStableKeys } from '../../utils/lists/stableKeys.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
/**
 * Renders a single browser page by layout family. Wireframe: landing, login/form, content/download/result.
 * Uses SimulatorBrowserChrome (title above bar, back/forward/refresh/home, address bar).
 */
import type { ReactNode } from 'react';

import SimulatorBrowserChrome from '../../apps/browser/SimulatorBrowserChrome.js';
import type { SimulatorAction, SimulatorBrowserPage } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simSpacing, simTypo } from '../../simulatorStyles.js';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
} from '../../ui/primitives.js';
import {
    renderSimulatorChoice,
    renderSimulatorFeedback,
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

function urlHighlight(url: string): { start: number; end: number }[] | undefined {
    const suspicious = ['phish', 'evil', 'fake'];
    for (const s of suspicious) {
        const i = url.toLowerCase().indexOf(s);
        if (i >= 0) return [{ start: i, end: i + s.length }];
    }
    return undefined;
}

function renderWarningBanner(
    message: string,
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode,
): ReactNode {
    return renderSimulatorFeedback(
        {
            message,
            tone: SimulatorAlertTone.Warning,
            className: joinClasses(SIM_ROUNDED_NONE, SIM_BORDER_NONE, simSpacing.mb3, SIM_TEXT_SM),
        },
        renderFeedback,
    );
}

function renderPageButton(
    label: string,
    onClick: () => void,
    tone: SimulatorButtonTone,
    className: string,
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode,
): ReactNode {
    return renderSimulatorChoice(
        {
            label,
            tone,
            className,
            onClick,
        },
        renderChoice,
    );
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
    const loginCardClass = joinClasses(
        simBorder.tile,
        SIM_ROUNDED_NONE,
        SIM_SURFACE_WHITE,
        simSpacing.p3,
        'simulator-shadow--sm',
    );
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
                        <div
                            className={joinClasses(
                                simSpacing.mb3,
                                simBorder.tile,
                                SIM_ROUNDED_NONE,
                                'simulator-surface--dark-muted',
                                simLayout.row,
                                SIM_FLEX_CENTER_MOD,
                            )}
                            style={{ minHeight: 160 }}
                        >
                            <span
                                className={SIM_TEXT_SECONDARY}
                                style={{ fontSize: '2.5rem' }}
                                aria-hidden
                            >
                                ▶
                            </span>
                        </div>
                    )}
                    {layoutNorm === BrowserLayout.Content && showMediaPlaceholder === true && (
                        <div
                            className={joinClasses(
                                simLayout.row,
                                simSpacing.gap2,
                                simSpacing.mb3,
                                SIM_TEXT_SM,
                                SIM_MUTED,
                            )}
                        >
                            <span aria-hidden>⏮</span>
                            <div
                                className={joinClasses(
                                    SIM_FLEX_GROW_1,
                                    'simulator-surface--secondary-muted',
                                    SIM_ROUNDED_NONE,
                                )}
                                style={{ height: 6 }}
                            />
                            <span aria-hidden>🔊</span>
                            <span aria-hidden>⛶</span>
                        </div>
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
                <div
                    className={joinClasses(
                        simLayout.row,
                        SIM_FLEX_CENTER_MOD,
                        'simulator-flex--align-start',
                    )}
                >
                    <div className={loginCardClass} style={{ maxWidth: 320 }}>
                        <div className={joinClasses(simLayout.rowBetween, simSpacing.mb3)}>
                            <span
                                className={joinClasses(
                                    SIM_TEXT_SM,
                                    SIM_TEXT_SEMIBOLD,
                                    SIM_TEXT_BODY,
                                )}
                            >
                                {displayTitle}
                                {screenLocale.t('screen.browserPageRenderer.login')}
                            </span>
                            {onBack != null && (
                                <SimulatorButton
                                    tone={SimulatorButtonTone.Link}
                                    className={joinClasses(
                                        SIM_BTN_SM,
                                        SIM_BTN_PLAIN,
                                        SIM_TEXT_BODY,
                                    )}
                                    onClick={onBack}
                                    aria-label={screenLocale.t('screen.browserPageRenderer.close')}
                                >
                                    ×
                                </SimulatorButton>
                            )}
                        </div>
                        {content != null && content !== '' && (
                            <p className={joinClasses(simSpacing.mb2, SIM_TEXT_SM, SIM_MUTED)}>
                                {content}
                            </p>
                        )}
                        {formFields != null && formFields.length > 0 && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onAction(SimulatorActions.submitForm({}));
                                }}
                            >
                                {formFieldInputs}
                                <div className={joinClasses(simLayout.actionsRow, simSpacing.mt3)}>
                                    <SimulatorButton
                                        type="submit"
                                        tone={SimulatorButtonTone.Primary}
                                        className={joinClasses(SIM_ROUNDED_NONE, SIM_FLEX_GROW_1)}
                                    >
                                        {screenLocale.t('screen.browserPageRenderer.submit')}
                                    </SimulatorButton>
                                    {onBack != null &&
                                        renderPageButton(
                                            'Cancel',
                                            onBack,
                                            SimulatorButtonTone.Neutral,
                                            joinClasses(SIM_ROUNDED_NONE, SIM_FLEX_GROW_1),
                                            renderChoice,
                                        )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
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
                        <div
                            className={joinClasses(
                                simSpacing.mb3,
                                simBorder.tile,
                                SIM_ROUNDED_NONE,
                                'simulator-surface--dark-muted',
                                simLayout.row,
                                SIM_FLEX_CENTER_MOD,
                            )}
                            style={{ minHeight: 140 }}
                        >
                            <span
                                className={SIM_TEXT_SECONDARY}
                                style={{ fontSize: '2rem' }}
                                aria-hidden
                            >
                                ▶
                            </span>
                        </div>
                    )}
                    {contentParagraph}
                    {keyedButtons.length > 0 ? (
                        <div className={joinClasses(simLayout.actionsRow, SIM_FLEX_WRAP)}>
                            {keyedButtons.map(({ item: btn, key }) => (
                                <span key={key}>
                                    {renderPageButton(
                                        btn.label,
                                        () =>
                                            onAction(
                                                SimulatorActions.downloadClick(
                                                    btn.href ?? btn.label,
                                                ),
                                            ),
                                        SimulatorButtonTone.NeutralOutline,
                                        pageBtnClass,
                                        renderChoice,
                                    )}
                                </span>
                            ))}
                        </div>
                    ) : (
                        renderPageButton(
                            'Download',
                            () => onAction(SimulatorActions.downloadClick(page.id)),
                            SimulatorButtonTone.NeutralOutline,
                            pageBtnClass,
                            renderChoice,
                        )
                    )}
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
