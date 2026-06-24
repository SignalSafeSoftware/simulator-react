/**
 * Wireframe-style local app navigation: single rectangular bar, rectangular segments.
 * Use for Phone, Email, Messages. Active = dark, inactive = light.
 */
import { simLocalNav } from '../simulatorStyles';

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

export default function SimulatorLocalNav({
    items,
    activeId,
    onSelect,
    className = '',
    'aria-label': ariaLabel,
}: Readonly<SimulatorLocalNavProps>) {
    if (items.length === 0) return null;
    return (
        <div
            className={`${simLocalNav.container} mb-3 ${className}`.trim()}
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
                        className={`flex-grow-1 py-2 border-0 small ${
                            isLast ? '' : 'border-end border-secondary'
                        } ${isActive ? simLocalNav.active : simLocalNav.inactive}`}
                        style={{ minWidth: 0 }}
                        onClick={() => onSelect(item.id)}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
