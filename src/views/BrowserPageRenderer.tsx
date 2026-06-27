/**
 * Renders a single browser page by layout family. Wireframe: landing, login/form, content/download/result.
 * Uses SimulatorBrowserChrome (title above bar, back/forward/refresh/home, address bar).
 */
import type { ReactNode } from 'react';

import SimulatorBrowserChrome from '../components/SimulatorBrowserChrome';
import type { SimulatorAction, SimulatorBrowserPage } from '../types/session';
import { SimulatorActions } from '../actions';
import { simBorder, simLayout, simSpacing, simTypo } from '../simulatorStyles';
import {
    SimulatorButton,
    SimulatorField,
    SimulatorInput,
    SimulatorLabel,
} from '../ui/primitives';
import {
    joinClasses,
    SIM_FLEX_GROW_1,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses';
import {
    renderSimulatorChoice,
    renderSimulatorFeedback,
    type SimulatorChoiceRenderProps,
    type SimulatorFeedbackRenderProps,
} from '../ui/renderSlots';

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

function getFieldInputType(fieldType: string | undefined): 'text' | 'password' | 'email' {
    if (fieldType === 'password') {
        return 'password';
    }
    if (fieldType === 'email') {
        return 'email';
    }
    return 'text';
}

function getStableKey(
    parts: Array<string | null | undefined>
): string {
    return parts.map((part) => part ?? '').join('|');
}

function withStableKeys<T>(
    items: T[],
    getBaseKey: (item: T) => string
): Array<{ key: string; item: T; index: number }> {
    const counts = new Map<string, number>();
    return items.map((item, index) => {
        const base = getBaseKey(item);
        const nextCount = (counts.get(base) ?? 0) + 1;
        counts.set(base, nextCount);
        return { key: `${base}-${nextCount}`, item, index };
    });
}

function normalizeBrowserLayout(layout: string | undefined): string {
    const layoutNorm = (layout ?? 'content').toLowerCase();
    // Master templates use page_layout "centered" / "split" for login gates; renderer uses "login".
    if (layoutNorm === 'centered' || layoutNorm === 'split') {
        return 'login';
    }
    return layoutNorm;
}

function renderWarningBanner(
    message: string,
    renderFeedback?: (feedback: SimulatorFeedbackRenderProps) => ReactNode,
): ReactNode {
    return renderSimulatorFeedback(
        {
            message,
            tone: 'warning',
            className: joinClasses(SIM_ROUNDED_NONE, 'simulator-border--none', simSpacing.mb3, SIM_TEXT_SM),
        },
        renderFeedback,
    );
}

function renderPageButton(
    label: string,
    onClick: () => void,
    tone: string,
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
    const { url, title, layout, content, buttons, formFields, logoUrl, warningBanner, showMediaPlaceholder } = page;
    const layoutNorm = normalizeBrowserLayout(layout);
    const displayTitle = title || 'Web Page Title';
    const downloadButtons = buttons ?? [];
    const pageBtnClass = joinClasses(SIM_ROUNDED_NONE, 'simulator-btn--sm');
    const loginCardClass = joinClasses(simBorder.tile, SIM_ROUNDED_NONE, SIM_SURFACE_WHITE, simSpacing.p3, 'simulator-shadow--sm');
    const keyedFormFields = withStableKeys(
        formFields ?? [],
        (field) => getStableKey([field.name, field.label, field.type])
    );
    const keyedButtons = withStableKeys(
        buttons ?? [],
        (button) => getStableKey([button.label, button.href, button.targetPageId])
    );
    const keyedDownloadButtons = withStableKeys(
        downloadButtons,
        (button) => getStableKey([button.label, button.href, button.targetPageId])
    );

    return (
        <SimulatorBrowserChrome
            title={displayTitle}
            url={url || displayTitle}
            urlHighlightSegments={urlHighlight(url)}
            onBack={onBack}
        >
            {/* Landing / generic page: optional logo, content area, buttons */}
            {(layoutNorm === 'landing' || layoutNorm === 'content') && (
                <>
                    {logoUrl != null && logoUrl !== '' && (
                        <div className={joinClasses(simSpacing.mb3, 'simulator-text--center')}>
                            <img src={logoUrl} alt="" style={{ maxHeight: 48 }} />
                        </div>
                    )}
                    {layoutNorm === 'content' && warningBanner != null && warningBanner !== '' && (
                        renderWarningBanner(warningBanner, renderFeedback)
                    )}
                    {layoutNorm === 'content' && showMediaPlaceholder === true && (
                        <div
                            className={joinClasses(
                                simSpacing.mb3,
                                simBorder.tile,
                                SIM_ROUNDED_NONE,
                                'simulator-surface--dark-muted',
                                simLayout.row,
                                'simulator-flex--center',
                            )}
                            style={{ minHeight: 160 }}
                        >
                            <span className="simulator-text--secondary" style={{ fontSize: '2.5rem' }} aria-hidden>▶</span>
                        </div>
                    )}
                    {layoutNorm === 'content' && showMediaPlaceholder === true && (
                        <div className={joinClasses(simLayout.row, simSpacing.gap2, simSpacing.mb3, SIM_TEXT_SM, SIM_MUTED)}>
                            <span aria-hidden>⏮</span>
                            <div className={joinClasses(SIM_FLEX_GROW_1, 'simulator-surface--secondary-muted', SIM_ROUNDED_NONE)} style={{ height: 6 }} />
                            <span aria-hidden>🔊</span>
                            <span aria-hidden>⛶</span>
                        </div>
                    )}
                    {content != null && content !== '' && (
                        <p className={joinClasses(simSpacing.mb3, SIM_TEXT_SM, 'simulator-text--secondary')} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {layoutNorm === 'landing' && formFields != null && formFields.length > 0 && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onAction(SimulatorActions.submitForm({}));
                            }}
                        >
                            {keyedFormFields.map(({ item: field, key }) => (
                                <SimulatorField key={key} className={simSpacing.mb2}>
                                    <SimulatorLabel className={simLayout.fieldLabel}>{field.label}</SimulatorLabel>
                                    <SimulatorInput
                                        type={getFieldInputType(field.type)}
                                        className={SIM_ROUNDED_NONE}
                                        autoComplete="off"
                                        aria-label={field.label}
                                    />
                                </SimulatorField>
                            ))}
                            <SimulatorButton type="submit" tone="primary" className={SIM_ROUNDED_NONE}>
                                Submit
                            </SimulatorButton>
                        </form>
                    )}
                    {buttons != null && buttons.length > 0 && (
                        <div className={joinClasses(simLayout.actionsRow, simSpacing.mt2)}>
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
                                                })
                                            ),
                                        'primary',
                                        pageBtnClass,
                                        renderChoice,
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Login / form page: centered modal-like form, Submit (blue), Cancel (gray) */}
            {layoutNorm === 'login' && (
                <div className={joinClasses(simLayout.row, 'simulator-flex--center', 'simulator-flex--align-start')}>
                    <div className={loginCardClass} style={{ maxWidth: 320 }}>
                        <div className={joinClasses(simLayout.rowBetween, simSpacing.mb3)}>
                            <span className={joinClasses(SIM_TEXT_SM, SIM_TEXT_SEMIBOLD, SIM_TEXT_BODY)}>
                                {displayTitle} Login
                            </span>
                            {onBack != null && (
                                <SimulatorButton
                                    tone="link"
                                    className={joinClasses('simulator-btn--sm', 'simulator-btn--plain', SIM_TEXT_BODY)}
                                    onClick={onBack}
                                    aria-label="Close"
                                >
                                    ×
                                </SimulatorButton>
                            )}
                        </div>
                        {content != null && content !== '' && (
                            <p className={joinClasses(simSpacing.mb2, SIM_TEXT_SM, SIM_MUTED)}>{content}</p>
                        )}
                        {formFields != null && formFields.length > 0 && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    onAction(SimulatorActions.submitForm({}));
                                }}
                            >
                                {keyedFormFields.map(({ item: field, key }) => (
                                    <SimulatorField key={key} className={simSpacing.mb2}>
                                        <SimulatorLabel className={simLayout.fieldLabel}>{field.label}</SimulatorLabel>
                                        <SimulatorInput
                                            type={getFieldInputType(field.type)}
                                            className={SIM_ROUNDED_NONE}
                                            autoComplete="off"
                                            aria-label={field.label}
                                        />
                                    </SimulatorField>
                                ))}
                                <div className={joinClasses(simLayout.actionsRow, simSpacing.mt3)}>
                                    <SimulatorButton type="submit" tone="primary" className={joinClasses(SIM_ROUNDED_NONE, SIM_FLEX_GROW_1)}>
                                        Submit
                                    </SimulatorButton>
                                    {onBack != null && (
                                        renderPageButton(
                                            'Cancel',
                                            onBack,
                                            'secondary',
                                            joinClasses(SIM_ROUNDED_NONE, SIM_FLEX_GROW_1),
                                            renderChoice,
                                        )
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Result page: post-submit message */}
            {layoutNorm === 'result' && (
                <p className={simTypo.emptyState}>
                    {content ?? 'Simulation complete. You submitted credentials on a simulated page.'}
                </p>
            )}

            {/* Download page: optional warning, media placeholder, content, download buttons */}
            {layoutNorm === 'download' && (
                <>
                    {warningBanner != null && warningBanner !== '' && (
                        renderWarningBanner(warningBanner, renderFeedback)
                    )}
                    {showMediaPlaceholder === true && (
                        <div
                            className={joinClasses(
                                simSpacing.mb3,
                                simBorder.tile,
                                SIM_ROUNDED_NONE,
                                'simulator-surface--dark-muted',
                                simLayout.row,
                                'simulator-flex--center',
                            )}
                            style={{ minHeight: 140 }}
                        >
                            <span className="simulator-text--secondary" style={{ fontSize: '2rem' }} aria-hidden>▶</span>
                        </div>
                    )}
                    {content != null && content !== '' && (
                        <p className={joinClasses(simSpacing.mb3, SIM_TEXT_SM, 'simulator-text--secondary')} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {downloadButtons.length > 0 ? (
                        <div className={joinClasses(simLayout.actionsRow, 'simulator-flex--wrap')}>
                            {keyedDownloadButtons.map(({ item: btn, key }) => (
                                <span key={key}>
                                    {renderPageButton(
                                        btn.label,
                                        () => onAction(SimulatorActions.downloadClick(btn.href ?? btn.label)),
                                        'outline-secondary',
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
                            'outline-secondary',
                            pageBtnClass,
                            renderChoice,
                        )
                    )}
                </>
            )}

            {/* Fallback for unknown layout: render content + buttons */}
            {layoutNorm !== 'landing' && layoutNorm !== 'content' && layoutNorm !== 'login' && layoutNorm !== 'result' && layoutNorm !== 'download' && (
                <>
                    {warningBanner != null && warningBanner !== '' && (
                        renderWarningBanner(warningBanner, renderFeedback)
                    )}
                    {content != null && content !== '' && (
                        <p className={joinClasses(simSpacing.mb3, SIM_TEXT_SM, 'simulator-text--secondary')} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                            {content}
                        </p>
                    )}
                    {buttons != null && buttons.length > 0 && (
                        <div className={joinClasses(simLayout.actionsRow, 'simulator-flex--wrap')}>
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
                                                })
                                            ),
                                        'primary',
                                        pageBtnClass,
                                        renderChoice,
                                    )}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </SimulatorBrowserChrome>
    );
}
