import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
/**
 * Reusable structure for simulator detail-style screens: back bar and content block.
 */
import type { ReactNode } from 'react';

import { SimulatorButton } from '../ui/primitives.js';
import { simBackBar, simBorder, simSpacing } from '../simulatorStyles.js';
import { SIM_BTN_SCREEN_BACK } from '../ui/simulatorClasses.js';

export interface SimulatorDetailBackBarProps {
    onBack: () => void;
    title?: string;
    ariaLabel?: string;
    titleOnly?: boolean;
    className?: string;
}

export function SimulatorDetailBackBar({
    onBack,
    title,
    ariaLabel,
    titleOnly = false,
    className,
}: Readonly<SimulatorDetailBackBarProps>) {
    const screenLocale = useSimulatorLocale();

    return (
        <div
            className={`${titleOnly ? 'simulator-screen__header' : simBackBar.container} ${className ?? ''}`.trim()}
        >
            {!titleOnly && (
                <SimulatorButton
                    tone="link"
                    className={`simulator-btn--plain ${SIM_BTN_SCREEN_BACK}`.trim()}
                    onClick={onBack}
                    aria-label={ariaLabel ?? screenLocale.t('screen.simulatorDetail.back')}
                >
                    {screenLocale.t('screen.simulatorDetail.back')}
                </SimulatorButton>
            )}
            {title != null && title !== '' && <span className={simBackBar.title}>{title}</span>}
        </div>
    );
}

export interface SimulatorDetailBlockProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'compact';
}

export function SimulatorDetailBlock({
    children,
    className = '',
    variant = 'default',
}: Readonly<SimulatorDetailBlockProps>) {
    const padding =
        variant === 'compact' ? simSpacing.blockPaddingCompact : simSpacing.blockPadding;
    return <div className={`${simBorder.block} ${padding} ${className}`.trim()}>{children}</div>;
}
