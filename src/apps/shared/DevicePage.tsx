import {
    SIM_APP_PAGE_CONTENT,
    SIM_APP_LIST_PAGE_CONTENT,
    SIM_SCREEN_HEADER,
} from '../../ui/styles/semanticSimulatorClasses.js';
import { type ReactNode } from 'react';
import { SimulatorPage } from '../../ui/layout/SimulatorPage.js';
import { AppSecondaryNav } from './AppSecondaryNav.js';
import { useSimulatorAppsHost } from './SimulatorAppsHost.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';

export function DevicePage({
    title,
    icon = '📧',
    onBack,
    children,
    navigation,
    listLayout = false,
}: Readonly<{
    title: string;
    icon?: string;
    onBack?: () => void;
    children: ReactNode;
    navigation?: ReactNode;
    listLayout?: boolean;
}>) {
    const { Shell: SimulatorPhoneShell } = useSimulatorAppsHost();
    const { t } = useSimulatorLocale();
    const content = (
        <SimulatorPage
            className="simulator-app-page"
            header={<h2 className={SIM_SCREEN_HEADER}>{title}</h2>}
        >
            <div className={listLayout ? SIM_APP_LIST_PAGE_CONTENT : SIM_APP_PAGE_CONTENT}>
                {children}
            </div>
        </SimulatorPage>
    );
    if (!onBack) return content;
    return (
        <SimulatorPhoneShell
            nav={
                navigation ?? (
                    <AppSecondaryNav
                        actions={[
                            { label: title, icon, active: true, onClick: () => {} },
                            { label: t('app.back'), icon: '↩', onClick: onBack },
                        ]}
                    />
                )
            }
        >
            {content}
        </SimulatorPhoneShell>
    );
}
