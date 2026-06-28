/**
 * Reusable list shell for simulator list-style UIs.
 */
import type { ReactNode } from 'react';

import { SimulatorList as SimList, SimulatorListItem as SimListItem } from '../ui/primitives.js';
import { simBorder, simListRow } from '../simulatorStyles.js';

const LIST_CLASS = simBorder.list;
const LIST_ITEM_BASE = simListRow.base;
const LIST_ITEM_DEFAULT = simListRow.default;
const LIST_ITEM_COMPACT = simListRow.compact;

export interface SimulatorListProps {
    children: ReactNode;
    className?: string;
}

export function SimulatorList({ children, className = '' }: Readonly<SimulatorListProps>) {
    return <SimList className={`${LIST_CLASS} ${className}`.trim()}>{children}</SimList>;
}

export interface SimulatorListItemProps {
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
}: Readonly<SimulatorListItemProps>) {
    const paddingClass = variant === 'compact' ? LIST_ITEM_COMPACT : LIST_ITEM_DEFAULT;
    return (
        <SimListItem
            action={onClick != null}
            active={active}
            onClick={onClick}
            className={`${LIST_ITEM_BASE} ${paddingClass} ${className}`.trim()}
        >
            {children}
        </SimListItem>
    );
}

export function SimulatorListUnreadDot() {
    return (
        <span
            className="simulator-dot simulator-dot--primary"
            style={{ width: 8, height: 8 }}
            aria-hidden
        />
    );
}

export { LIST_CLASS, LIST_ITEM_BASE, LIST_ITEM_DEFAULT, LIST_ITEM_COMPACT };
