import { HomeWidgets } from './HomeWidgets.js';
/** Scenario Home shares device Home presentation while retaining scenario actions and widgets. */
import { SimulatorHomeScreenId } from '@signalsafe/simulator-core/devicePayload';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import type { HomeScreenId, SimulatorAction, SimulatorHomePayload } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import type { SimulatorCapabilities } from '../../utils/payload/simulatorCapabilities.js';
import DeviceHome from '../../apps/home/DeviceHome.js';
import SimulatorScreenTile from '../shared/SimulatorScreenTile.js';
import { Store } from 'lucide-react';
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
            <HomeWidgets widgets={widgets} />
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
