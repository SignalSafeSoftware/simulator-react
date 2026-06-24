/**
 * Contacts list, search, and detail inside the simulator.
 * Used from Phone app (screen=contacts) and from the Check contact panel overlay.
 * When phoneLocalNavItems is provided, shows wireframe-style phone tabs above content (Back still available).
 */
import { useMemo, useState } from 'react';
import { SimulatorList, SimulatorListItem } from '../components/SimulatorList';
import { SimulatorDetailBackBar, SimulatorDetailBlock } from '../components/SimulatorDetail';
import { SimulatorSearchInput } from '../components/SimulatorSearchInput';
import SimulatorLocalNav from '../components/SimulatorLocalNav';
import { simTypo } from '../simulatorStyles';
import type { SimulatorSessionContact } from '../types/session';
import {
    normalizeNameForMatch,
    phoneDigitsOnly,
    normalizeEmailForMatch,
    phonesMatch,
    namesMatch,
} from '../utils/contactNormalization';
export { normalizeNameForMatch as normalizeForSearch } from '../utils/contactNormalization';

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
            className={`rounded bg-primary bg-opacity-25 d-flex align-items-center justify-content-center flex-shrink-0 ${className ?? ''}`}
            style={{ width: 40, height: 40 }}
            aria-hidden
        >
            <span className="text-primary" style={{ fontSize: '1.25rem' }}>👤</span>
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
                className="mb-0 border-bottom-0 flex-shrink-0"
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
    });

    if (selected) {
        return (
            <div className="d-flex flex-column flex-grow-1 min-h-0">
                <div className="flex-grow-1 min-h-0 overflow-auto">
                    <SimulatorDetailBackBar
                        onBack={() => setSelectedId(null)}
                        title="Contact"
                        ariaLabel="Back to list"
                        titleOnly={contactDetailTitleOnly}
                    />
                    <SimulatorDetailBlock>
                        <h3 className={simTypo.subheading}>{selected.displayName}</h3>
                        {selected.number != null && selected.number !== '' && (
                            <p className="mb-1 small">
                                <span className={simTypo.secondary}>Number:</span> {selected.number}
                            </p>
                        )}
                        {selected.email != null && selected.email !== '' && (
                            <p className="mb-0 small">
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
        <div className="d-flex flex-column flex-grow-1 min-h-0">
            <div className="flex-grow-1 min-h-0 overflow-auto">
                {phoneLocalNavItems != null && phoneLocalNavItems.length > 0 && (
                    <div className="text-center border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                        Contacts
                    </div>
                )}
                {onAddContact == null ? (
                    <SimulatorDetailBackBar onBack={onBack} title={title} ariaLabel="Back" titleOnly />
                ) : (
                    <div className="d-flex align-items-center justify-content-between border-bottom border-secondary py-2 mb-2 small fw-semibold text-body">
                        <span className="flex-grow-1 text-center">{title}</span>
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm rounded-0 py-1 px-2 me-2"
                            onClick={onAddContact}
                            aria-label="Add contact"
                        >
                            Add
                        </button>
                    </div>
                )}

                {verificationContext && (verificationContext.number || verificationContext.name) && (
                    <div className={`${simTypo.secondaryTight} p-2 rounded bg-light border`}>
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
                    className="mb-2"
                    dataSimulatorSearch
                />

                {listContent}
            </div>
            {phoneNavBlock}
        </div>
    );
}

function openContact(
    contactId: string,
    setSelectedId: (value: string | null) => void,
    onOpenContact?: (contactId: string) => void
): void {
    setSelectedId(contactId);
    onOpenContact?.(contactId);
}

function renderPhoneContactList(
    filtered: SimulatorSessionContact[],
    setSelectedId: (value: string | null) => void,
    onOpenContact?: (contactId: string) => void
): JSX.Element {
    return (
        <div className="list-group list-group-flush">
            {filtered.map((c) => (
                <button
                    type="button"
                    key={c.id}
                    onClick={() => openContact(c.id, setSelectedId, onOpenContact)}
                    className="d-flex w-100 align-items-center gap-3 py-3 px-2 border border-secondary border-top-0 rounded-0 bg-white text-start"
                    style={{ cursor: 'pointer' }}
                >
                    <ContactProfileIcon />
                    <div className="d-flex flex-column min-w-0 flex-grow-1">
                        <span className="fw-medium text-truncate">{c.displayName}</span>
                        {c.number && <span className="small text-muted text-truncate">{c.number}</span>}
                        {c.email && !c.number && <span className="small text-muted text-truncate">{c.email}</span>}
                    </div>
                </button>
            ))}
        </div>
    );
}

function renderCompactContactList(
    filtered: SimulatorSessionContact[],
    setSelectedId: (value: string | null) => void,
    onOpenContact?: (contactId: string) => void
): JSX.Element {
    return (
        <SimulatorList>
            {filtered.map((c) => (
                <SimulatorListItem
                    key={c.id}
                    variant="compact"
                    onClick={() => openContact(c.id, setSelectedId, onOpenContact)}
                    className="justify-content-between"
                >
                    <span className="fw-medium">{c.displayName}</span>
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
}: Readonly<{
    list: SimulatorSessionContact[];
    filtered: SimulatorSessionContact[];
    searchQuery: string;
    phoneLocalNavItems?: { id: string; label: string }[];
    setSelectedId: (value: string | null) => void;
    onOpenContact?: (contactId: string) => void;
}>): JSX.Element {
    if (list.length === 0) {
        return <p className={simTypo.emptyState}>No contacts.</p>;
    }
    if (filtered.length === 0) {
        return <p className={simTypo.emptyState}>{simTypo.emptyStateNoResultsMessage(searchQuery)}</p>;
    }
    if (phoneLocalNavItems != null && phoneLocalNavItems.length > 0) {
        return renderPhoneContactList(filtered, setSelectedId, onOpenContact);
    }
    return renderCompactContactList(filtered, setSelectedId, onOpenContact);
}
