/**
 * Home app: dashboard (Store/Settings launcher), Store (app cards), Settings (sections + inputs).
 * Wireframe: centered headers, search bar, rectangular buttons/cards. Store and Settings are subviews; Back returns to Home.
 */
import {
    SIM_AVATAR,
    SIM_BTN_SM,
    SIM_FLEX_CENTER,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MIN_W_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
    SimulatorButtonTone,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { UserRound } from 'lucide-react';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { useState, type ReactNode } from 'react';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import type { SimulatorAction, SimulatorHomeStoreApp } from '../../types/session.js';
import { SimulatorActions } from '../../actions/simulatorActions.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import { SimulatorButton } from '../../ui/primitives.js';

export function StoreAppIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={joinClasses(
                SIM_AVATAR,
                SIM_SURFACE_AVATAR,
                SIM_FLEX_CENTER,
                SIM_FLEX_SHRINK_0,
                className,
            )}
            style={{ width: 48, height: 48 }}
            aria-hidden
        >
            <span className='simulator-text--primary' style={{ fontSize: '1.5rem' }}>
                <UserRound size={24} strokeWidth={1.5} aria-hidden='true' />
            </span>
        </div>
    );
}

export const storeCardClass = joinClasses(
    simBorder.tile,
    SIM_ROUNDED_NONE,
    simSpacing.p3,
    SIM_SURFACE_WHITE,
    simLayout.row,
    'simulator-flex--align-start',
    simSpacing.gap2,
);
/** Store subview: header, search, app cards (icon, name, Download). Back returns to Home. */
export function HomeStoreScreen({
    featuredApps,
    onAction,
}: Readonly<{
    featuredApps: SimulatorHomeStoreApp[];
    onAction: (action: SimulatorAction) => void;
}>) {
    const screenLocale = useSimulatorLocale();

    const [search, setSearch] = useState('');
    const filtered = search.trim()
        ? featuredApps.filter((a) => a.name.toLowerCase().includes(search.toLowerCase().trim()))
        : featuredApps;
    let storeContent: ReactNode;
    if (featuredApps.length === 0) {
        storeContent = (
            <p className={simTypo.emptyState}>
                {screenLocale.t('screen.homeSimulatorView.no.apps')}
            </p>
        );
    } else if (filtered.length === 0) {
        storeContent = (
            <p className={simTypo.emptyState}>
                {screenLocale.t('screen.homeSimulatorView.no.results')}
            </p>
        );
    } else {
        storeContent = (
            <div className={simLayout.stack}>
                {filtered.map((app) => (
                    <div key={app.id} className={storeCardClass}>
                        <StoreAppIcon />
                        <div className={joinClasses(SIM_FLEX_COL, SIM_MIN_W_0, SIM_FLEX_GROW_1)}>
                            <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_BODY)}>
                                {app.name}
                            </span>
                            <div className={joinClasses(simLayout.rowBetween, simSpacing.mt2)}>
                                <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                                    {screenLocale.t('screen.homeSimulatorView.app')}
                                </span>
                                <SimulatorButton
                                    tone={SimulatorButtonTone.Primary}
                                    className={joinClasses(SIM_BTN_SM, SIM_ROUNDED_NONE)}
                                    onClick={() => onAction(SimulatorActions.openStore())}
                                    aria-label={screenLocale.t(
                                        'screen.homeSimulatorView.download.value1',
                                        { value1: String(app.name) },
                                    )}
                                >
                                    {screenLocale.t('screen.homeSimulatorView.download')}
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
            <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>
                {screenLocale.t('screen.homeSimulatorView.store')}
            </div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                placeholder={screenLocale.t('screen.homeSimulatorView.search.apps')}
                ariaLabel={screenLocale.t('a11y.search.store')}
                className={simSpacing.mb3}
            />
            {storeContent}
        </div>
    );
}
