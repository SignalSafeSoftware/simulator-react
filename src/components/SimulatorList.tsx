/**
 * Reusable list shell for simulator list-style UIs. Wireframe: rectangular container and rows,
 * flat borders (simBorder.list, simListRow). Content remains app-specific.
 */
import type { ReactNode } from 'react';
import { ListGroup } from 'react-bootstrap';
import { simBorder, simListRow } from '../simulatorStyles';

const LIST_CLASS = simBorder.list;
const LIST_ITEM_BASE = simListRow.base;
const LIST_ITEM_DEFAULT = simListRow.default;
const LIST_ITEM_COMPACT = simListRow.compact;

export interface SimulatorListProps {
    children: ReactNode;
    /** Optional extra container class (e.g. omit shadow in modal). */
    className?: string;
}

/** Consistent list container for simulator lists. */
export function SimulatorList({ children, className = '' }: Readonly<SimulatorListProps>) {
    return (
        <ListGroup as="ul" className={`${LIST_CLASS} ${className}`.trim()}>
            {children}
        </ListGroup>
    );
}

export interface SimulatorListItemProps {
    children: ReactNode;
    /** When set, row is clickable and uses action styling. */
    onClick?: () => void;
    /** When true, row shows active state (e.g. selected email). */
    active?: boolean;
    /** 'compact' uses smaller padding and center align (e.g. contacts); default uses standard row padding. */
    variant?: 'default' | 'compact';
    /** Optional extra row class (e.g. flex direction). */
    className?: string;
}

/** Consistent list row: spacing, border, optional action/active. */
export function SimulatorListItem({
    children,
    onClick,
    active = false,
    variant = 'default',
    className = '',
}: Readonly<SimulatorListItemProps>) {
    const isAction = onClick != null;
    const paddingClass = variant === 'compact' ? LIST_ITEM_COMPACT : LIST_ITEM_DEFAULT;
    return (
        <ListGroup.Item
            as="li"
            action={isAction}
            active={active}
            onClick={onClick}
            className={`${LIST_ITEM_BASE} ${paddingClass} ${className}`.trim()}
        >
            {children}
        </ListGroup.Item>
    );
}

/** Small unread/status dot used in email and messages lists. */
export function SimulatorListUnreadDot() {
    return (
        <span
            className="rounded-circle bg-primary flex-shrink-0"
            style={{ width: 8, height: 8 }}
            aria-hidden
        />
    );
}

export { LIST_CLASS, LIST_ITEM_BASE, LIST_ITEM_DEFAULT, LIST_ITEM_COMPACT };
