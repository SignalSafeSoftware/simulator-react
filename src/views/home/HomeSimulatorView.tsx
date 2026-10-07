/** Scenario Home shares device Home presentation while retaining scenario actions and widgets. */
import { SimulatorHomeScreenId } from '@signalsafe/simulator-core/devicePayload';
import {
    SIM_FLEX_WRAP,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_CENTER,
    SIM_TEXT_SM,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { HomeScreenId, SimulatorAction, SimulatorHomePayload } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simSpacing } from '../../simulatorStyles.js';
import type { SimulatorCapabilities } from '../../utils/payload/simulatorCapabilities.js';
import DeviceHome from '../../apps/home/DeviceHome.js';
import SimulatorScreenTile from '../shared/SimulatorScreenTile.js';
import { Store } from 'lucide-react';
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

/** Scenario-only Store and widgets extend the common Home layout. */
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
    const navigate = (screen: HomeScreenId, action: SimulatorAction) => {
        onAction(action);
        onNavigate(screen);
    };
    return (
        <DeviceHome
            onOpenSettings={
                hasSettings
                    ? () =>
                          navigate(SimulatorHomeScreenId.Settings, SimulatorActions.openSettings())
                    : undefined
            }
            additionalTiles={
                hasStore ? (
                    <SimulatorScreenTile
                        label={screenLocale.t('screen.homeSimulatorView.store')}
                        icon={<Store aria-hidden='true' />}
                        onClick={() =>
                            navigate(SimulatorHomeScreenId.Store, SimulatorActions.openStore())
                        }
                    />
                ) : undefined
            }
        >
            {widgets.length > 0 && (
                <div className={SIM_PAGE_CONTENT}>
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
                </div>
            )}
        </DeviceHome>
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
