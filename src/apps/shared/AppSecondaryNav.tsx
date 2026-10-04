import { SimulatorAppNavItem } from '../../ui/navigation/SimulatorAppNavItem.js';

export interface AppNavAction {
    label: string;
    icon: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    form?: string;
    disabled?: boolean;
    active?: boolean;
}

export function AppSecondaryNav({ actions }: Readonly<{ actions: readonly AppNavAction[] }>) {
    return (
        <nav
            className="simulator-device-nav"
            aria-label="App secondary menu"
            data-nav-mode="secondary"
        >
            <ul className="simulator-device-nav__list">
                {actions.map((action) => (
                    <li key={action.label} className="simulator-device-nav__item">
                        <SimulatorAppNavItem {...action} />
                    </li>
                ))}
            </ul>
        </nav>
    );
}
