import { type SimulatorAction, type SimulatorBrowserPage } from '../../types/session.js';
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
    SIM_TEXT_SECONDARY,
    SIM_TEXT_SEMIBOLD,
    SIM_TEXT_SM,
    SimulatorAlertTone,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import type { BrowserPageButton, TextSpan } from '../../types/shapes.js';
import type { KeyedItem } from '../../utils/lists/stableKeys.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { ReactNode } from 'react';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simSpacing } from '../../simulatorStyles.js';
import { SimulatorButton } from '../../ui/primitives.js';
import {
    renderSimulatorChoice,
    renderSimulatorFeedback,
    type SimulatorChoiceRenderProps,
    type SimulatorFeedbackRenderProps,
} from '../../ui/renderSlots.js';

export function urlHighlight(url: string): TextSpan[] | undefined {
    const suspicious = ['phish', 'evil', 'fake'];
    for (const s of suspicious) {
        const i = url.toLowerCase().indexOf(s);
        if (i >= 0) return [{ start: i, end: i + s.length }];
    }
    return undefined;
}

export function renderWarningBanner(
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

export function renderPageButton(
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

/** Dark media placeholder with a play glyph. */
export function MediaPlaceholder({
    minHeight,
    iconSize,
}: Readonly<{ minHeight: number; iconSize: string }>) {
    return (
        <div
            className={joinClasses(
                simSpacing.mb3,
                simBorder.tile,
                SIM_ROUNDED_NONE,
                'simulator-surface--dark-muted',
                simLayout.row,
                SIM_FLEX_CENTER_MOD,
            )}
            style={{ minHeight }}
        >
            <span className={SIM_TEXT_SECONDARY} style={{ fontSize: iconSize }} aria-hidden>
                ▶
            </span>
        </div>
    );
}

/** Static transport controls shown under the media placeholder. */
export function MediaControlsBar() {
    return (
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
    );
}

interface LayoutCommon {
    page: SimulatorBrowserPage;
    onAction: (action: SimulatorAction) => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}

/** Centered modal-like login form with Submit and Cancel. */
export function BrowserLoginLayout({
    displayTitle,
    content,
    formFields,
    formFieldInputs,
    onAction,
    onBack,
    renderChoice,
}: Readonly<{
    displayTitle: string;
    content: string | undefined;
    formFields: SimulatorBrowserPage['formFields'];
    formFieldInputs: ReactNode;
    onAction: (action: SimulatorAction) => void;
    onBack?: () => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}>) {
    const screenLocale = useSimulatorLocale();
    const loginCardClass = joinClasses(
        simBorder.tile,
        SIM_ROUNDED_NONE,
        SIM_SURFACE_WHITE,
        simSpacing.p3,
        'simulator-shadow--sm',
    );
    return (
        <div
            className={joinClasses(
                simLayout.row,
                SIM_FLEX_CENTER_MOD,
                'simulator-flex--align-start',
            )}
        >
            <div className={loginCardClass} style={{ maxWidth: 320 }}>
                <div className={joinClasses(simLayout.rowBetween, simSpacing.mb3)}>
                    <span className={joinClasses(SIM_TEXT_SM, SIM_TEXT_SEMIBOLD, SIM_TEXT_BODY)}>
                        {displayTitle}
                        {screenLocale.t('screen.browserPageRenderer.login')}
                    </span>
                    {onBack != null && (
                        <SimulatorButton
                            tone={SimulatorButtonTone.Link}
                            className={joinClasses(SIM_BTN_SM, SIM_BTN_PLAIN, SIM_TEXT_BODY)}
                            onClick={onBack}
                            aria-label={screenLocale.t('screen.browserPageRenderer.close')}
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
    );
}

/** Download buttons, or a single generic Download button when the page defines none. */
export function BrowserDownloadActions({
    page,
    keyedButtons,
    pageBtnClass,
    onAction,
    renderChoice,
}: Readonly<
    LayoutCommon & {
        keyedButtons: ReadonlyArray<KeyedItem<BrowserPageButton>>;
        pageBtnClass: string;
    }
>) {
    if (keyedButtons.length === 0) {
        return renderPageButton(
            'Download',
            () => onAction(SimulatorActions.downloadClick(page.id)),
            SimulatorButtonTone.NeutralOutline,
            pageBtnClass,
            renderChoice,
        );
    }
    return (
        <div className={joinClasses(simLayout.actionsRow, SIM_FLEX_WRAP)}>
            {keyedButtons.map(({ item: btn, key }) => (
                <span key={key}>
                    {renderPageButton(
                        btn.label,
                        () => onAction(SimulatorActions.downloadClick(btn.href ?? btn.label)),
                        SimulatorButtonTone.NeutralOutline,
                        pageBtnClass,
                        renderChoice,
                    )}
                </span>
            ))}
        </div>
    );
}
