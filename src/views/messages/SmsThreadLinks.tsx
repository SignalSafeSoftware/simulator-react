import type { ReactNode } from 'react';
import type { SimulatorAction, SimulatorSmsPayload } from '../../types/session.js';
import {
    SIM_BORDER_TOP,
    SIM_BTN_PLAIN,
    SIM_ROUNDED_NONE,
    SIM_TEXT_DARK,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simSpacing } from '../../simulatorStyles.js';
import { renderSimulatorChoice, type SimulatorChoiceRenderProps } from '../../ui/renderSlots.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

type SmsLink = NonNullable<NonNullable<SimulatorSmsPayload['thread']>['links']>[number];

export function SmsThreadLinks({
    links = [],
    onAction,
    renderChoice,
}: Readonly<{
    links?: SmsLink[];
    onAction: (action: SimulatorAction) => void;
    renderChoice?: (choice: SimulatorChoiceRenderProps) => ReactNode;
}>) {
    const screenLocale = useSimulatorLocale();
    const renderLinkChoice = (link: SmsLink, idx: number, className: string) =>
        renderSimulatorChoice(
            {
                label: link.text || link.href,
                tone: SimulatorButtonTone.Link,
                className,
                onClick: () =>
                    onAction(SimulatorActions.clickLink({ linkIndex: idx, href: link.href })),
                'aria-label': screenLocale.t('screen.smsSimulatorView.link', {
                    text: link.text || link.href || '',
                }),
            },
            renderChoice,
        );
    if (links.length === 0) return null;
    return (
        <div
            className={joinClasses(
                simSpacing.mt3,
                simSpacing.pt3,
                SIM_BORDER_TOP,
                simLayout.actionsRow,
                simSpacing.sectionGap,
            )}
        >
            {links.map((link, idx) =>
                link.title != null && link.title !== '' ? (
                    <div
                        key={`link-${idx}-${link.href ?? ''}-${link.title}`}
                        className={joinClasses(
                            simBorder.block,
                            simSpacing.blockPaddingCompact,
                            SIM_TEXT_SM,
                        )}
                        style={{ maxWidth: 280 }}
                    >
                        <span
                            className={joinClasses(
                                SIM_TEXT_MEDIUM,
                                'simulator-text--block',
                                SIM_TEXT_DARK,
                                simSpacing.mb1,
                            )}
                        >
                            {link.title}
                        </span>
                        {renderLinkChoice(
                            link,
                            idx,
                            joinClasses(
                                SIM_BTN_PLAIN,
                                SIM_TEXT_SM,
                                'simulator-text--align-baseline',
                            ),
                        )}
                    </div>
                ) : (
                    <span key={`link-btn-${idx}-${link.href ?? ''}`}>
                        {renderLinkChoice(
                            link,
                            idx,
                            joinClasses(
                                SIM_BTN_PLAIN,
                                'simulator-text--align-baseline',
                                SIM_ROUNDED_NONE,
                            ),
                        )}
                    </span>
                ),
            )}
        </div>
    );
}
