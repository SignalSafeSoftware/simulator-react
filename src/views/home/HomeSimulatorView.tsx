/**
 * Home app: dashboard (Store/Settings launcher), Store (app cards), Settings (sections + inputs).
 * Wireframe: centered headers, search bar, rectangular buttons/cards. Store and Settings are subviews; Back returns to Home.
 */
import { SimulatorHomeScreenId } from '@signalsafe/simulator-core/devicePayload';
import {
    SIM_FLEX_GROW_1,
    SIM_FLEX_WRAP,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { HomeScreenId, SimulatorAction, SimulatorHomePayload } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import type { SimulatorCapabilities } from '../../utils/payload/simulatorCapabilities.js';
import { SimulatorButton } from '../../ui/primitives.js';
import { SIM_PAGE_CONTENT } from '../../ui/styles/semanticSimulatorClasses.js';
import { HomeStoreScreen } from './HomeStoreScreen.js';
import { HomeSettingsScreen } from './HomeSettingsScreen.js';

export interface HomeSimulatorViewProps {
    payload: SimulatorHomePayload | null;
    homeCapabilities: SimulatorCapabilities['home'];
    screen: HomeScreenId;
    onNavigate: (screen: HomeScreenId) => void;
    onAction: (action: SimulatorAction) => void;
    onBack: () => void;
}

const dashboardTileClass = joinClasses(
    simBorder.tile,
    SIM_ROUNDED_NONE,
    simSpacing.p2,
    SIM_TEXT_SM,
    SIM_TEXT_CENTER,
    SIM_SURFACE_WHITE,
);

const dashboardNavBtnClass = joinClasses(
    simBorder.tile,
    SIM_ROUNDED_NONE,
    SIM_FLEX_GROW_1,
    simSpacing.py3,
    SIM_TEXT_MEDIUM,
);

/** Home dashboard: Store and Settings as rectangular buttons followed by supplied widgets. */
function HomeDashboard({
    widgets,
    hasStore,
    hasSettings,
    onNavigate,
    onAction,
}: Readonly<{
    widgets: SimulatorHomePayload['widgets'];
    hasStore: boolean;
    hasSettings: boolean;
    onNavigate: (screen: HomeScreenId) => void;
    onAction: (action: SimulatorAction) => void;
}>) {
    const screenLocale = useSimulatorLocale();
    const launchers = [
        hasStore && {
            screen: SimulatorHomeScreenId.Store,
            label: screenLocale.t('screen.homeSimulatorView.store'),
            action: SimulatorActions.openStore(),
        },
        hasSettings && {
            screen: SimulatorHomeScreenId.Settings,
            label: screenLocale.t('screen.homeSimulatorView.settings'),
            action: SimulatorActions.openSettings(),
        },
    ].filter((launcher) => launcher !== false);

    return (
        <div className={simLayout.stack}>
            <h2 className={simScreen.header}>{screenLocale.t('nav.home')}</h2>
            <div className={SIM_PAGE_CONTENT}>
                {launchers.length > 0 && (
                    <div className={joinClasses(simLayout.actionsRow, simSpacing.mb3)}>
                        {launchers.map(({ screen, label, action }) => (
                            <SimulatorButton
                                key={screen}
                                tone={SimulatorButtonTone.Light}
                                className={dashboardNavBtnClass}
                                onClick={() => {
                                    onAction(action);
                                    onNavigate(screen);
                                }}
                                aria-label={label}
                            >
                                {label}
                            </SimulatorButton>
                        ))}
                    </div>
                )}
                {widgets.length > 0 && (
                    <div className={joinClasses(simLayout.actionsRow, SIM_FLEX_WRAP)}>
                        {widgets.map((w) => (
                            <div
                                key={w.id}
                                className={dashboardTileClass}
                                style={{ minWidth: 80, minHeight: 64 }}
                            >
                                {w.label}
                            </div>
                        ))}
                    </div>
                )}
                {widgets.length === 0 && launchers.length === 0 && (
                    <p className={simTypo.emptyState}>
                        {screenLocale.t('screen.homeSimulatorView.no.content.on.home')}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function HomeSimulatorView({
    payload,
    homeCapabilities,
    screen,
    onNavigate,
    onAction,
    onBack,
}: Readonly<HomeSimulatorViewProps>) {
    const widgets = payload?.widgets ?? [];
    const featuredApps = payload?.featuredApps ?? [];
    const settingsSections = payload?.settingsSections ?? [];

    if (screen === SimulatorHomeScreenId.Store) {
        return <HomeStoreScreen featuredApps={featuredApps} onAction={onAction} />;
    }
    if (screen === SimulatorHomeScreenId.Settings) {
        return <HomeSettingsScreen settingsSections={settingsSections} onBack={onBack} />;
    }

    return (
        <HomeDashboard
            widgets={widgets}
            hasStore={homeCapabilities.store}
            hasSettings={homeCapabilities.settings}
            onNavigate={onNavigate}
            onAction={onAction}
        />
    );
}
