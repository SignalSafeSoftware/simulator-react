/**
 * Home app: dashboard (Store/Settings launcher), Store (app cards), Settings (sections + inputs).
 * Wireframe: centered headers, search bar, rectangular buttons/cards. Store and Settings are subviews; Back returns to Home.
 */
import { useState, type ReactNode } from 'react';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail.js';
import SimulatorSearchInput from '../components/SimulatorSearchInput.js';
import type {
    HomeScreenId,
    SimulatorAction,
    SimulatorHomePayload,
    SimulatorHomeStoreApp,
    SimulatorHomeSettingsSection,
} from '../types/session.js';
import { SimulatorActions } from '../actions/index.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../simulatorStyles.js';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities.js';
import { SimulatorButton, SimulatorField, SimulatorInput, SimulatorLabel } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_CENTER,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';

export interface HomeSimulatorViewProps {
    payload: SimulatorHomePayload | null;
    homeCapabilities: SimulatorCapabilities['home'];
    screen: HomeScreenId;
    onNavigate: (screen: HomeScreenId) => void;
    onAction: (action: SimulatorAction) => void;
    onBack: () => void;
}

function StoreAppIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={joinClasses(
                SIM_AVATAR,
                SIM_SURFACE_AVATAR,
                'simulator-flex simulator-flex--center',
                SIM_FLEX_SHRINK_0,
                className,
            )}
            style={{ width: 48, height: 48 }}
            aria-hidden
        >
            <span className="simulator-text--primary" style={{ fontSize: '1.5rem' }}>👤</span>
        </div>
    );
}

const storeCardClass = joinClasses(
    simBorder.tile,
    SIM_ROUNDED_NONE,
    simSpacing.p3,
    SIM_SURFACE_WHITE,
    simLayout.row,
    'simulator-flex--align-start',
    simSpacing.gap2,
);

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

/** Store subview: header, search, app cards (icon, name, Download). Back returns to Home. */
function HomeStoreScreen({
    featuredApps,
    onBack: _onBack,
    onAction,
}: Readonly<{
    featuredApps: SimulatorHomeStoreApp[];
    onBack: () => void;
    onAction: (action: SimulatorAction) => void;
}>) {
    const [search, setSearch] = useState('');
    const filtered = search.trim()
        ? featuredApps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase().trim()))
        : featuredApps;
    let storeContent: ReactNode;
    if (featuredApps.length === 0) {
        storeContent = <p className={simTypo.emptyState}>No apps.</p>;
    } else if (filtered.length === 0) {
        storeContent = <p className={simTypo.emptyState}>No results.</p>;
    } else {
        storeContent = (
            <div className={simLayout.stack}>
                {filtered.map((app) => (
                    <div key={app.id} className={storeCardClass}>
                        <StoreAppIcon />
                        <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                            <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_BODY)}>{app.name}</span>
                            <div className={joinClasses(simLayout.rowBetween, simSpacing.mt2)}>
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>App</span>
                                <SimulatorButton
                                    tone="primary"
                                    className={joinClasses('simulator-btn--sm', SIM_ROUNDED_NONE)}
                                    onClick={() => onAction(SimulatorActions.openStore())}
                                    aria-label={`Download ${app.name}`}
                                >
                                    Download
                                </SimulatorButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={simLayout.stack}>
            <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Store</div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Test"
                ariaLabel="Search store"
                className={simSpacing.mb3}
            />
            {storeContent}
        </div>
    );
}

/** Settings subview: header, search, sections (title + input). Back returns to Home. */
function HomeSettingsScreen({
    settingsSections,
    onBack,
}: Readonly<{
    settingsSections: SimulatorHomeSettingsSection[];
    onBack: () => void;
}>) {
    const [search, setSearch] = useState('');

    return (
        <div className={simLayout.stack}>
            <SimulatorDetailBackBar onBack={onBack} title="Settings" ariaLabel="Back to Home" />
            <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Settings</div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Test"
                ariaLabel="Search settings"
                className={simSpacing.mb3}
            />
            {settingsSections.length === 0 ? (
                <p className={simTypo.emptyState}>No settings.</p>
            ) : (
                <div className={joinClasses(SIM_FLEX_COL, 'simulator-spacing--gap-3')}>
                    {settingsSections.map((section) => (
                        <div key={section.id} className={joinClasses(simBorder.tile, SIM_ROUNDED_NONE, simSpacing.p3, SIM_SURFACE_WHITE)}>
                            <SimulatorField>
                                <SimulatorLabel className={joinClasses(simLayout.fieldLabel, 'simulator-text--block', simSpacing.mb2)}>
                                    {section.title}
                                </SimulatorLabel>
                                <SimulatorInput
                                    type="text"
                                    placeholder=""
                                    className={SIM_ROUNDED_NONE}
                                    aria-label={section.title}
                                />
                            </SimulatorField>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Home dashboard: centered header, search, Store and Settings as rectangular buttons. */
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
    const [search, setSearch] = useState('');

    return (
        <div className={simLayout.stack}>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search"
                className={simSpacing.mb3}
            />
            {(hasStore || hasSettings) && (
                <div className={joinClasses(simLayout.actionsRow, simSpacing.mb3)}>
                    {hasStore && (
                        <SimulatorButton
                            tone="light"
                            className={dashboardNavBtnClass}
                            onClick={() => {
                                onAction(SimulatorActions.openStore());
                                onNavigate('store');
                            }}
                            aria-label="Store"
                        >
                            Store
                        </SimulatorButton>
                    )}
                    {hasSettings && (
                        <SimulatorButton
                            tone="light"
                            className={dashboardNavBtnClass}
                            onClick={() => {
                                onAction(SimulatorActions.openSettings());
                                onNavigate('settings');
                            }}
                            aria-label="Settings"
                        >
                            Settings
                        </SimulatorButton>
                    )}
                </div>
            )}
            {widgets.length > 0 && (
                <div className={joinClasses(simLayout.actionsRow, 'simulator-flex--wrap')}>
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
            {widgets.length === 0 && !hasStore && !hasSettings && (
                <p className={simTypo.emptyState}>No content on home.</p>
            )}
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

    if (screen === 'store') {
        return <HomeStoreScreen featuredApps={featuredApps} onBack={onBack} onAction={onAction} />;
    }
    if (screen === 'settings') {
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
