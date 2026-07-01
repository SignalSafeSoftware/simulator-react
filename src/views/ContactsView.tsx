/**
 * Contacts list, search, and detail inside the simulator.
 * Used from Phone app (screen=contacts) and from the Check contact panel overlay.
 * When phoneLocalNavItems is provided, shows wireframe-style phone tabs above content (Back still available).
 */
import { useMemo, useState } from 'react';
import { SimulatorList, SimulatorListItem } from '../components/SimulatorList.js';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../components/SimulatorDetail.js';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput.js';
import SimulatorLocalNav from '../components/SimulatorLocalNav.js';
import { simLayout, simRowSurface, simScreen, simSpacing, simTypo } from '../simulatorStyles.js';
import { SimulatorButton } from '../ui/primitives.js';
import {
    joinClasses,
    SIM_AVATAR,
    SIM_BORDER,
    SIM_FLEX_COL,
    SIM_FLEX_GROW_1,
    SIM_FLEX_SHRINK_0,
    SIM_MUTED,
    SIM_ROUNDED_NONE,
    SIM_SURFACE_AVATAR,
    SIM_SURFACE_LIGHT,
    SIM_SURFACE_WHITE,
    SIM_TEXT_MEDIUM,
    SIM_TEXT_SM,
} from '../ui/simulatorClasses.js';
import {
    SIM_PHONE_CONTACT_DETAIL,
    SIM_PHONE_CONTACT_LIST,
    SIM_PHONE_CONTACT_ROW,
    SIM_PHONE_CONTACT_ROW_AVATAR,
} from '../ui/semanticSimulatorClasses.js';
import type { SimulatorSessionContact } from '../types/session.js';
import {
    normalizeNameForMatch,
    phoneDigitsOnly,
    normalizeEmailForMatch,
    phonesMatch,
    namesMatch,
} from '../utils/contactNormalization.js';
export { normalizeNameForMatch as normalizeForSearch } from '../utils/contactNormalization.js';

export interface ContactsViewProps {
    contacts: SimulatorSessionContact[] | null;
    onBack: () => void;
    /** When opened from "Check contact", pass the name/number being verified so we can show match status. */
    verificationContext?: { name?: string; number?: string } | null;
    /** Optional title (e.g. "Contacts" in app, "Verify contact" in panel). */
    title?: string;
    /** Called when user opens a contact (navigates to detail). */
    onOpenContact?: (contactId: string) => void;
    /** Called when user performs a search (e.g. Enter in search field). Emits search_performed when provided. */
    onSearchSubmit?: (query: string) => void;
    /** Optional initial search query (e.g. from deep-link). When provided with onSearchChange, search is controlled (state stored in shell). */
    initialSearch?: string;
    /** Controlled search query (e.g. from view state); when set, use with onSearchChange. */
    searchQuery?: string;
    /** Called when search input changes (for controlled state restoration). */
    onSearchChange?: (query: string) => void;
    /** When set (phone app context), show phone secondary nav above content. */
    phoneLocalNavItems?: { id: string; label: string }[];
    /** Active phone tab id (e.g. "contacts"). */
    phoneActiveId?: string;
    /** When user selects a phone tab (e.g. History, Dial). */
    onPhoneNavSelect?: (id: string) => void;
    /** When set, show a plus button in the header to add a contact (e.g. navigate to Add Contact screen). */
    onAddContact?: () => void;
    /** Open with this contact id selected (detail view) — e.g. README / harness screenshots. */
    initialSelectedContactId?: string | null;
    /** When true, contact detail shows title only (no ← Back) for tight wireframe captures. */
    contactDetailTitleOnly?: boolean;
    /** When true, row clicks invoke {@link onPhoneContactOpen} instead of internal detail view. */
    hostOwnsPhoneContactDetail?: boolean;
    /** Called when host owns contact detail; shell injects state/dispatch before invoking host callback. */
    onPhoneContactOpen?: (contactId: string, contact: SimulatorSessionContact) => void;
}

/** True if contact matches query (name, number, or email). Exported for tests. */
export function contactMatchesSearch(contact: SimulatorSessionContact, query: string): boolean {
    if (!query) return true;
    const qName = normalizeNameForMatch(query);
    const qPhone = phoneDigitsOnly(query);
    const qEmail = normalizeEmailForMatch(query);
    if (!qName && !qPhone && !qEmail) return false;
    if (qName && normalizeNameForMatch(contact.displayName).includes(qName)) return true;
    if (contact.number && qPhone && phoneDigitsOnly(contact.number).includes(qPhone)) return true;
    if (contact.email && (qEmail ? normalizeEmailForMatch(contact.email).includes(qEmail) : normalizeNameForMatch(contact.email).includes(qName)))
        return true;
    return false;
}

/** True if verification context (name/number) matches contact. Exported for tests. */
export function contextMatchesContact(
    contact: SimulatorSessionContact,
    ctx: { name?: string; number?: string }
): boolean {
    if (ctx.number && contact.number && phonesMatch(contact.number, ctx.number)) return true;
    if (ctx.name && contact.displayName && namesMatch(contact.displayName, ctx.name)) return true;
    return false;
}

const CONTACTS_SEARCH_PLACEHOLDER = 'Search by name, number, or email';

/** Blue profile icon for phone-style contact rows (wireframe). */
function ContactProfileIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <div
            className={joinClasses(
                SIM_PHONE_CONTACT_ROW_AVATAR,
                SIM_AVATAR,
                SIM_SURFACE_AVATAR,
                'simulator-flex simulator-flex--center',
                SIM_FLEX_SHRINK_0,
                className,
            )}
            style={{ width: 40, height: 40 }}
            aria-hidden
        >
            <span className="simulator-text--primary" style={{ fontSize: '1.25rem' }}>👤</span>
        </div>
    );
}

export default function ContactsView({
    contacts,
    onBack,
    verificationContext,
    title = 'Contacts',
    onOpenContact,
    onSearchSubmit,
    initialSearch = '',
    searchQuery: controlledSearchQuery,
    onSearchChange,
    phoneLocalNavItems,
    phoneActiveId = 'contacts',
    onPhoneNavSelect,
    onAddContact,
    initialSelectedContactId = null,
    contactDetailTitleOnly = false,
    hostOwnsPhoneContactDetail = false,
    onPhoneContactOpen,
}: Readonly<ContactsViewProps>) {
    const [internalQuery, setInternalQuery] = useState(initialSearch);
    const isControlled = controlledSearchQuery !== undefined && onSearchChange !== undefined;
    const searchQuery = isControlled ? controlledSearchQuery : internalQuery;
    const setSearchQuery = isControlled ? onSearchChange : setInternalQuery;
    const [selectedId, setSelectedId] = useState<string | null>(() => initialSelectedContactId ?? null);

    const list = contacts ?? [];
    const filtered = useMemo(
        () => list.filter((c) => contactMatchesSearch(c, searchQuery)),
        [list, searchQuery]
    );
    const matchingContact = useMemo(() => {
        if (!verificationContext || list.length === 0) return null;
        return list.find((c) => contextMatchesContact(c, verificationContext)) ?? null;
    }, [list, verificationContext]);

    const selected = selectedId ? list.find((c) => c.id === selectedId) : null;

    const phoneNavBlock =
        phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && onPhoneNavSelect ? (
            <SimulatorLocalNav
                items={phoneLocalNavItems}
                activeId={phoneActiveId}
                onSelect={onPhoneNavSelect}
                className={joinClasses(simSpacing.mb0, 'simulator-border--bottom-none', SIM_FLEX_SHRINK_0)}
                aria-label="Phone tabs"
            />
        ) : null;

    const listContent = renderListContent({
        list,
        filtered,
        searchQuery,
        phoneLocalNavItems,
        setSelectedId,
        onOpenContact,
        hostOwnsPhoneContactDetail,
        onPhoneContactOpen,
    });

    if (selected) {
        return (
            <div className={simLayout.screenColumn}>
                <div className={simLayout.scrollBody}>
                    <SimulatorDetailBackBar
                        onBack={() => setSelectedId(null)}
                        title="Contact"
                        ariaLabel="Back to list"
                        titleOnly={contactDetailTitleOnly}
                    />
                    <SimulatorDetailBlock className={SIM_PHONE_CONTACT_DETAIL}>
                        <h3 className={simTypo.subheading}>{selected.displayName}</h3>
                        {selected.number != null && selected.number !== '' && (
                            <p className={joinClasses(simSpacing.mb1, SIM_TEXT_SM)}>
                                <span className={simTypo.secondary}>Number:</span> {selected.number}
                            </p>
                        )}
                        {selected.email != null && selected.email !== '' && (
                            <p className={joinClasses(simSpacing.mb0, SIM_TEXT_SM)}>
                                <span className={simTypo.secondary}>Email:</span> {selected.email}
                            </p>
                        )}
                    </SimulatorDetailBlock>
                </div>
                {phoneNavBlock}
            </div>
        );
    }

    return (
        <div className={simLayout.screenColumn}>
            <div className={simLayout.scrollBody}>
                {phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && (
                    <div className={joinClasses(simScreen.header, simSpacing.sectionGap)}>Contacts</div>
                )}
                {onAddContact == null ? (
                    <SimulatorDetailBackBar onBack={onBack} title={title} ariaLabel="Back" titleOnly />
                ) : (
                    <div className={simLayout.headerRowBetween}>
                        <span className={joinClasses(SIM_FLEX_GROW_1, 'simulator-text--center')}>{title}</span>
                        <SimulatorButton
                            tone="outline-primary"
                            className={joinClasses(SIM_ROUNDED_NONE, simSpacing.py1, simSpacing.px2, simSpacing.me2, 'simulator-btn--sm')}
                            onClick={onAddContact}
                            aria-label="Add contact"
                        >
                            Add
                        </SimulatorButton>
                    </div>
                )}

                {verificationContext && (verificationContext.number || verificationContext.name) && (
                    <div className={joinClasses(simTypo.secondaryTight, simSpacing.p2, SIM_ROUNDED_NONE, SIM_SURFACE_LIGHT, SIM_BORDER)}>
                        {matchingContact ? (
                            <span>
                                <span className={simTypo.secondary}>Matches saved contact: </span>
                                <strong>{matchingContact.displayName}</strong>
                                {matchingContact.number && ` (${matchingContact.number})`}
                            </span>
                        ) : (
                            <span className={simTypo.secondary}>No match in contacts for this number or name.</span>
                        )}
                    </div>
                )}

                <SimulatorSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSubmit={onSearchSubmit}
                    placeholder={CONTACTS_SEARCH_PLACEHOLDER}
                    ariaLabel="Search contacts"
                    className={simSpacing.mb2}
                    dataSimulatorSearch
                />

                {listContent}
            </div>
            {phoneNavBlock}
        </div>
    );
}

function openContact(
    contact: SimulatorSessionContact,
    setSelectedId: (value: string | null) => void,
    onOpenContact: ((contactId: string) => void) | undefined,
    hostOwnsPhoneContactDetail: boolean,
    onPhoneContactOpen: ((contactId: string, contact: SimulatorSessionContact) => void) | undefined,
): void {
    onOpenContact?.(contact.id);
    if (hostOwnsPhoneContactDetail && onPhoneContactOpen) {
        onPhoneContactOpen(contact.id, contact);
        return;
    }
    setSelectedId(contact.id);
}

function renderPhoneContactList(
    filtered: SimulatorSessionContact[],
    setSelectedId: (value: string | null) => void,
    onOpenContact: ((contactId: string) => void) | undefined,
    hostOwnsPhoneContactDetail: boolean,
    onPhoneContactOpen: ((contactId: string, contact: SimulatorSessionContact) => void) | undefined,
): JSX.Element {
    return (
        <div className={joinClasses('simulator-list--flush', SIM_PHONE_CONTACT_LIST)}>
            {filtered.map((c) => (
                <button
                    type="button"
                    key={c.id}
                    onClick={() =>
                        openContact(c, setSelectedId, onOpenContact, hostOwnsPhoneContactDetail, onPhoneContactOpen)
                    }
                    className={joinClasses(
                        simRowSurface.selectable,
                        'simulator-border--top-none',
                        SIM_SURFACE_WHITE,
                        SIM_PHONE_CONTACT_ROW,
                    )}
                    style={{ cursor: 'pointer' }}
                >
                    <ContactProfileIcon />
                    <div className={joinClasses(SIM_FLEX_COL, 'simulator-min-w-0', SIM_FLEX_GROW_1)}>
                        <span className={joinClasses(SIM_TEXT_MEDIUM, 'simulator-text--truncate')}>{c.displayName}</span>
                        {c.number && <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, 'simulator-text--truncate')}>{c.number}</span>}
                        {c.email && !c.number && <span className={joinClasses(SIM_TEXT_SM, SIM_MUTED, 'simulator-text--truncate')}>{c.email}</span>}
                    </div>
                </button>
            ))}
        </div>
    );
}

function renderCompactContactList(
    filtered: SimulatorSessionContact[],
    setSelectedId: (value: string | null) => void,
    onOpenContact: ((contactId: string) => void) | undefined,
    hostOwnsPhoneContactDetail: boolean,
    onPhoneContactOpen: ((contactId: string, contact: SimulatorSessionContact) => void) | undefined,
): JSX.Element {
    return (
        <SimulatorList>
            {filtered.map((c) => (
                <SimulatorListItem
                    key={c.id}
                    variant="compact"
                    onClick={() =>
                        openContact(c, setSelectedId, onOpenContact, hostOwnsPhoneContactDetail, onPhoneContactOpen)
                    }
                    className="simulator-flex--between"
                >
                    <span className={SIM_TEXT_MEDIUM}>{c.displayName}</span>
                    {c.number && <span className={simTypo.secondary}>{c.number}</span>}
                </SimulatorListItem>
            ))}
        </SimulatorList>
    );
}

function renderListContent({
    list,
    filtered,
    searchQuery,
    phoneLocalNavItems,
    setSelectedId,
    onOpenContact,
    hostOwnsPhoneContactDetail,
    onPhoneContactOpen,
}: Readonly<{
    list: SimulatorSessionContact[];
    filtered: SimulatorSessionContact[];
    searchQuery: string;
    phoneLocalNavItems?: { id: string; label: string }[];
    setSelectedId: (value: string | null) => void;
    onOpenContact?: (contactId: string) => void;
    hostOwnsPhoneContactDetail: boolean;
    onPhoneContactOpen?: (contactId: string, contact: SimulatorSessionContact) => void;
}>): JSX.Element {
    if (list.length === 0) {
        return <p className={simTypo.emptyState}>No contacts.</p>;
    }
    if (filtered.length === 0) {
        return <p className={simTypo.emptyState}>{simTypo.emptyStateNoResultsMessage(searchQuery)}</p>;
    }
    if (phoneLocalNavItems != null && phoneLocalNavItems.length > 0) {
        return renderPhoneContactList(
            filtered,
            setSelectedId,
            onOpenContact,
            hostOwnsPhoneContactDetail,
            onPhoneContactOpen,
        );
    }
    return renderCompactContactList(
        filtered,
        setSelectedId,
        onOpenContact,
        hostOwnsPhoneContactDetail,
        onPhoneContactOpen,
    );
}
