/**
 * Wireframe-style local app navigation: single rectangular bar, rectangular segments.
 * Use for Phone, Email, Messages. Active = dark, inactive = light.
 */
import { simLocalNav, simSpacing } from '../../simulatorStyles.js';
import {
    SIM_BORDER_NONE,
    SIM_BORDER_SECONDARY,
    SIM_FLEX_GROW_1,
    SIM_MIN_W_0,
    SIM_TEXT_SM,
    joinClasses,
} from '../styles/simulatorClasses.js';

export interface SimulatorLocalNavItem {
    id: string;
    label: string;
}

export interface SimulatorLocalNavProps {
    items: SimulatorLocalNavItem[];
    activeId: string;
    onSelect: (id: string) => void;
    className?: string;
    'aria-label': string;
}

export function SimulatorLocalNav({
    items,
    activeId,
    onSelect,
    className = '',
    'aria-label': ariaLabel,
}: Readonly<SimulatorLocalNavProps>) {
    if (items.length === 0) return null;
    return (
        <div
            className={joinClasses(simLocalNav.container, simSpacing.mb3, className)}
            role="tablist"
            aria-label={ariaLabel}
        >
            {items.map((item, idx) => {
                const isActive = activeId === item.id;
                const isLast = idx === items.length - 1;
                return (
                    <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={item.label}
                        className={joinClasses(
                            SIM_FLEX_GROW_1,
                            SIM_MIN_W_0,
                            simSpacing.py2,
                            SIM_BORDER_NONE,
                            SIM_TEXT_SM,
                            !isLast && joinClasses('simulator-border--end', SIM_BORDER_SECONDARY),
                            isActive ? simLocalNav.active : simLocalNav.inactive,
                        )}
                        onClick={() => onSelect(item.id)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
