/**
 * Home app: dashboard (Store/Settings launcher), Store (app cards), Settings (sections + inputs).
 * Wireframe: centered headers, search bar, rectangular buttons/cards. Store and Settings are subviews; Back returns to Home.
 */
import { useState, type ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput';
import type {
    HomeScreenId,
    SimulatorAction,
    SimulatorHomePayload,
    SimulatorHomeStoreApp,
    SimulatorHomeSettingsSection,
} from '../types/session';
import { SimulatorActions } from '../actions';
import { simTypo } from '../simulatorStyles';
import type { SimulatorCapabilities } from '../utils/simulatorCapabilities';

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
            className={`rounded bg-primary bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0 ${className ?? ''}`}
            style={{ width: 48, height: 48 }}
            aria-hidden
        >
            <span className="text-primary" style={{ fontSize: '1.5rem' }}>👤</span>
        </div>
    );
}

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
            <div className="d-flex flex-column gap-2">
                {filtered.map((app) => (
                    <div
                        key={app.id}
                        className="border border-secondary rounded-0 p-3 bg-white d-flex align-items-start gap-3"
                    >
                        <StoreAppIcon />
                        <div className="d-flex flex-column min-w-0 flex-grow-1">
                            <span className="fw-medium text-body">{app.name}</span>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                                <span className="small text-muted">App</span>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm rounded-0"
                                    onClick={() => onAction(SimulatorActions.openStore())}
                                    aria-label={`Download ${app.name}`}
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="d-flex flex-column">
            <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                Store
            </div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Test"
                ariaLabel="Search store"
                className="mb-3"
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
        <div className="d-flex flex-column">
            <SimulatorDetailBackBar onBack={onBack} title="Settings" ariaLabel="Back to Home" />
            <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                Settings
            </div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Test"
                ariaLabel="Search settings"
                className="mb-3"
            />
            {settingsSections.length === 0 ? (
                <p className={simTypo.emptyState}>No settings.</p>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {settingsSections.map((section) => (
                        <div
                            key={section.id}
                            className="border border-secondary rounded-0 p-3 bg-white"
                        >
                            <label className="small fw-medium text-body d-block mb-2">{section.title}</label>
                            <Form.Control
                                type="text"
                                placeholder=""
                                className="rounded-0"
                                aria-label={section.title}
                            />
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
        <div className="d-flex flex-column">
            {/* App identity is the shell bottom nav; do not render doc-only "Home" diagram label inside content. */}
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                onSubmit={() => {}}
                placeholder="Q Search"
                ariaLabel="Search"
                className="mb-3"
            />
            {(hasStore || hasSettings) && (
                <div className="d-flex gap-2 mb-3">
                    {hasStore && (
                        <button
                            type="button"
                            className="btn btn-light border border-secondary rounded-0 flex-grow-1 py-3 fw-medium"
                            onClick={() => {
                                onAction(SimulatorActions.openStore());
                                onNavigate('store');
                            }}
                            aria-label="Store"
                        >
                            Store
                        </button>
                    )}
                    {hasSettings && (
                        <button
                            type="button"
                            className="btn btn-light border border-secondary rounded-0 flex-grow-1 py-3 fw-medium"
                            onClick={() => {
                                onAction(SimulatorActions.openSettings());
                                onNavigate('settings');
                            }}
                            aria-label="Settings"
                        >
                            Settings
                        </button>
                    )}
                </div>
            )}
            {widgets.length > 0 && (
                <div className="d-flex flex-wrap gap-2">
                    {widgets.map((w) => (
                        <div
                            key={w.id}
                            className="border border-secondary rounded-0 p-2 small text-center bg-white"
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
