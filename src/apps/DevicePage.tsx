import type { ReactNode } from 'react';
import { SimulatorPage } from '../components/SimulatorPage.js';
import { SimulatorAppNavItem as SimulatorPhoneNavItem } from './SimulatorAppNavItem.js';
import { useSimulatorAppsHost } from './host.js';

export function DevicePage({
    title,
    onBack,
    children,
    navigation,
    listLayout = false,
}: {
    title: string;
    onBack?: () => void;
    children: ReactNode;
    navigation?: ReactNode;
    listLayout?: boolean;
}) {
    const { Shell: SimulatorPhoneShell } = useSimulatorAppsHost();
    const content = (
        <SimulatorPage
            className="screen-content prototype-screen"
            header={<h2 className="simulator-screen__header">{title}</h2>}
        >
            <div className={listLayout ? 'prototype-mail-page' : 'prototype-page'}>{children}</div>
        </SimulatorPage>
    );
    if (!onBack) return content;
    const icon = title === 'Vault' ? '🔐' : title === 'Photos' ? '🖼' : '📧';
    return (
        <SimulatorPhoneShell
            nav={
                navigation ?? (
                    <nav
                        className="simulator-device-nav"
                        aria-label="App secondary menu"
                        data-nav-mode="secondary"
                    >
                        <ul className="simulator-device-nav__list">
                            <li className="simulator-device-nav__item">
                                <SimulatorPhoneNavItem
                                    label={title}
                                    icon={icon}
                                    active
                                    onClick={() => {}}
                                />
                            </li>
                            <li className="simulator-device-nav__item">
                                <SimulatorPhoneNavItem label="Back" icon="↩" onClick={onBack} />
                            </li>
                        </ul>
                    </nav>
                )
            }
        >
            {content}
        </SimulatorPhoneShell>
    );
}
