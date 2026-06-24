/**
 * Reusable structure for simulator detail-style screens: back bar and content block.
 * Keeps header/back and content hierarchy consistent; content remains app-specific.
 */
import type { ReactNode } from 'react';
import { Button } from 'react-bootstrap';
import { simBackBar, simBorder, simSpacing } from '../simulatorStyles';

export interface SimulatorDetailBackBarProps {
    /** Back navigation. When not provided, bar is not rendered (caller can still render it conditionally). */
    onBack: () => void;
    /** Optional label shown next to back (e.g. "Message", "Thread", "Contact"). */
    title?: string;
    /** Accessible label for the back button (default "Back"). */
    ariaLabel?: string;
    /** When true, show only the title (no back button). Use when back is in the shell secondary menu. */
    titleOnly?: boolean;
}

/** Consistent back button + optional title for detail views. */
export function SimulatorDetailBackBar({
    onBack,
    title,
    ariaLabel = 'Back',
    titleOnly = false,
}: Readonly<SimulatorDetailBackBarProps>) {
    return (
        <div className={simBackBar.container}>
            {!titleOnly && (
                <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none"
                    onClick={onBack}
                    aria-label={ariaLabel}
                >
                    ← Back
                </Button>
            )}
            {title != null && title !== '' && (
                <span className={simBackBar.title}>{title}</span>
            )}
        </div>
    );
}

export interface SimulatorDetailBlockProps {
    children: ReactNode;
    /** Optional extra class (e.g. for spacing). */
    className?: string;
    /** 'compact' uses smaller padding (p-2); default uses p-3. */
    variant?: 'default' | 'compact';
}

/** Bordered content block for metadata or body. Wireframe: rectangular. */
export function SimulatorDetailBlock({
    children,
    className = '',
    variant = 'default',
}: Readonly<SimulatorDetailBlockProps>) {
    const padding = variant === 'compact' ? simSpacing.blockPaddingCompact : simSpacing.blockPadding;
    return (
        <div className={`${simBorder.block} ${padding} ${className}`.trim()}>
            {children}
        </div>
    );
}
