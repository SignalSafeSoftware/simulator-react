/**
 * Reusable list shell for simulator list-style UIs.
 */
import { type LiHTMLAttributes, type ReactNode } from 'react';

import { SimulatorList as SimList, SimulatorListItem as SimListItem } from '../primitives.js';
import { simBorder, simListRow } from '../../simulatorStyles.js';

export interface SimulatorListProps {
    children: ReactNode;
    className?: string;
}

export function SimulatorList({ children, className = '' }: Readonly<SimulatorListProps>) {
    return <SimList className={`${simBorder.list} ${className}`.trim()}>{children}</SimList>;
}

export interface SimulatorListItemProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
    children: ReactNode;
    onClick?: () => void;
    active?: boolean;
    variant?: 'default' | 'compact';
    className?: string;
}

export function SimulatorListItem({
    children,
    onClick,
    active = false,
    variant = 'default',
    className = '',
    ...attributes
}: Readonly<SimulatorListItemProps>) {
    const paddingClass = variant === 'compact' ? simListRow.compact : simListRow.default;
    return (
        <SimListItem
            {...attributes}
            action={onClick != null}
            active={active}
            onClick={onClick}
            className={`${simListRow.base} ${paddingClass} ${className}`.trim()}
        >
            {children}
        </SimListItem>
    );
}
