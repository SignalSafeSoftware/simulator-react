/**
 * Home app: dashboard (Store/Settings launcher), Store (app cards), Settings (sections + inputs).
 * Wireframe: centered headers, search bar, rectangular buttons/cards. Store and Settings are subviews; Back returns to Home.
 */
import {
    SIM_FLEX_COL,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_WHITE,
    SIM_TEXT_BODY,
    SIM_TEXT_MEDIUM,
    joinClasses,
} from '../../ui/styles/simulatorClasses.js';
import { useSimulatorLocale } from '../../i18n/SimulatorLocale.js';
import { useState } from 'react';
import { SimulatorDetailBackBar } from '../../ui/layout/SimulatorDetail.js';
import { SimulatorSearchInput } from '../../ui/lists/SimulatorSearchInput.js';
import type { SimulatorHomeSettingsSection } from '../../types/session.js';
import { simBorder, simLayout, simScreen, simSpacing, simTypo } from '../../simulatorStyles.js';
import type {} from '../../utils/payload/simulatorCapabilities.js';
import {
    SIM_HOME_SETTINGS_BACK_BAR,
    SIM_HOME_SETTINGS_HEADER,
} from '../../ui/styles/semanticSimulatorClasses.js';

/** Settings subview: header, functional title search, and read-only section labels. Back returns to Home. */
export function HomeSettingsScreen({
    settingsSections,
    onBack,
}: Readonly<{
    settingsSections: SimulatorHomeSettingsSection[];
    onBack: () => void;
}>) {
    const screenLocale = useSimulatorLocale();

    const [search, setSearch] = useState('');
    const normalizedSearch = search.trim().toLowerCase();
    const filteredSections = normalizedSearch
        ? settingsSections.filter((section) =>
              section.title.toLowerCase().includes(normalizedSearch),
          )
        : settingsSections;

    let emptySettingsMessage: string | null = null;
    if (settingsSections.length === 0) {
        emptySettingsMessage = screenLocale.t(
            'screen.homeSimulatorView.no.settings.are.configured.for.this.scenario',
        );
    } else if (filteredSections.length === 0) {
        emptySettingsMessage = screenLocale.t('screen.homeSimulatorView.no.matching.settings');
    }

    return (
        <div className={simLayout.stack}>
            <SimulatorDetailBackBar
                onBack={onBack}
                title={screenLocale.t('screen.homeSimulatorView.settings')}
                ariaLabel={screenLocale.t('a11y.back.to.home')}
                className={SIM_HOME_SETTINGS_BACK_BAR}
            />
            <div
                className={joinClasses(
                    simScreen.header,
                    simSpacing.sectionGap,
                    SIM_HOME_SETTINGS_HEADER,
                )}
            >
                {screenLocale.t('screen.homeSimulatorView.settings')}
            </div>
            <SimulatorSearchInput
                value={search}
                onChange={setSearch}
                placeholder={screenLocale.t('screen.homeSimulatorView.search.settings')}
                ariaLabel={screenLocale.t('a11y.search.settings')}
                className={simSpacing.mb3}
            />
            {emptySettingsMessage !== null ? (
                <p className={simTypo.emptyState}>{emptySettingsMessage}</p>
            ) : (
                <div className={joinClasses(SIM_FLEX_COL, 'simulator-spacing--gap-3')}>
                    {filteredSections.map((section) => (
                        <div
                            key={section.id}
                            className={joinClasses(
                                simBorder.tile,
                                SIM_ROUNDED_NONE,
                                simSpacing.p3,
                                SIM_SURFACE_WHITE,
                            )}
                        >
                            <span className={joinClasses(SIM_TEXT_MEDIUM, SIM_TEXT_BODY)}>
                                {section.title}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
