import { useSimulatorLocale } from '../i18n/SimulatorLocale.js';
/**
 * Official directory / trusted sources in the Phone app.
 * When phoneLocalNavItems is provided, shows wireframe-style phone tabs above content.
 */
import { useState } from 'react';
import type {
    SimulatorAction,
    SimulatorDirectoryEntry,
    SimulatorSessionContact,
} from '../types/session.js';
import { SimulatorActions } from '../actions/index.js';
import SimulatorLocalNav from '../components/SimulatorLocalNav.js';
import { SimulatorDetailBackBar } from '../components/SimulatorDetail.js';
import { SimulatorList, SimulatorListItem } from '../components/SimulatorList.js';
import { simBorder, simLayout, simSpacing, simTypo } from '../simulatorStyles.js';
import { SimulatorButton } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_LIGHT,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';

export interface DirectoryViewProps {
    directory: SimulatorDirectoryEntry[] | null;
    contacts: SimulatorSessionContact[] | null;
    onBack: () => void;
    onAction: (action: SimulatorAction) => void;
    /** Called when user opens an entry (before showing detail); emits directory_entry_viewed. */
    onViewEntry?: (entryId: string) => void;
    /** When set (phone app context), show phone secondary nav above content. */
    phoneLocalNavItems?: { id: string; label: string }[];
    phoneActiveId?: string;
    onPhoneNavSelect?: (id: string) => void;
    /** Open with this directory entry selected (README / harness screenshots). */
    initialSelectedDirectoryId?: string | null;
}

function findContact(
    contacts: SimulatorSessionContact[] | null,
    id: string | null | undefined,
): SimulatorSessionContact | null {
    if (!id || !contacts) return null;
    return contacts.find((c) => c.id === id) ?? null;
}

export default function DirectoryView({
    directory,
    contacts,
    onBack,
    onAction,
    onViewEntry,
    phoneLocalNavItems,
    phoneActiveId = 'directory',
    onPhoneNavSelect,
    initialSelectedDirectoryId = null,
}: Readonly<DirectoryViewProps>) {
    const screenLocale = useSimulatorLocale();

    const [selectedId, setSelectedId] = useState<string | null>(
        () => initialSelectedDirectoryId ?? null,
    );
    const entries = directory ?? [];
    const selected = entries.find((e) => e.id === selectedId);

    const handleSelect = (entry: SimulatorDirectoryEntry) => {
        setSelectedId(entry.id);
        onViewEntry?.(entry.id);
    };

    const handleCallContact = (contactId: string) => {
        onAction(SimulatorActions.openContact(contactId));
    };

    const handleDial = (number: string) => {
        onAction(SimulatorActions.dialPhone(number));
    };

    if (entries.length === 0) {
        return (
            <div className={joinClasses(simLayout.stack, SIM_TEXT_SM)}>
                {phoneLocalNavItems != null &&
                    phoneLocalNavItems.length > 0 &&
                    onPhoneNavSelect && (
                        <SimulatorLocalNav
                            items={phoneLocalNavItems}
                            activeId={phoneActiveId}
                            onSelect={onPhoneNavSelect}
                            aria-label={screenLocale.t('screen.directoryView.phone.tabs')}
                        />
                    )}
                <SimulatorDetailBackBar
                    onBack={onBack}
                    title={screenLocale.t('screen.directoryView.directory')}
                    ariaLabel={screenLocale.t('a11y.back')}
                    titleOnly
                />
                <p className={joinClasses(SIM_MUTED, simSpacing.mb0)}>
                    {screenLocale.t('screen.directoryView.no.directory.for.this.scenario')}
                </p>
            </div>
        );
    }

    return (
        <div className={simLayout.stack}>
            {phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && onPhoneNavSelect && (
                <SimulatorLocalNav
                    items={phoneLocalNavItems}
                    activeId={phoneActiveId}
                    onSelect={onPhoneNavSelect}
                    aria-label={screenLocale.t('screen.directoryView.phone.tabs')}
                />
            )}
            <SimulatorDetailBackBar
                onBack={onBack}
                title={screenLocale.t('screen.directoryView.directory')}
                ariaLabel={screenLocale.t('a11y.back')}
                titleOnly
            />
            <p
                className={joinClasses(simTypo.secondary, simSpacing.mb2)}
                style={{ fontSize: '0.8rem' }}
            >
                {screenLocale.t(
                    'screen.directoryView.use.these.numbers.or.links.to.verify.information',
                )}
            </p>
            {selected ? (
                <div
                    className={joinClasses(
                        simBorder.tile,
                        SIM_ROUNDED_NONE,
                        simSpacing.p3,
                        SIM_SURFACE_LIGHT,
                    )}
                >
                    <div className={joinClasses(simLayout.rowBetween, simSpacing.mb2)}>
                        <strong>{selected.label}</strong>
                        <SimulatorButton
                            tone="link"
                            className={joinClasses(
                                'simulator-btn--sm',
                                'simulator-btn--plain',
                                'simulator-text--secondary',
                            )}
                            onClick={() => setSelectedId(null)}
                        >
                            {screenLocale.t('screen.directoryView.change')}
                        </SimulatorButton>
                    </div>
                    {selected.description && (
                        <p className={joinClasses(SIM_TEXT_SM, SIM_MUTED, simSpacing.mb2)}>
                            {selected.description}
                        </p>
                    )}
                    {selected.contact_id &&
                        (() => {
                            const contact = findContact(contacts, selected.contact_id);
                            if (contact) {
                                return (
                                    <div className={simSpacing.mb2}>
                                        <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED)}>
                                            {contact.displayName}
                                        </span>
                                        {contact.number && (
                                            <span
                                                className={joinClasses(SIM_TEXT_SM, simSpacing.ms2)}
                                            >
                                                {contact.number}
                                            </span>
                                        )}
                                        <div className={simSpacing.mt1}>
                                            <SimulatorButton
                                                tone="primary"
                                                className="simulator-btn--sm"
                                                onClick={() => handleCallContact(contact.id)}
                                            >
                                                {screenLocale.t('screen.directoryView.call')}
                                            </SimulatorButton>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    {!selected.contact_id && selected.number && (
                        <div className={simSpacing.mb2}>
                            <span className={SIM_TEXT_SM}>{selected.number}</span>
                            <div className={simSpacing.mt1}>
                                <SimulatorButton
                                    tone="primary"
                                    className="simulator-btn--sm"
                                    onClick={() => handleDial(selected.number!)}
                                >
                                    {screenLocale.t('screen.directoryView.call')}
                                </SimulatorButton>
                            </div>
                        </div>
                    )}
                    {selected.url && (
                        <p
                            className={joinClasses(
                                SIM_TEXT_SM,
                                simSpacing.mb0,
                                'simulator-text--break',
                            )}
                        >
                            <span className={SIM_MUTED}>
                                {screenLocale.t('screen.directoryView.url')}
                            </span>
                            {selected.url}
                        </p>
                    )}
                </div>
            ) : (
                <SimulatorList className={joinClasses(simBorder.tile, 'simulator-rounded')}>
                    {entries.map((entry) => (
                        <SimulatorListItem
                            key={entry.id}
                            onClick={() => handleSelect(entry)}
                            className={simSpacing.py2}
                        >
                            {entry.label}
                        </SimulatorListItem>
                    ))}
                </SimulatorList>
            )}
        </div>
    );
}
